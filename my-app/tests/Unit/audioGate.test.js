import { applyNoiseGate } from "@/lib/audioGate.js";

const O = 0.02;
const C = 0.008;

const silent = (n = 128) => new Float32Array(n);
const at = (v, n = 128) => new Float32Array(n).fill(v);

describe("applyNoiseGate — peek-level + hysteresis", () => {
    test("gated silence -> zeros (frame not passed through)", () => {
        const state = { isOpen: false };
        const out = applyNoiseGate(silent(), state);
        expect(state.isOpen).toBe(false);
        expect(out.length).toBe(silent().length);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("steady background below close threshold stays gated", () => {
        const state = { isOpen: false };
        const out = applyNoiseGate(at(0.004), state);
        expect(state.isOpen).toBe(false);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("voice above open threshold opens the gate and passes audio", () => {
        const state = { isOpen: false };
        const out = applyNoiseGate(at(0.3), state);
        expect(state.isOpen).toBe(true);
        expect(Array.from(out)).toEqual(Array.from(at(0.3)));
    });

    test("hysteresis: stays open between close and open levels after opening", () => {
        const state = { isOpen: false };
        applyNoiseGate(at(0.3), state); // open
        const out = applyNoiseGate(at(0.015), state); // between C and O
        expect(state.isOpen).toBe(true); // does NOT flip back
        expect(Array.from(out)).toEqual(Array.from(at(0.015)));
    });

    test("closes only when level falls to or below close threshold", () => {
        const state = { isOpen: false };
        applyNoiseGate(at(0.3), state); // open
        applyNoiseGate(at(0.004), state); // below close
        expect(state.isOpen).toBe(false);
        const out = applyNoiseGate(silent(), state);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("does not cut a voice tail: stays open on one quiet mid-utterance frame", () => {
        const state = { isOpen: false };
        applyNoiseGate(at(0.3), state);
        // mid-utterance dip still above close threshold -> stays open, no clip
        const out = applyNoiseGate(at(0.01), state);
        expect(state.isOpen).toBe(true);
        expect(Array.from(out)).toEqual(Array.from(at(0.01)));
    });
});
