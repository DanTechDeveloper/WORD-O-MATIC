import { memo } from "react";

const HOLO_COLORS = [
    { glow: "#00f0ff", bubble: "bg-cyan-500/40" },
    { glow: "#ff00ff", bubble: "bg-fuchsia-500/40" },
    { glow: "#00ff88", bubble: "bg-emerald-500/40" },
    { glow: "#ff6600", bubble: "bg-orange-500/40" },
    { glow: "#8844ff", bubble: "bg-violet-500/40" },
    { glow: "#ff2266", bubble: "bg-pink-500/40" },
    { glow: "#44ff44", bubble: "bg-lime-500/40" },
];

const ReadModeMainContent = memo(function ReadModeMainContent({
    words,
    currentIndex,
    gameState,
    countdownValue,
    isExploding,
    isMispronounced,
    showPointsFeedback,
    pointsFeedbackValue,
    streak,
    feedbackType,
    feedbackMessage,
    isWordReady,
    streakShake,
}) {
    const isActive = gameState === "ACTIVE";
    const word = words?.[currentIndex];

    const positions = ["80%", "50%", "20%"];
    const randomLeft = positions[currentIndex % positions.length];

    const color = HOLO_COLORS[currentIndex % HOLO_COLORS.length];
    const chars = word ? word.word.split("") : [];

    return (
        <div className="flex-1 w-full relative overflow-hidden pointer-events-none">
            {gameState === "COUNTDOWN" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl md:text-[12rem] font-black text-cyan-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(0,240,255,0.6)]">
                        {countdownValue}
                    </span>
                </div>
            ) : isActive && word ? (
                <>
                    <style>
                        {`
                            @keyframes holo-rise {
                                0% { top: -10%; opacity: 0; filter: blur(4px); }
                                50% { filter: blur(0px); }
                                100% { top: 30%; opacity: 1; }
                            }
                            .animate-holo-rise {
                                animation: holo-rise 2s ease-out forwards;
                            }

                            @keyframes shake {
                                0%, 100% { transform: translateX(0); }
                                25% { transform: translateX(-15px); }
                                75% { transform: translateX(15px); }
                            }
                            .animate-shake {
                                animation: shake 0.3s ease-in-out;
                            }

                            @keyframes float-score {
                                0% { transform: translateY(0); opacity: 1; }
                                100% { transform: translateY(-100px); opacity: 0; }
                            }
                            .animate-float-score {
                                animation: float-score 0.5s ease-out forwards;
                            }

                            @keyframes data-shard {
                                0% {
                                    transform: translate(0,0) rotate(0deg) scale(1);
                                    opacity: 1;
                                    color: #ffffff;
                                    filter: brightness(1) blur(0px);
                                }
                                15% {
                                    color: #00f0ff;
                                    filter: brightness(2.5) blur(0px);
                                }
                                40% {
                                    color: #0aff88;
                                    filter: brightness(3.5) blur(1px);
                                }
                                100% {
                                    transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(2);
                                    opacity: 0;
                                    color: #22d3ee;
                                    filter: brightness(5) blur(6px);
                                }
                            }
                            .animate-data-shard {
                                animation: data-shard 0.5s ease-out forwards;
                            }

                            @keyframes energy-burst {
                                0% { opacity: 0; transform: scale(0.2); }
                                15% { opacity: 0.7; transform: scale(1.1); }
                                50% { opacity: 0.4; transform: scale(1.4); }
                                100% { opacity: 0; transform: scale(2); }
                            }

                            @keyframes streak-glow {
                                0%, 100% { box-shadow: 0 0 10px rgba(0, 240, 255, 0.3); }
                                50% { box-shadow: 0 0 25px rgba(0, 240, 255, 0.6); }
                            }
                            .animate-streak-glow {
                                animation: streak-glow 1s ease-in-out infinite;
                            }

                            @keyframes streak-bounce-in {
                                0% { transform: translateX(-50%) scale(0); opacity: 0; }
                                60% { transform: translateX(-50%) scale(1.15); opacity: 1; }
                                100% { transform: translateX(-50%) scale(1); opacity: 1; }
                            }
                            .animate-streak-bounce-in {
                                animation: streak-bounce-in 0.4s cubic-bezier(0.34, 1.56, 0.64, 1) forwards;
                            }

                            @keyframes word-lock-in {
                                0% { filter: grayscale(0.6) brightness(0.7); opacity: 0.4; }
                                50% { filter: grayscale(0.3) brightness(0.9); opacity: 0.7; }
                                100% { filter: grayscale(0) brightness(1); opacity: 1; }
                            }
                            .animate-word-lock-in {
                                animation: word-lock-in 0.4s ease-out forwards;
                            }

                            @keyframes feedback-from-word {
                                0% { transform: translateY(0) scale(0.5); opacity: 0; }
                                20% { transform: translateY(-8px) scale(1.15); opacity: 1; }
                                40% { transform: translateY(-16px) scale(1); opacity: 1; }
                                100% { transform: translateY(-70px) scale(0.9); opacity: 0; }
                            }
                            .animate-feedback-from-word {
                                animation: feedback-from-word 0.7s ease-out forwards;
                            }
                        `}
                    </style>

                    <div
                        key={`${currentIndex}-${word.word}`}
                        className="absolute flex flex-col items-center justify-center animate-holo-rise max-w-[90vw] px-2"
                        style={{
                            left: randomLeft,
                            transform: "translateX(-50%)",
                        }}
                    >
                        <div className={`relative ${isMispronounced ? "animate-shake" : ""} ${streakShake ? `animate-streak-shake-${streakShake}` : ""}`}>
                            <div className="flex items-center justify-center gap-4 mb-2">
                                {feedbackType && (
                                    <span
                                        className={`font-black whitespace-nowrap ${
                                            feedbackType === "correct"
                                                ? "text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-emerald-300 to-lime-400"
                                                : "text-2xl sm:text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-fuchsia-300 via-pink-400 to-rose-500"
                                        }`}
                                        style={{
                                            filter:
                                                feedbackType === "correct"
                                                    ? "drop-shadow(0 0 20px rgba(0,240,255,0.5)) drop-shadow(0 2px 2px rgba(0,0,0,0.3))"
                                                    : "drop-shadow(0 0 16px rgba(255,0,255,0.4)) drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                                            WebkitTextStroke:
                                                feedbackType === "correct"
                                                    ? "1px #065f46"
                                                    : "1px #4a044e",
                                        }}
                                    >
                                        {feedbackMessage}
                                    </span>
                                )}

                                {feedbackType === "correct" && (
                                    <div className="flex items-center gap-1 bg-gradient-to-r from-cyan-500/20 to-emerald-600/20 backdrop-blur-sm rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 border border-cyan-400/40 shadow-lg shadow-cyan-500/20">
                                        <span
                                            className="material-symbols-outlined text-lg sm:text-xl"
                                            style={{
                                                color:
                                                    streak >= 5
                                                        ? "#ff44ff"
                                                        : streak >= 3
                                                          ? "#00f0ff"
                                                          : "#44ff88",
                                                filter: `drop-shadow(0 0 6px ${streak >= 5 ? "#ff44ff88" : streak >= 3 ? "#00f0ff88" : "#44ff8888"})`,
                                            }}
                                        >
                                            bolt
                                        </span>
                                        <span className="text-base sm:text-lg md:text-xl font-black text-white">
                                            {streak}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {isExploding && (
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle, rgba(0,240,255,0.5) 0%, rgba(0,255,136,0.2) 30%, transparent 70%)",
                                        animation: "energy-burst 0.5s ease-out forwards",
                                    }}
                                />
                            )}
                            <p
                                className={`font-black tracking-tight uppercase whitespace-nowrap text-center ${
                                    !isWordReady
                                        ? "opacity-30 blur-[2px]"
                                        : "opacity-100 blur-0 transition-all duration-500"
                                }`}
                                style={{
                                    fontFamily: '"Courier New", "Consolas", "Monaco", monospace',
                                    fontSize: `clamp(2rem, ${Math.max(2, 8 - word.word.length * 0.4)}rem, 8rem)`,
                                    textShadow: `
                                        0 0 10px ${color.glow},
                                        0 0 30px ${color.glow},
                                        0 0 60px ${color.glow}66
                                    `,
                                }}
                            >
                                {chars.map((char, i) => {
                                    const angle =
                                        (i / Math.max(chars.length, 1)) * 360;
                                    const dist = 50 + (i % 3) * 25;
                                    const sx =
                                        Math.cos(
                                            (angle * Math.PI) / 180,
                                        ) * dist;
                                    const sy =
                                        Math.sin(
                                            (angle * Math.PI) / 180,
                                        ) * dist -
                                        40;
                                    const sr =
                                        (i % 2 === 0 ? 1 : -1) *
                                        (20 + (i % 5) * 15);
                                    return (
                                        <span
                                            key={i}
                                            className={`inline-block ${isExploding ? "animate-data-shard" : ""}`}
                                            style={{
                                                animationDelay: `${i * 30}ms`,
                                                "--sx": `${sx}px`,
                                                "--sy": `${sy}px`,
                                                "--sr": `${sr}deg`,
                                                textShadow: `
                                                    0 0 8px ${color.glow},
                                                    0 0 20px ${color.glow}88
                                                `,
                                            }}
                                        >
                                            {char === " " ? "\u00A0" : char}
                                        </span>
                                    );
                                })}
                            </p>
                        </div>

                        {showPointsFeedback && (
                            <div
                                className="absolute -top-12 sm:-top-14 md:-top-16 animate-float-score text-3xl sm:text-4xl md:text-6xl font-black italic"
                                style={{
                                    color: "#00f0ff",
                                    textShadow: "0 0 20px rgba(0,240,255,0.8), 0 0 40px rgba(0,240,255,0.4)",
                                }}
                            >
                                +{pointsFeedbackValue}
                            </div>
                        )}
                    </div>

                </>
            ) : null}
        </div>
    );
});

export default ReadModeMainContent;
