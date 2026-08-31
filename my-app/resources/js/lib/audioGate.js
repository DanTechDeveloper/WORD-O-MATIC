// ponytail: steady-background (fan/aircon/traffic) gate — peak-level + hysteresis.
// Thresholds are a safe starting default; tune per device in NOISE_GATE.
export const NOISE_GATE = { openLevel: 0.02, closeLevel: 0.008 };

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
    return state.isOpen ? frame : new Float32Array(frame.length);
}
