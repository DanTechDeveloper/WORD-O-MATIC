import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { startBackgroundMusic } from "@/utils/sounds";

const BG_WORDS = ["BLAST", "READ", "SPEAK", "QUEST", "LEARN", "HERO", "STAR", "LEVEL", "PLAY", "WIN"];
const BG_WORD_COLORS = ["#d1bcff", "#7000ff", "#ff3bc0", "#ffb77f"];
const BG_LEFT = ["15%", "75%", "45%", "85%", "30%"];

// SHAPES removed — ponytail: drift shapes dropped per DESIGN.md §6 dotgrid/orb ban

// ponytail: distill — keep one falling word + subtle scanlines, drop dotgrids/orb/shape drift per DESIGN.md §6
function ArcadeGridBg() {
    const [index, setIndex] = useState(0);

    useEffect(() => {
        const t = setTimeout(() => setIndex((i) => (i + 1) % BG_WORDS.length), 2500);
        return () => clearTimeout(t);
    }, [index]);

    const word = BG_WORDS[index];
    const color = BG_WORD_COLORS[index % BG_WORD_COLORS.length];
    const left = BG_LEFT[index % BG_LEFT.length];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            <style>
                {`
                    .arcade-scanlines {
                        background: repeating-linear-gradient(0deg, transparent, transparent 3px, rgba(0,0,0,0.04) 3px, rgba(0,0,0,0.04) 4px);
                    }
                    @keyframes splash-fall {
                        0% { top: -10%; opacity: 0; }
                        15% { opacity: 0.6; }
                        100% { top: 70%; opacity: 0.6; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .splash-word { animation: none !important; opacity: 0.4 !important; }
                    }
                `}
            </style>
            <div
                key={index}
                className="splash-word absolute -translate-x-1/2 font-black uppercase tracking-tight text-4xl md:text-6xl whitespace-nowrap"
                style={{
                    left,
                    top: "-10%",
                    color,
                    fontFamily: '"Lexend Variable", "Lexend", sans-serif',
                    textShadow: `0 0 12px ${color}66`,
                    animation: "splash-fall 2.2s ease-in forwards",
                }}
            >
                {word}
            </div>
            <div className="arcade-scanlines absolute inset-0 opacity-40" />
        </div>
    );
}

export default function SplashScreen() {
    const [starting, setStarting] = useState(false);

    const handleStart = () => {
        if (starting) return;
        setStarting(true);
        startBackgroundMusic();
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-10 select-none overflow-hidden px-6">
            <ArcadeGridBg />

            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(17,17,37,0.7) 0%, rgba(17,17,37,0.3) 30%, transparent 50%)",
                }}
            />

            <h1 className="relative z-10 text-primary text-[clamp(2.25rem,11vw,6rem)] leading-[0.95] font-black italic uppercase tracking-[-0.04em] text-center text-balance">
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
