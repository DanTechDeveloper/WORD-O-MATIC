// @vitest-environment happy-dom
import {
    RNNOISE,
    loadRnnoiseModule,
    downsample48kTo16k,
    resetRnnoiseFilter,
} from "@/lib/rnnoise.js";

const zeros = (n) => new Float32Array(n);
const at = (v, n) => new Float32Array(n).fill(v);

const RMS_REF = 0.3 / Math.SQRT2; // full-scale sine at 0.3 peak
const db = (r) => 20 * Math.log10(r / RMS_REF);

// Continuous phase across blocks — a per-block reset would inject a
// discontinuity every 2.67ms and corrupt every RMS reading below.
function feed(freq, blocks = 52, amp = 0.3) {
    let phase = 0;
    const collected = [];
    for (let b = 0; b < blocks; b++) {
        const frame = new Float32Array(128);
        for (let i = 0; i < 128; i++) {
            frame[i] = amp * Math.sin(phase);
            phase += (2 * Math.PI * freq) / 48000;
        }
        const out = downsample48kTo16k(frame);
        if (b >= 12) collected.push(...out); // let the filter reach steady state
    }
    return Math.sqrt(
        collected.reduce((a, v) => a + v * v, 0) / collected.length,
    );
}

describe("downsample48kTo16k — 48k anti-aliased decimate to 16k", () => {
    beforeEach(() => resetRnnoiseFilter());

    test("128-sample worklet frame -> 42 samples", () => {
        expect(downsample48kTo16k(zeros(128)).length).toBe(42);
    });

    test("the speech band passes at unity", () => {
        // A filter that mangles 1kHz would cost more than the aliasing it
        // removes. -0.05dB measured.
        expect(db(feed(1000))).toBeGreaterThan(-0.5);
        expect(db(feed(1000))).toBeLessThan(0.5);
    });

    test("8kHz — the fold boundary — is rejected hard", () => {
        // The old bare 3-tap box left only -9.5dB here. Measured -34dB.
        const speech = db(feed(1000));
        expect(speech - db(feed(8000))).toBeGreaterThan(20);
    });

    test("12kHz aliasing is suppressed, not passed through", () => {
        // THE anti-alias proof, and it fails on the old bare box. Measured:
        // before -9.5dB, after -43dB.
        const speech = db(feed(1000));
        expect(db(feed(12000))).toBeLessThan(-25);
        expect(speech - db(feed(12000))).toBeGreaterThan(25);
    });

    test("the filter is continuous, not restarted per block", () => {
        // Zero-padding each block instead truncates ~37% off the first and
        // last output of EVERY block (a 375Hz tremolo) — worse than the
        // aliasing. Carried history keeps it at a 0.73dB ripple.
        const rms = feed(1000);
        expect(db(rms)).toBeGreaterThan(-0.5);
        // Warm up past stream start (one truncated block is the accepted
        // ceiling), then a DC stream must hold every sample at unity —
        // a per-block restart would dip ~37% on each block's first sample.
        for (let b = 0; b < 6; b++) downsample48kTo16k(at(0.3, 128));
        for (let b = 0; b < 6; b++) {
            const out = downsample48kTo16k(at(0.3, 128));
            for (const v of out) {
                expect(v).toBeGreaterThan(0.3 * 0.85);
                expect(v).toBeLessThan(0.3 * 1.15);
            }
        }
    });

    test("trailing partial group is dropped, never reads out of bounds", () => {
        expect(downsample48kTo16k(zeros(5)).length).toBe(1);
        expect(downsample48kTo16k(zeros(2)).length).toBe(0);
        expect(downsample48kTo16k(zeros(0)).length).toBe(0);
    });

    test("a short frame is filtered, not amplified into garbage", () => {
        // Carried history is why this needs no special case: the 6-sample
        // frame reads real history instead of mostly zeros.
        for (let b = 0; b < 8; b++) downsample48kTo16k(at(0.3, 128));
        const short = downsample48kTo16k(at(0.3, 6));
        expect(short.length).toBe(2);
        for (const v of short) {
            expect(Number.isFinite(v)).toBe(true);
            expect(v).toBeGreaterThan(0.3 * 0.85);
            expect(v).toBeLessThan(0.3 * 1.15);
        }
    });
});

describe("loadRnnoiseModule — vendored wasm fetch", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("failed fetch rejects (caller falls back to peak-gate)", async () => {
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
        await expect(loadRnnoiseModule()).rejects.toThrow(
            "rnnoise_wasm_fetch_failed",
        );
        expect(fetch).toHaveBeenCalledWith(RNNOISE.wasmSrc);
    });

    test("non-wasm bytes reject via WebAssembly.compile", async () => {
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                arrayBuffer: async () => new Uint8Array([0, 1, 2, 3]).buffer,
            })),
        );
        await expect(loadRnnoiseModule()).rejects.toThrow();
    });
});

describe("createRnnoiseNode — vendor wiring", () => {
    afterEach(() => {
        vi.unstubAllGlobals();
    });

    test("registers our vendored worklet and constructs the node", async () => {
        // ponytail: vendor module extends AudioWorkletNode at load — stub it
        // before the lazy import, like a real browser would provide.
        const instances = [];
        class FakeWorkletNode {
            constructor(ctx, name, opts) {
                this.ctx = ctx;
                this.name = name;
                this.opts = opts;
                this.port = { postMessage: vi.fn() };
                instances.push(this);
            }
            connect() {}
            disconnect() {}
        }
        vi.stubGlobal("AudioWorkletNode", FakeWorkletNode);

        const addModule = vi.fn(async () => {});
        const audioCtx = { audioWorklet: { addModule } };
        vi.stubGlobal(
            "fetch",
            vi.fn(async () => ({
                ok: true,
                arrayBuffer: async () => new ArrayBuffer(8),
            })),
        );
        const compileSpy = vi.spyOn(WebAssembly, "compile").mockResolvedValue("MOD");

        const { createRnnoiseNode } = await import("@/lib/rnnoise.js");
        const node = await createRnnoiseNode(audioCtx);

        expect(addModule).toHaveBeenCalledWith(RNNOISE.workletSrc);
        expect(node.name).toBe("rnnoise");
        expect(node.opts.processorOptions.module).toBe("MOD");
        compileSpy.mockRestore();
    });

    test("asset failure rejects (hook falls back, mic never breaks)", async () => {
        // ponytail: rejecting addModule fails every vendor path (fresh
        // register AND the ready early-return), so this holds regardless
        // of module-registry state leaked from the test above.
        vi.resetModules();
        vi.stubGlobal("AudioWorkletNode", class {});
        vi.stubGlobal("fetch", vi.fn(async () => ({ ok: false })));
        const { createRnnoiseNode } = await import("@/lib/rnnoise.js");
        const addModule = vi.fn(async () => {
            throw new Error("no worklet");
        });
        await expect(
            createRnnoiseNode({ audioWorklet: { addModule } }),
        ).rejects.toThrow();
    });
});
