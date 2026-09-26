import { applyNoiseGate, NOISE_GATE } from "@/lib/audioGate.js";

const silent = (n = 128) => new Float32Array(n);
const at = (v, n = 128) => new Float32Array(n).fill(v);

// ponytail: patakbuhin ang gate sa sustained background para
// mag-settle ang floor (tulad ng COUNTDOWN preload bago mag-ACTIVE).
const settle = (state, v, frames = 200) => {
    for (let i = 0; i < frames; i++) applyNoiseGate(at(v), state);
};

// ponytail: bilangin ang mga frame na NAIPASA (isOpen) sa loob ng isang
// utterance. Ito ang sukat ng "ilang ms ng boses ng kasama ang umabot
// sa Deepgram" — ang actual na symptom, hindi ang boolean. Gate state, hindi
// ang return value: parehong branches ay nagre-return ng 128-length array
// (ang frame at ang zeroed buffer), kaya `.length` ay laging 128.
const admittedFrames = (state, v, frames) => {
    let n = 0;
    for (let i = 0; i < frames; i++) {
        applyNoiseGate(at(v), state);
        if (state.isOpen) n++;
    }
    return n;
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

// ponytail: BURST vs SUSTAINED. Ang test sa itaas ("sustained babble
// na-reject") ay tumatanda NA may floor — kaya tumatanggap. Ang bug sa
// klase ay hindi iyon: ang klase ay tahimik, tapos MAY NAGSASALITA na
// classmate. Dalawang rule ang nagbabayan:
//   1) :57 — ang gate ay BUKAS sa ISANG frame lang (level >= floor*openRatio)
//   2) :33 — ang floor ay FROZEN hangga't bukas, kaya HINDI MAKAKAISA
// Kaya kapay na pumasok ang isang burst, buong utterance na ang nakakapasok
// (hangover: 12 = ~32ms lang, hindi sapat para isara). Ang floor ay nakakabawi
// sa katapat na burst dahil fallK (0.05) ay 10x mas mabilis kaysa riseK
// (0.005) — nakakalimot ang ingay sa pagitan ng dalawang burst.
// Ang 2000 frames = ~5.3s @2.67ms/frame.
describe("burst: isang nagsasalitang classmate sa tahimik na kuwarto", () => {
    const BURST = 2000; // ~5.3s utterance

    test("tahimik na kuwarto: ang floor ay humihiwalay sa distant talker", () => {
        // 0.004 room tone, then a 14dB-above-floor voice (0.02) starts talking.
        // openAt must sit ABOVE it or the single opening frame lets it in.
        const state = { isOpen: false };
        settle(state, 0.004, 600);
        expect(NOISE_GATE.openRatio * state.floor).toBeGreaterThan(0.02);
        expect(admittedFrames(state, 0.02, BURST)).toBe(0);
    });

    test("ang floor ay NA natutong marami: parehong talker, reject", () => {
        // The case the old suite already covered — a loud room that has
        // settled. Locks it in so the burst fix cannot regress it.
        const state = { isOpen: false };
        settle(state, 0.02, 600);
        expect(admittedFrames(state, 0.02, BURST)).toBe(0);
    });

    test("10dB talker: reject sa tahimik man o maingay na kuwarto", () => {
        for (const bg of [0.004, 0.02]) {
            const state = { isOpen: false };
            settle(state, bg, 600);
            expect(admittedFrames(state, bg * 2.5, BURST)).toBe(0);
        }
    });

    test("ang holder ay HINDI naubos — kahit maingay na kuwarto", () => {
        // The cliff. openRatio 8 also kills the 18dB talker, but it starves
        // the child in a loud room — and because the floor then rises toward
        // the child, that spirals. This test is the guard against over-tightening.
        for (const bg of [0.004, 0.02]) {
            const state = { isOpen: false };
            settle(state, bg, 600);
            expect(admittedFrames(state, 0.15, 300)).toBe(300);
        }
    });

    test("18dB talker sa tahimik na kuwarto: HINDI pa natutugunan — ceiling", () => {
        // The one leak openRatio 6 does not close. Quiet room => openAt
        // 0.004*6 = 0.024, so a 0.03 voice clears it, freezes the floor, and
        // rides the whole utterance. Closing it needs openRatio > 7.5, which
        // starves the child in a loud room (see the holder test above).
        // A scalar energy gate cannot separate these two — see CAVEATS.
        const state = { isOpen: false };
        settle(state, 0.004, 600);
        expect(NOISE_GATE.openRatio * state.floor).toBeLessThan(0.03);
        expect(admittedFrames(state, 0.03, BURST)).toBeGreaterThan(0);
    });

    test("18dB talker sa maingay na kuwarto: reject (floor na natutong malaki)", () => {
        const state = { isOpen: false };
        settle(state, 0.02, 600);
        expect(admittedFrames(state, 0.03, BURST)).toBe(0);
    });
});
