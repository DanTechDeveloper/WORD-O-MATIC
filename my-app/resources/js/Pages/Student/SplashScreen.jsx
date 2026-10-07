import { router } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { startBackgroundMusic } from "@/utils/sounds";
import ArcadeBackground from "@/Components/Shared/ArcadeBackground";

export default function SplashScreen() {
    const [starting, setStarting] = useState(false);
    const startTimer = useRef(null);

    // ponytail: OfflineGuard cancels the visit at inertia:before, BEFORE Inertia
    // builds a Request — so onError/onFinish/onCancel never exist to release the
    // latch. Time-based release instead; a re-enabled button mid-flight is
    // harmless (Inertia interrupts the in-flight visit to the same URL).
    useEffect(() => () => clearTimeout(startTimer.current), []);

    const handleStart = () => {
        if (starting) return;
        setStarting(true);
        startBackgroundMusic();
        startTimer.current = setTimeout(() => setStarting(false), 3000);
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-10 select-none overflow-hidden px-6">
            <ArcadeBackground />

            {/* No spaces in "WORD-O-MATIC" — the only break opportunities are the
                two hyphens, so it wrapped to WORD- / O-MATIC, and `text-balance`
                then balanced those into two lines. whitespace-nowrap closes that;
                the 9vw ceiling keeps the result inside px-6 down to a 320px phone
                (28.8px × ~7.5em ≈ 216px against 272px available). Same fix as the
                GameResults h1. */}
            <h1 className="relative z-10 text-primary text-[clamp(1.5rem,9vw,6rem)] leading-[0.95] font-black italic uppercase tracking-[-0.04em] text-center whitespace-nowrap">
                WORD-O-MATIC
            </h1>

            <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                aria-busy={starting}
                data-sfx="major"
                className="relative z-10 tactile-button flex items-center gap-3 border-2 border-surface-container-lowest bg-accent text-surface-container-lowest font-black text-2xl md:text-3xl uppercase tracking-wider px-12 py-5 rounded-xl transition-[transform,background-color] hover:bg-accent-hover hover:-translate-y-0.5 outline-none focus-visible:ring-4 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-80 disabled:cursor-wait"
            >
                <span className="material-symbols-outlined text-4xl" aria-hidden="true">
                    play_arrow
                </span>
                {starting ? "Starting…" : "Play"}
            </button>

            <p className="relative z-10 text-on-surface-variant font-black uppercase tracking-[0.2em] text-xs">
                Press play to begin
            </p>
        </div>
    );
}
