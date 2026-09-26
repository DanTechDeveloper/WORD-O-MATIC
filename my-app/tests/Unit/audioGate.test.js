import { applyNoiseGate, NOISE_GATE } from "@/lib/audioGate.js";

const silent = (n = 128) => new Float32Array(n);
const at = (v, n = 128) => new Float32Array(n).fill(v);

// ponytail: helper — patakbuhin ang gate sa sustained background para
// mag-settle ang floor (tulad ng COUNTDOWN preload bago mag-ACTIVE).
const settle = (state, v, frames = 200) => {
    for (let i = 0; i < frames; i++) applyNoiseGate(at(v), state);
};

describe("applyNoiseGate — near-field + floor tracking", () => {
    test("gated silence -> zeros (frame not passed through)", () => {
        const state = { isOpen: false };
        const out = applyNoiseGate(silent(), state);
        expect(state.isOpen).toBe(false);
        expect(out.length).toBe(silent().length);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("tahimik na room: mahinang boses (~0.015) nagbubukas pa rin", () => {
        const state = { isOpen: false };
        settle(state, 0.001); // quiet-room floor
        const out = applyNoiseGate(at(0.015), state);
        expect(state.isOpen).toBe(true);
        expect(Array.from(out)).toEqual(Array.from(at(0.015)));
    });

    test("tahimik na room: ambient (~0.004) nananatiling gated", () => {
        const state = { isOpen: false };
        settle(state, 0.001);
        const out = applyNoiseGate(at(0.004), state);
        expect(state.isOpen).toBe(false);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("malakas na boses nagbubukas at pumapasa", () => {
        const state = { isOpen: false };
        settle(state, 0.001);
        const out = applyNoiseGate(at(0.3), state);
        expect(state.isOpen).toBe(true);
        expect(Array.from(out)).toEqual(Array.from(at(0.3)));
    });

    test("hysteresis + hangover: hindi agad sumasara sa isang dip", () => {
        const state = { isOpen: false };
        settle(state, 0.001);
        applyNoiseGate(at(0.3), state); // open
        applyNoiseGate(at(0.002), state); // one quiet frame
        expect(state.isOpen).toBe(true); // hangover holds it open
        for (let i = 0; i < 11; i++) applyNoiseGate(at(0.002), state);
        expect(state.isOpen).toBe(false); // 12 quiet frames -> closed
        const out = applyNoiseGate(silent(), state);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("holder speech hindi itinataas ang sariling bar (frozen-when-open)", () => {
        const state = { isOpen: false };
        settle(state, 0.001);
        for (let i = 0; i < 50; i++) applyNoiseGate(at(0.3), state);
        expect(state.isOpen).toBe(true); // never closes mid-utterance
        // isang opening-frame nudge lang ang allowed — ang bar nananatiling
        // malayo sa holder level, kaya hindi magsasara mid-word
        expect(state.floor * NOISE_GATE.openRatio).toBeLessThan(0.05);
    });

    test("40-kid chatter: sustained babble na-reject, holder pumapasa", () => {
        const state = { isOpen: false };
        settle(state, 0.03, 300); // loud-room babble floor
        // chatter peaks (~0.05) stay gated even after long exposure
        for (let i = 0; i < 50; i++) {
            const out = applyNoiseGate(at(0.05), state);
            expect(state.isOpen).toBe(false);
            expect(Array.from(out)).toEqual(Array.from(silent()));
        }
        // holder close voice (~0.25) opens immediately
        const out = applyNoiseGate(at(0.25), state);
        expect(state.isOpen).toBe(true);
        expect(Array.from(out)).toEqual(Array.from(at(0.25)));
    });

    test("unang frame pa lang ng babble hindi nagbubukas (noisy init)", () => {
        const state = { isOpen: false }; // fresh mic, floorInit assumes noisy
        const out = applyNoiseGate(at(0.03), state);
        expect(state.isOpen).toBe(false);
        expect(Array.from(out)).toEqual(Array.from(silent()));
    });

    test("tunables exposed para sa field tuning", () => {
        expect(NOISE_GATE.openRatio).toBeGreaterThan(1);
        expect(NOISE_GATE.closeFraction).toBeLessThan(1);
        expect(NOISE_GATE.hangover).toBe(12);
    });
});
