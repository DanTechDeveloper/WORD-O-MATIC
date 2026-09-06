import { useState, useEffect, useCallback } from "react";

const SLIDES = ["wordblast", "storyquest", "badges"];
const SLIDE_DUR = 5000;

const WORD_BLAST_WORD = "GALAXY";
const STORY_SENTENCE = ["The", "quick", "brown", "fox", "jumps"];
const BADGE_ICON = "military_tech";
const BADGE_NAME = "Word Master";

export default function GameplayDemo() {
    const [slide, setSlide] = useState(0);
    const [phase, setPhase] = useState(0);
    const [paused, setPaused] = useState(false);

    const mode = SLIDES[slide];

    // Advance phase within each slide
    useEffect(() => {
        if (paused) return;
        const t = setTimeout(() => {
            setPhase((p) => p + 1);
        }, mode === "badges" ? 1500 : 1200);
        return () => clearTimeout(t);
    }, [phase, paused, mode]);

    // Advance to next slide
    useEffect(() => {
        if (paused) return;
        const t = setTimeout(() => {
            setSlide((s) => (s + 1) % SLIDES.length);
            setPhase(0);
        }, SLIDE_DUR);
        return () => clearTimeout(t);
    }, [slide, paused]);

    const goToSlide = useCallback((i) => {
        setSlide(i);
        setPhase(0);
    }, []);

    return (
        <div
            className="relative w-full aspect-[4/3] md:aspect-[16/10] bg-surface-container/30 border-2 border-outline/30 rounded-2xl overflow-hidden"
            onMouseEnter={() => setPaused(true)}
            onMouseLeave={() => setPaused(false)}
        >
            <style>
                {`
                    @keyframes demo-holo-rise {
                        0% { top: 20%; opacity: 0; filter: blur(6px); transform: translateX(-50%) scale(0.8); }
                        60% { filter: blur(0px); }
                        100% { top: 35%; opacity: 1; filter: blur(0px); transform: translateX(-50%) scale(1); }
                    }
                    @keyframes demo-shard {
                        0% { transform: translate(0,0) rotate(0deg) scale(1); opacity: 1; }
                        100% { transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(1.5); opacity: 0; }
                    }
                    @keyframes demo-burst {
                        0% { opacity: 0; transform: scale(0.3); }
                        20% { opacity: 0.8; transform: scale(1.2); }
                        100% { opacity: 0; transform: scale(2.5); }
                    }
                    @keyframes demo-feedback {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        25% { transform: translateY(-6px) scale(1.2); opacity: 1; }
                        40% { transform: translateY(-12px) scale(1); opacity: 1; }
                        100% { transform: translateY(-40px) scale(0.9); opacity: 0; }
                    }
                    @keyframes demo-shake {
                        0%, 100% { transform: translateX(-50%) rotate(0deg); }
                        25% { transform: translateX(-50%) rotate(-3deg); }
                        75% { transform: translateX(-50%) rotate(3deg); }
                    }
                    @keyframes demo-float {
                        0% { transform: translateY(0); opacity: 1; }
                        100% { transform: translateY(-60px); opacity: 0; }
                    }
                    @keyframes demo-badge-pop {
                        0% { transform: scale(0) rotate(-20deg); opacity: 0; }
                        60% { transform: scale(1.3) rotate(5deg); opacity: 1; }
                        100% { transform: scale(1) rotate(0deg); opacity: 1; }
                    }
                    @keyframes demo-badge-glow {
                        0%, 100% { box-shadow: 0 0 10px rgba(163,230,53,0.3); }
                        50% { box-shadow: 0 0 30px rgba(163,230,53,0.7), 0 0 60px rgba(163,230,53,0.3); }
                    }
                    @keyframes demo-word-highlight {
                        0% { border-color: transparent; box-shadow: none; }
                        100% { border-color: rgba(56,189,248,0.8); box-shadow: 0 0 12px rgba(56,189,248,0.4); }
                    }
                    @keyframes demo-streak-in {
                        0% { transform: translateX(-50%) scale(0); opacity: 0; }
                        60% { transform: translateX(-50%) scale(1.15); opacity: 1; }
                        100% { transform: translateX(-50%) scale(1); opacity: 1; }
                    }
                    @media (prefers-reduced-motion: reduce) {
                        .demo-anim { animation-duration: 0.01ms !important; }
                    }
                `}
            </style>

            {/* Slide content */}
            <div className="absolute inset-0">
                {mode === "wordblast" && <WordBlastSlide phase={phase} />}
                {mode === "storyquest" && <StoryQuestSlide phase={phase} />}
                {mode === "badges" && <BadgesSlide phase={phase} />}
            </div>

            {/* Slide label */}
            <div className="absolute top-3 left-3 z-20">
                <span className="text-xs sm:text-sm font-black uppercase tracking-widest text-on-surface-variant/60 bg-surface/80 rounded-full px-3 py-1.5">
                    {mode === "wordblast" && "Word Blast"}
                    {mode === "storyquest" && "Story Quest"}
                    {mode === "badges" && "Badges"}
                </span>
            </div>

            {/* Dot indicators */}
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => goToSlide(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                            i === slide
                                ? "bg-accent scale-125"
                                : "bg-on-surface-variant/30 hover:bg-on-surface-variant/50"
                        }`}
                    />
                ))}
            </div>
        </div>
    );
}

/* ── Slide 1: Word Blast ─────────────────────────────── */

function WordBlastSlide({ phase }) {
    const word = WORD_BLAST_WORD;
    const chars = word.split("");
    const exploded = phase >= 3;
    const showFeedback = phase >= 2 && phase < 4;

    return (
        <div className="absolute inset-0 flex items-center justify-center">
            {/* Energy burst on explode */}
            {exploded && (
                <div
                    className="demo-anim absolute rounded-full pointer-events-none"
                    style={{
                        width: "300px",
                        height: "300px",
                        left: "50%",
                        top: "40%",
                        transform: "translate(-50%, -50%)",
                        background: "radial-gradient(circle, rgba(0,240,255,0.5) 0%, rgba(0,255,136,0.2) 30%, transparent 70%)",
                        animation: "demo-burst 0.6s ease-out forwards",
                    }}
                />
            )}

            {/* Feedback pop */}
            {showFeedback && (
                <div
                    className="demo-anim absolute z-20 font-black italic text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500"
                    style={{
                        top: "18%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        filter: "drop-shadow(0 0 16px rgba(255,200,0,0.5))",
                        WebkitTextStroke: "1px #92400e",
                        animation: "demo-feedback 1.2s ease-out forwards",
                    }}
                >
                    NICE!
                </div>
            )}

            {/* Points float */}
            {phase >= 2 && phase < 4 && (
                <div
                    className="demo-anim absolute z-20 font-black italic text-xl sm:text-2xl"
                    style={{
                        top: "25%",
                        right: "25%",
                        color: "#00f0ff",
                        textShadow: "0 0 12px rgba(0,240,255,0.8)",
                        animation: "demo-float 0.8s ease-out forwards",
                    }}
                >
                    +20
                </div>
            )}

            {/* Word */}
            <div
                className="demo-anim absolute flex gap-2 sm:gap-3"
                style={{
                    left: "50%",
                    top: phase < 3 ? "35%" : "35%",
                    transform: "translateX(-50%)",
                    animation: phase < 1 ? "demo-holo-rise 1.5s ease-out forwards" : undefined,
                    opacity: phase >= 4 ? 0 : undefined,
                    transition: "opacity 0.3s",
                }}
            >
                {chars.map((char, i) => (
                    <span
                        key={i}
                        className={`demo-anim inline-block font-black uppercase text-5xl sm:text-7xl md:text-8xl ${exploded ? "" : ""}`}
                        style={{
                            fontFamily: '"Courier New", "Consolas", monospace',
                            color: exploded ? "#22d3ee" : "#ffffff",
                            textShadow: exploded
                                ? "0 0 8px #00f0ff, 0 0 20px #00f0ff88"
                                : "0 0 10px #00f0ff, 0 0 30px #00f0ff, 0 0 60px #00f0ff66",
                            animation: exploded
                                ? `demo-shard 0.5s ease-out forwards`
                                : undefined,
                            animationDelay: exploded ? `${i * 30}ms` : undefined,
                            "--sx": exploded ? `${(i % 2 === 0 ? 1 : -1) * (40 + i * 15)}px` : undefined,
                            "--sy": exploded ? `${-30 - i * 10}px` : undefined,
                            "--sr": exploded ? `${(i % 2 === 0 ? 1 : -1) * 45}deg` : undefined,
                        }}
                    >
                        {char}
                    </span>
                ))}
            </div>

            {/* Streak badge */}
            {phase >= 2 && phase < 4 && (
                <div
                    className="demo-anim absolute z-20 flex items-center gap-2 bg-gradient-to-r from-cyan-500/20 to-emerald-600/20 rounded-full px-4 py-1.5 border border-cyan-400/40"
                    style={{
                        bottom: "20%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        animation: "demo-streak-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                    }}
                >
                    <span className="material-symbols-outlined text-base" style={{ color: "#00f0ff" }}>bolt</span>
                    <span className="text-xs font-black uppercase tracking-widest text-cyan-200/90">STREAK</span>
                    <span className="text-xl font-black text-white italic">3</span>
                </div>
            )}
        </div>
    );
}

/* ── Slide 2: Story Quest ────────────────────────────── */

function StoryQuestSlide({ phase }) {
    const isMispronounced = phase >= 1 && phase < 2;
    const isCorrect = phase >= 2;
    const showFeedback = phase >= 2 && phase < 4;

    return (
        <div className="absolute inset-0 flex items-center justify-center px-4 sm:px-8">
            <div className="flex flex-wrap justify-center gap-x-4 sm:gap-x-6 gap-y-4">
                {STORY_SENTENCE.map((word, i) => {
                    const isActive = i === 2; // "brown" is the active word
                    return (
                        <span
                            key={i}
                            className={`demo-anim relative font-bold text-2xl sm:text-4xl md:text-5xl transition-all duration-300 ${
                                isActive
                                    ? isMispronounced
                                        ? "text-rose-400 border-2 border-rose-500 rounded-lg px-2 py-1 bg-slate-900/80"
                                        : isCorrect
                                            ? "text-quest border-2 border-quest/80 rounded-lg px-2 py-1 bg-slate-900/80"
                                            : "text-quest border-2 border-transparent"
                                    : "text-on-surface-variant/40"
                            }`}
                            style={
                                isActive && isCorrect
                                    ? { boxShadow: "0 0 12px rgba(56,189,248,0.4)" }
                                    : isActive && isMispronounced
                                        ? { boxShadow: "0 0 12px rgba(244,63,94,0.4)" }
                                        : undefined
                            }
                        >
                            {word}

                            {/* Mispronounce shake indicator */}
                            {isActive && isMispronounced && (
                                <span
                                    className="demo-anim absolute -top-5 left-1/2 -translate-x-1/2 text-xs font-black text-rose-400 whitespace-nowrap"
                                    style={{ animation: "demo-feedback 0.8s ease-out forwards" }}
                                >
                                    Try again!
                                </span>
                            )}

                            {/* Correct feedback */}
                            {isActive && showFeedback && !isMispronounced && (
                                <span
                                    className="demo-anim absolute -top-6 left-1/2 -translate-x-1/2 font-black italic text-base sm:text-lg text-yellow-300 whitespace-nowrap"
                                    style={{
                                        filter: "drop-shadow(0 0 10px rgba(255,200,0,0.7))",
                                        animation: "demo-feedback 1s ease-out forwards",
                                    }}
                                >
                                    GOOD!
                                </span>
                            )}
                        </span>
                    );
                })}
            </div>

            {/* Points float */}
            {isCorrect && (
                <div
                    className="demo-anim absolute font-black italic text-xl sm:text-2xl"
                    style={{
                        top: "20%",
                        right: "20%",
                        color: "#FFCC00",
                        textShadow: "2px 2px 0px rgba(0,0,0,0.5)",
                        WebkitTextStroke: "1px #827717",
                        animation: "demo-float 0.8s ease-out forwards",
                    }}
                >
                    +10
                </div>
            )}

            {/* Streak fire badge */}
            {phase >= 3 && phase < 5 && (
                <div
                    className="demo-anim absolute z-20 flex items-center gap-2 bg-slate-900/80 rounded-full px-4 py-1.5 border border-amber-400/60"
                    style={{
                        bottom: "18%",
                        left: "50%",
                        transform: "translateX(-50%)",
                        animation: "demo-streak-in 0.4s cubic-bezier(0.34,1.56,0.64,1) forwards",
                    }}
                >
                    <span className="material-symbols-outlined text-base" style={{ color: "#ff8800" }}>local_fire_department</span>
                    <span className="text-xs font-black uppercase tracking-widest text-amber-200/90">STREAK</span>
                    <span className="text-xl font-black text-white italic">2</span>
                </div>
            )}
        </div>
    );
}

/* ── Slide 3: Badges ─────────────────────────────────── */

function BadgesSlide({ phase }) {
    const showName = phase >= 1;
    const showPoints = phase >= 2;

    return (
        <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            {/* Badge icon */}
            <div
                className="demo-anim relative flex items-center justify-center w-24 h-24 sm:w-32 sm:h-32 rounded-full border-4 border-accent bg-surface-container-high"
                style={{
                    animation: showName
                        ? "demo-badge-glow 1.5s ease-in-out infinite"
                        : "demo-badge-pop 0.6s cubic-bezier(0.34,1.56,0.64,1) forwards",
                }}
            >
                <span
                    className="material-symbols-outlined text-5xl sm:text-6xl"
                    style={{
                        color: "#a3e635",
                        fontVariationSettings: "'FILL' 1",
                        filter: "drop-shadow(0 0 10px rgba(163,230,53,0.5))",
                    }}
                >
                    {BADGE_ICON}
                </span>
            </div>

            {/* Badge name */}
            {showName && (
                <div
                    className="demo-anim text-center"
                    style={{ animation: "demo-feedback 0.5s ease-out forwards" }}
                >
                    <p className="font-black uppercase italic text-xl sm:text-2xl text-accent tracking-tight">
                        {BADGE_NAME}
                    </p>
                    <p className="text-sm font-bold text-on-surface-variant mt-1">
                        Badge unlocked!
                    </p>
                </div>
            )}

            {/* Points */}
            {showPoints && (
                <div
                    className="demo-anim font-black italic text-3xl sm:text-4xl"
                    style={{
                        color: "#a3e635",
                        textShadow: "0 0 16px rgba(163,230,53,0.6)",
                        animation: "demo-float 1s ease-out forwards",
                    }}
                >
                    +50
                </div>
            )}
        </div>
    );
}
