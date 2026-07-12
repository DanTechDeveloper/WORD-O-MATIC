import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

const BG_WORDS = ["BLAST", "READ", "SPEAK", "QUEST", "LEARN", "HERO", "STAR", "LEVEL", "PLAY", "WIN"];
const BG_COLORS = ["#d1bcff", "#7000ff", "#ff3bc0"];
const BG_LEFT = ["20%", "80%", "50%"];

function FallingWordBg() {
    const [index, setIndex] = useState(0);
    const [exploding, setExploding] = useState(false);

    useEffect(() => {
        const explodeAt = setTimeout(() => setExploding(true), 2200);
        const nextAt = setTimeout(() => {
            setExploding(false);
            setIndex((i) => (i + 1) % BG_WORDS.length);
        }, 3000);
        return () => {
            clearTimeout(explodeAt);
            clearTimeout(nextAt);
        };
    }, [index]);

    const word = BG_WORDS[index];
    const color = BG_COLORS[index % BG_COLORS.length];
    const left = BG_LEFT[index % BG_LEFT.length];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            <style>
                {`
                    @keyframes splash-fall {
                        0% { top: -10%; opacity: 0; }
                        15% { opacity: 0.5; }
                        100% { top: 75%; opacity: 0.5; }
                    }
                    @keyframes splash-shard {
                        0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 0.5; }
                        100% { transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(2); opacity: 0; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .splash-word, .splash-shard { animation: none !important; opacity: 0.4 !important; }
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
                {word.split("").map((char, i) => {
                    const angle = (i / Math.max(word.length, 1)) * 360;
                    const dist = 60 + (i % 3) * 30;
                    const sx = Math.cos((angle * Math.PI) / 180) * dist;
                    const sy = Math.sin((angle * Math.PI) / 180) * dist - 40;
                    const sr = (i % 2 === 0 ? 1 : -1) * (20 + (i % 5) * 15);
                    return (
                        <span
                            key={i}
                            className="inline-block"
                            style={
                                exploding
                                    ? {
                                          animation: "splash-shard 0.6s ease-out forwards",
                                          animationDelay: `${i * 30}ms`,
                                          "--sx": `${sx}px`,
                                          "--sy": `${sy}px`,
                                          "--sr": `${sr}deg`,
                                      }
                                    : undefined
                            }
                        >
                            {char}
                        </span>
                    );
                })}
            </div>
        </div>
    );
}

export default function SplashScreen() {
    const [starting, setStarting] = useState(false);

    useEffect(() => {
        sessionStorage.removeItem("practiceDone");
        sessionStorage.removeItem("practiceSpeakDone");
    }, []);

    const handleStart = () => {
        if (starting) return;
        setStarting(true);
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center gap-10 select-none overflow-hidden px-6">
            <FallingWordBg />

            <div
                className="absolute inset-0 z-[1] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(17,17,37,0.7) 0%, rgba(17,17,37,0.3) 30%, transparent 50%)",
                }}
            />

            <h1 className="relative z-10 text-primary text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-center">
                WORD-O-MATIC
            </h1>

            <button
                type="button"
                onClick={handleStart}
                disabled={starting}
                aria-busy={starting}
                className="relative z-10 flex items-center gap-3 bg-accent text-surface-container-lowest font-black text-2xl md:text-3xl uppercase tracking-wider px-12 py-5 rounded-full hover:scale-105 active:scale-95 active:translate-y-1 transition-transform shadow-[0_6px_0_0_#4c1d95] outline-none focus-visible:ring-4 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:opacity-80 disabled:cursor-wait"
            >
                <span className="material-symbols-outlined text-4xl" aria-hidden="true">
                    play_arrow
                </span>
                {starting ? "Starting…" : "Play"}
            </button>

            <p className="relative z-10 text-on-surface-variant font-bold uppercase tracking-[0.3em] text-xs animate-pulse motion-reduce:animate-none">
                Press play to begin
            </p>
        </div>
    );
}
