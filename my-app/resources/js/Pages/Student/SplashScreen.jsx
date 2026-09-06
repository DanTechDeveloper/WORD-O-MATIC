import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";
import { startBackgroundMusic } from "@/utils/sounds";

const BG_WORDS = ["BLAST", "READ", "SPEAK", "QUEST", "LEARN", "HERO", "STAR", "LEVEL", "PLAY", "WIN"];
const BG_WORD_COLORS = ["#d1bcff", "#7000ff", "#ff3bc0", "#ffb77f"];
const BG_LEFT = ["15%", "75%", "45%", "85%", "30%"];

const SHAPES = [
    { size: 28, color: "#d1bcff", left: "8%",  delay: 0,    dur: 18, rotate: 45  },
    { size: 44, color: "#7000ff", left: "22%", delay: 3,    dur: 22, rotate: 0   },
    { size: 20, color: "#ff3bc0", left: "55%", delay: 1,    dur: 16, rotate: 45  },
    { size: 36, color: "#d1bcff", left: "70%", delay: 5,    dur: 20, rotate: 22  },
    { size: 24, color: "#ffb77f", left: "88%", delay: 2,    dur: 24, rotate: 45  },
    { size: 32, color: "#7000ff", left: "40%", delay: 7,    dur: 19, rotate: 0   },
    { size: 18, color: "#ff3bc0", left: "62%", delay: 4,    dur: 21, rotate: 45  },
    { size: 40, color: "#d1bcff", left: "12%", delay: 6,    dur: 17, rotate: 30  },
];

function ArcadeGridBg() {
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
    const color = BG_WORD_COLORS[index % BG_WORD_COLORS.length];
    const left = BG_LEFT[index % BG_LEFT.length];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            <style>
                {`
                    .arcade-grid-bg {
                        background-image: radial-gradient(circle, rgba(112,0,255,0.15) 1px, transparent 1px);
                        background-size: 32px 32px;
                    }
                    .arcade-grid-fine {
                        background-image: radial-gradient(circle, rgba(209,188,255,0.04) 1px, transparent 1px);
                        background-size: 16px 16px;
                    }
                    .arcade-scanlines {
                        background: repeating-linear-gradient(
                            0deg,
                            transparent,
                            transparent 3px,
                            rgba(0,0,0,0.04) 3px,
                            rgba(0,0,0,0.04) 4px
                        );
                    }
                    @keyframes splash-fall {
                        0% { top: -10%; opacity: 0; }
                        15% { opacity: 0.6; }
                        100% { top: 70%; opacity: 0.6; }
                    }
                    @keyframes splash-shard {
                        0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 0.6; }
                        100% { transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(2); opacity: 0; }
                    }
                    @keyframes shape-drift {
                        0%   { transform: translateY(0) rotate(var(--sr)); opacity: 0; }
                        10%  { opacity: var(--op); }
                        90%  { opacity: var(--op); }
                        100% { transform: translateY(-110vh) rotate(calc(var(--sr) + 180deg)); opacity: 0; }
                    }
                    @keyframes glow-pulse-ring {
                        0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
                        50%      { transform: translate(-50%, -50%) scale(1.08); opacity: 0.25; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .splash-word, .splash-shard, .splash-shape, .splash-glow {
                            animation: none !important;
                            opacity: 0.3 !important;
                        }
                    }
                `}
            </style>

            {/* LED dot-grid texture */}
            <div className="arcade-grid-bg absolute inset-0" />

            {/* Fine secondary grid */}
            <div className="arcade-grid-fine absolute inset-0" />

            {/* Pulsing glow ring behind content */}
            <div
                className="splash-glow absolute rounded-full"
                style={{
                    width: "500px",
                    height: "500px",
                    left: "50%",
                    top: "50%",
                    transform: "translate(-50%, -50%)",
                    background: "radial-gradient(circle, rgba(112,0,255,0.2) 0%, rgba(112,0,255,0.05) 50%, transparent 70%)",
                    boxShadow: "0 0 80px 40px rgba(112,0,255,0.08)",
                    animation: "glow-pulse-ring 5s ease-in-out infinite",
                }}
            />

            {/* Floating geometric shapes */}
            {SHAPES.map((s, i) => (
                <div
                    key={i}
                    className="splash-shape absolute"
                    style={{
                        width: s.size,
                        height: s.size,
                        left: s.left,
                        bottom: "-60px",
                        backgroundColor: s.color,
                        opacity: 0.12,
                        boxShadow: `4px 4px 0 0 #4c1d95`,
                        transform: `rotate(${s.rotate}deg)`,
                        "--sr": `${s.rotate}deg`,
                        "--op": 0.12 + (i % 3) * 0.04,
                        animation: `shape-drift ${s.dur}s linear ${s.delay}s infinite`,
                    }}
                />
            ))}

            {/* Falling word layer */}
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

            {/* CRT scanlines overlay */}
            <div className="arcade-scanlines absolute inset-0" />
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

            <p className="relative z-10 text-on-surface-variant font-black uppercase tracking-[0.2em] text-xs animate-pulse motion-reduce:animate-none">
                Press play to begin
            </p>
        </div>
    );
}
