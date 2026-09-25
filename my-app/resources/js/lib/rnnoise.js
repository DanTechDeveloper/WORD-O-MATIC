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

// ponytail: 48k→16k box-filter decimate for Deepgram. Drops the trailing
// ≤2 samples per 128-frame (0.04ms) — stateless, ASR-inaudible.
export function downsample48kTo16k(frame) {
    const out = new Float32Array(Math.floor(frame.length / 3));
    for (let o = 0; o < out.length; o++) {
        const i = o * 3;
        out[o] = (frame[i] + frame[i + 1] + frame[i + 2]) / 3;
    }
    return out;
}
