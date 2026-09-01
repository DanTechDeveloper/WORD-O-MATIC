// ponytail: steady-background (fan/aircon/traffic) gate — peak-level + hysteresis.
// Open threshold biased low so soft/quiet students aren't gated to silence;
// tune per device in NOISE_GATE.
export const NOISE_GATE = { openLevel: 0.008, closeLevel: 0.003 };

// ponytail: reused zero buffer — every gated frame previously allocated a fresh
// Float32Array on the audio hot path.
const SILENT_SOURCES = {};

export function applyNoiseGate(frame, state) {
    let level = 0;
    for (let i = 0; i < frame.length; i++) {
        const a = Math.abs(frame[i]);
        if (a > level) level = a;
    }
    if (state.isOpen) {
        if (level <= NOISE_GATE.closeLevel) state.isOpen = false;
    } else if (level >= NOISE_GATE.openLevel) {
        state.isOpen = true;
    }
    if (state.isOpen) return frame;
    // ponytail: one shared zero buffer per block size; cold path only on resize
    let silent = SILENT_SOURCES[frame.length];
    if (!silent || silent.length !== frame.length) {
        silent = new Float32Array(frame.length);
        SILENT_SOURCES[frame.length] = silent;
    }
    return silent;
}
