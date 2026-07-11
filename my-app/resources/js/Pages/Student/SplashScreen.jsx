import { router } from "@inertiajs/react";
import { useEffect, useState } from "react";

const BG_WORDS = ["BLAST", "READ", "SPEAK", "QUEST", "LEARN", "HERO", "STAR", "LEVEL", "PLAY", "WIN"];
const BG_GLOWS = ["#00f0ff", "#00ff88", "#8844ff", "#ff2266", "#44ff44"];
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
    const glow = BG_GLOWS[index % BG_GLOWS.length];
    const left = BG_LEFT[index % BG_LEFT.length];

    return (
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0" aria-hidden="true">
            <style>
                {`
                    @keyframes splash-fall {
                        0% { top: -10%; opacity: 0; }
                        15% { opacity: 0.4; }
                        100% { top: 75%; opacity: 0.4; }
                    }
                    @keyframes splash-shard {
                        0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 0.4; }
                        100% { transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(2); opacity: 0; }
                    }
                `}
            </style>
            <div
                key={index}
                className="absolute -translate-x-1/2 font-black uppercase tracking-tight text-4xl md:text-6xl whitespace-nowrap"
                style={{
                    left,
                    top: "-10%",
                    color: "#ffffff",
                    fontFamily: '"Courier New", "Consolas", "Monaco", monospace',
                    textShadow: `0 0 10px ${glow}, 0 0 30px ${glow}, 0 0 60px ${glow}66`,
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
    useEffect(() => {
        sessionStorage.removeItem("practiceDone");
        sessionStorage.removeItem("practiceSpeakDone");
    }, []);

    const handleStart = () => {
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center gap-10 cursor-pointer select-none overflow-hidden px-6"
            onClick={handleStart}
        >
            <FallingWordBg />

            <div
                className="absolute inset-0 z-[5] pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(9,9,11,0.7) 0%, rgba(9,9,11,0.3) 30%, transparent 50%)",
                }}
            />

            <h1 className="relative z-10 text-lime-400 text-6xl md:text-8xl font-black italic uppercase tracking-tighter text-center">
                WORD-O-MATIC
            </h1>

            <button
                type="button"
                className="relative z-10 flex items-center gap-3 bg-lime-400 text-slate-950 font-black text-2xl md:text-3xl uppercase tracking-wider px-12 py-5 rounded-full animate-bounce hover:scale-105 active:scale-95 transition-transform"
            >
                <span className="material-symbols-outlined text-4xl">play_arrow</span>
                Play
            </button>

            <p className="relative z-10 text-on-surface-variant font-bold uppercase tracking-[0.3em] text-xs animate-pulse">
                Tap anywhere to start
            </p>
        </div>
    );
}
