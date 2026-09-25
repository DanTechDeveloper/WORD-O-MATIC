// ponytail: fork of simple-rnnoise-wasm@1.1.0 dist/rnnoise.worklet.js —
// same denoising logic, plus ONE fix: an empty-input guard in process().
// Chrome delivers inputs=[[]] (connected, zero channels) while the mic warms
// up, the track is muted/ended, or the graph rewires; upstream then crashes
// on s.set(undefined) ("Cannot convert undefined or null to object"). We
// emit silence and stay alive instead. Processor name stays "rnnoise" —
// the vendor RNNoiseNode API constructs it by that name.
let wasmExports = null;
let wasmMem = null;

class RnnoiseProcessor extends AudioWorkletProcessor {
    constructor(options) {
        super({
            ...options,
            numberOfInputs: 1,
            numberOfOutputs: 1,
            outputChannelCount: [1],
        });
        if (!wasmExports) {
            wasmExports = new WebAssembly.Instance(
                options.processorOptions.module,
            ).exports;
            wasmMem = new Float32Array(wasmExports.memory.buffer);
        }
        this.state = wasmExports.newState();
        this.alive = true;
        this.statSize = Math.ceil(sampleRate / 128);
        this.stat = new Float32Array(2 * this.statSize);
        this.statPtr = 0;
        this.ts = 0;
        this.port.onmessage = ({ data }) => {
            if (!this.alive) return;
            if (data) {
                const status = { vadProb: wasmExports.getVadProb(this.state) };
                if (data === "stat") status.stat = this.stat;
                this.port.postMessage(status);
            } else {
                this.alive = false;
                wasmExports.deleteState(this.state);
            }
        };
    }

    process(inputs, outputs) {
        if (!this.alive) return false;
        // Guard: no data yet (mic warmup / muted track / rewire) — silence.
        const input = inputs[0];
        if (!input || !input[0]) return true;
        const now = Date.now();
        wasmMem.set(input[0], wasmExports.getInput(this.state) / 4);
        const out = outputs[0][0];
        const denoisedPtr = wasmExports.pipe(this.state, out.length) / 4;
        if (denoisedPtr) {
            out.set(wasmMem.subarray(denoisedPtr, denoisedPtr + out.length));
        }
        if (this.ts !== 0) {
            this.stat[this.statPtr] = now - this.ts;
            this.stat[this.statPtr + this.statSize] = Date.now() - this.ts;
            this.statPtr = (this.statPtr + 1) % this.statSize;
        }
        this.ts = now;
        return true;
    }
}

registerProcessor("rnnoise", RnnoiseProcessor);
