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
    // ponytail: time-based target (~96ms), frame-rate independent. Previously
    // a frame COUNT (12) tuned for 8ms frames, which collapsed to 32ms in the
    // default denoise (RNNoise) path (2.67ms frames) and closed the gate
    // mid stop-consonant closure ("cot" for "cat").
    hangoverMs: 96,
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
    // ponytail: frame-rate independent hangover. 16k frames: frame.length/16000*1000 ms.
    const frameMs =
        frame.length > 0 ? (frame.length / 16000) * 1000 : 8;
    const hangoverFrames = Math.max(
        1,
        Math.ceil(NOISE_GATE.hangoverMs / frameMs),
    );
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
            // ponytail: hangover (~96ms, frame-rate independent) — a
            // word-boundary dip no longer snaps the gate shut and zeroes the
            // next speech frames. Frame count scales with frame duration so
            // the default (RNNoise) path keeps ~96ms instead of 32ms.
            state.hold = (state.hold ?? hangoverFrames) - 1;
            if (state.hold <= 0) {
                state.isOpen = false;
                state.hold = 0;
            }
        } else {
            state.hold = hangoverFrames;
        }
    } else if (level >= openAt) {
        state.isOpen = true;
        state.hold = hangoverFrames;
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
