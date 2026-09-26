// ponytail: near-field gate — sa classroom na 40 sabay-sabay na bata, ang
// chatter ng kaklase ay malayo (~2m, ~20dB mahina vs bibig 20cm sa mic).
// Kaya ang gate hindi fixed: ang open bar sumasakay sa slow-tracked room
// floor (maingay na room = mataas na bar, tahimik = lumang 0.008 bar para
// sa mahihinang bata). Asymmetric + frozen-when-open: floor mabilis bumaba
// sa tahimik, mabagal tumaas sa maingay, at FROZEN habang bukas — kaya ang
// sariling boses ng holder hindi kailanman itinataas ang bar mid-word.
// Field-tune sa NOISE_GATE kapag may tunay na hardware (ponytail ceiling:
// proportion-based, hindi per-device calibrated).
export const NOISE_GATE = {
    floorInit: 0.02, // assume noisy; falls fast to a quiet room in ~0.3s
    floorMin: 0.008, // absolute quiet-room bar (== old openLevel)
    // ponytail: 4 -> 6. Opening takes ONE 2.67ms frame, so a classmate who
    // starts talking in a quiet room clears even 4x, and once open the floor
    // is frozen (:33) so it can never rise to exclude them — the WHOLE burst
    // was admitted, which is exactly how a stranger's words reach Deepgram and
    // lock a Wrong. 6 rejects a 14dB-above-floor voice (0.02 against a 0.004
    // floor) while the 32dB child (0.15) still opens immediately in BOTH a
    // quiet and a loud room.
    //
    // ponytail ceiling: 8 would also reject an 18dB voice, but it STARVES the
    // child once the floor sits at 0.02 (openAt 0.16 > 0.15) and the floor then
    // rises toward the child, spiralling. A scalar energy gate cannot separate
    // "loud room + close talker" from "close talker + quiet room" — 6 is the
    // widest safe window, and the 18dB case stays open by design. See CAVEATS.
    openRatio: 6,
    closeFraction: 0.5, // close when peak <= openThreshold*closeFraction
    riseK: 0.005, // floor rise per rejected frame (babble adapt ~0.5s)
    fallK: 0.05, // floor fall per frame (fast toward quiet)
    hangover: 12,
};

// ponytail: reused zero buffer — every gated frame previously allocated a fresh
// Float32Array on the audio hot path.
const SILENT_SOURCES = {};

export function applyNoiseGate(frame, state) {
    let level = 0;
    for (let i = 0; i < frame.length; i++) {
        const a = Math.abs(frame[i]);
        if (a > level) level = a;
    }
    if (state.floor == null) state.floor = NOISE_GATE.floorInit;
    // ponytail: floor tracks REJECTED background only — frozen while open so
    // the holder's own voice never drags its own bar upward mid-utterance.
    if (!state.isOpen) {
        if (level < state.floor) {
            state.floor += (level - state.floor) * NOISE_GATE.fallK;
        } else {
            state.floor += (level - state.floor) * NOISE_GATE.riseK;
        }
    }
    const openAt = Math.max(
        NOISE_GATE.floorMin,
        state.floor * NOISE_GATE.openRatio,
    );
    const closeAt = openAt * NOISE_GATE.closeFraction;
    if (state.isOpen) {
        if (level <= closeAt) {
            // ponytail: hangover (~100ms of 8ms frames) — a word-boundary dip
            // no longer snaps the gate shut and zeroes the next speech frames.
            state.hold = (state.hold ?? NOISE_GATE.hangover) - 1;
            if (state.hold <= 0) {
                state.isOpen = false;
                state.hold = 0;
            }
        } else {
            state.hold = NOISE_GATE.hangover;
        }
    } else if (level >= openAt) {
        state.isOpen = true;
        state.hold = NOISE_GATE.hangover;
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
