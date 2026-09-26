// ponytail: RNNoise (xiph/rnnoise via simple-rnnoise-wasm 1.1.0) — local ML
// denoise, fully client-side, no audio leaves the device. The model is
// 48kHz-native, so the mic AudioContext runs at 48k and pushPcm decimates
// back to 16k for Deepgram. Assets vendored in public/rnnoise/ (pinned —
// no CDN, kids' audio stays local): the .wasm is stock 1.1.0, the worklet
// is a guarded fork (empty-input guard — upstream crashes on mic warmup).
// The npm dep is only the JS API (lazy-imported below, never at top).

export const RNNOISE = {
    workletSrc: "/rnnoise/rnnoise.worklet.js",
    wasmSrc: "/rnnoise/rnnoise.wasm",
    inRate: 48000,
    outRate: 16000,
};

// ponytail: ArrayBuffer+compile instead of compileStreaming — no dependency
// on the server sending .wasm with the right MIME (Caddy yes, lampp no).
export async function loadRnnoiseModule() {
    const resp = await fetch(RNNOISE.wasmSrc);
    if (!resp.ok) throw new Error("rnnoise_wasm_fetch_failed");
    return WebAssembly.compile(await resp.arrayBuffer());
}

// Registers the worklet + constructs the node. Throws on any failure —
// the caller falls back to the legacy peak-gate path (audioGate.js)
// instead of breaking the mic.
//
// ponytail: lazy import — the vendor module extends AudioWorkletNode at
// load time (absent in test envs), and this keeps it out of the initial
// bundle; WASM only downloads when the mic actually opens.
export async function createRnnoiseNode(audioCtx) {
    const { RNNoiseNode } = await import("simple-rnnoise-wasm");
    const modulePromise = loadRnnoiseModule();
    // ponytail: mark handled — on the vendor early-return path (module
    // already registered by an earlier mount) nothing else touches this
    // promise, and a failed refetch would log an unhandled rejection.
    // Register still surfaces the error through its own await below.
    modulePromise.catch(() => {});
    await RNNoiseNode.register(audioCtx, [RNNOISE.workletSrc, modulePromise]);
    return new RNNoiseNode(audioCtx);
}

// ponytail: 48k→16k decimate for Deepgram. The anti-alias lowpass is not
// optional here: decimation by 3 folds everything from 8-24kHz straight back
// into the 0-8k band Deepgram actually reads, and a bare 3-tap box attenuates
// the 8kHz fold point by only 9.5dB — a 12kHz fan/hiss tone survived at
// -9.5dB and landed on the formants. Blackman-windowed sinc, 63 taps,
// 6.5kHz cutoff, fused once with the 3-tap box so the hot loop is a single
// convolution. Normalized to sum 1.0 for unity DC gain.
//
// ponytail: the kernel is CARRIED in `hist` across calls. Zero-padding each
// 128-frame block instead truncates ~37% off the first and last output of
// every block — a 375Hz tremolo, measured at a 36% dip, which is worse than
// the aliasing it fixes. Carrying history costs one reused buffer and leaves
// only stream start truncated: a single 2.67ms block, during COUNTDOWN,
// behind a closed gate. Steady-state DC ripple is 0.73dB.
const DECIM = {
    cutoffHz: 6500,
    taps: 63, // odd → a true centre tap
    box: 3, // 48000 / 16000
};

// FIR ⊛ 3-tap box, built once. h[n] = sin(2π·fc·n)/(π·n), h[0] = 2·fc — note
// the 2·fc applies ONLY at n=0; carrying it into the n≠0 branch scales every
// sidelobe by 2·fc and pins the stopband at -7dB instead of -40dB.
const FUSED = (() => {
    const { cutoffHz, taps, box } = DECIM;
    const fc = cutoffHz / RNNOISE.inRate;
    const half = (taps - 1) / 2;
    const sinc = new Float64Array(taps);
    let sum = 0;
    for (let n = 0; n < taps; n++) {
        const k = n - half;
        const ideal = k === 0 ? 2 * fc : Math.sin(2 * Math.PI * fc * k) / (Math.PI * k);
        const blackman =
            0.42 -
            0.5 * Math.cos((2 * Math.PI * n) / (taps - 1)) +
            0.08 * Math.cos((4 * Math.PI * n) / (taps - 1));
        sinc[n] = ideal * blackman;
        sum += sinc[n];
    }
    for (let n = 0; n < taps; n++) sinc[n] /= sum;
    const len = taps + box - 1;
    const fused = new Float64Array(len);
    for (let m = 0; m < len; m++) {
        let acc = 0;
        for (let k = 0; k < taps; k++) {
            const j = m - k;
            if (j >= 0 && j < box) acc += sinc[k];
        }
        fused[m] = acc / box;
    }
    return fused;
})();

const FUSED_LEN = FUSED.length; // 64
const FUSED_HALF = (FUSED_LEN - 1) / 2; // 32
const HISTORY = FUSED_LEN - 1; // 63

// Reused across calls — the audio hot path must not allocate per 2.67ms
// block (same reasoning as audioGate.js's SILENT_SOURCES).
let hist = new Float32Array(HISTORY);
let scratch = new Float32Array(HISTORY + 128);

// Test seam: the filter is continuous by design, so a test needs a known
// starting point. Production never calls this — one truncated block at
// stream start is inaudible and lands behind a closed gate.
export function resetRnnoiseFilter() {
    hist.fill(0);
}

export function downsample48kTo16k(frame) {
    const n = frame.length;
    if (n === 0) return new Float32Array(0);
    if (scratch.length < HISTORY + n) scratch = new Float32Array(HISTORY + n);
    const buf = scratch;
    buf.set(hist, 0);
    buf.set(frame, HISTORY);
    hist.set(buf.subarray(n, n + HISTORY));
    const out = new Float32Array(Math.floor(n / DECIM.box));
    for (let o = 0; o < out.length; o++) {
        const base = HISTORY + o * DECIM.box;
        let acc = 0;
        for (let m = 0; m < FUSED_LEN; m++) {
            const idx = base + m - FUSED_HALF;
            if (idx >= 0 && idx < buf.length) acc += buf[idx] * FUSED[m];
        }
        out[o] = acc;
    }
    return out;
}
