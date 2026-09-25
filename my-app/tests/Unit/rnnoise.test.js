// @vitest-environment happy-dom
import { RNNOISE, loadRnnoiseModule, downsample48kTo16k } from "@/lib/rnnoise.js";

const zeros = (n) => new Float32Array(n);
const at = (v, n) => new Float32Array(n).fill(v);

describe("downsample48kTo16k — 48k box-filter decimate to 16k", () => {
    test("128-sample worklet frame -> 42 samples", () => {
        expect(downsample48kTo16k(zeros(128)).length).toBe(42);
    });

    test("constant input passes through at the same level", () => {
        expect(Array.from(downsample48kTo16k(at(0.3, 128)))).toEqual(
            Array.from(at(0.3, 42)),
        );
    });

    test("each output is the mean of its 3-sample group", () => {
        const frame = new Float32Array([0.0, 0.3, 0.6, 1.0, 1.0, 1.0]);
        const out = downsample48kTo16k(frame);
        expect(out.length).toBe(2);
        expect(out[0]).toBeCloseTo(0.3, 5);
        expect(out[1]).toBeCloseTo(1.0, 5);
    });

    test("trailing partial group is dropped, never reads out of bounds", () => {
        expect(downsample48kTo16k(zeros(5)).length).toBe(1);
        expect(downsample48kTo16k(zeros(2)).length).toBe(0);
        expect(downsample48kTo16k(zeros(0)).length).toBe(0);
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
