import { memo } from "react";

const FRUIT_COLORS = [
    { shadow: "#FF3B30", bubble: "bg-red-500/40" },
    { shadow: "#4CD964", bubble: "bg-green-500/40" },
    { shadow: "#FF9500", bubble: "bg-orange-500/40" },
    { shadow: "#FFCC00", bubble: "bg-yellow-500/40" },
    { shadow: "#5856D6", bubble: "bg-purple-500/40" },
    { shadow: "#007AFF", bubble: "bg-blue-500/40" },
    { shadow: "#FF2D55", bubble: "bg-pink-500/40" },
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
}) {
    const isActive = gameState === "ACTIVE";
    const word = words?.[currentIndex];

    const positions = ["80%", "50%", "20%"];
    const randomLeft = positions[currentIndex % positions.length];

    const color = FRUIT_COLORS[currentIndex % FRUIT_COLORS.length];
    const chars = word ? word.word.split("") : [];

    return (
        <div className="flex-1 w-full relative overflow-hidden pointer-events-none">
            {gameState === "COUNTDOWN" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl md:text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                        {countdownValue}
                    </span>
                </div>
            ) : isActive && word ? (
                <>
                    <style>
                        {`
                            @keyframes fruitNinjaFall {
                                0% { top: -10%; opacity: 0; }
                                100% { top: 30%; opacity: 1; }
                            }

                            .animate-fruit-ninja {
                                animation: fruitNinjaFall 2s ease-out forwards;
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

                            @keyframes shard {
                                0% {
                                    transform: translate(0,0) rotate(0deg) scale(1);
                                    opacity: 1;
                                    color: #ffffff;
                                    filter: brightness(1) blur(0px);
                                }
                                15% {
                                    color: #a5f3fc;
                                    filter: brightness(2.5) blur(0px);
                                }
                                40% {
                                    color: #67e8f9;
                                    filter: brightness(3.5) blur(1px);
                                }
                                100% {
                                    transform: translate(var(--sx),var(--sy)) rotate(var(--sr)) scale(2);
                                    opacity: 0;
                                    color: #22d3ee;
                                    filter: brightness(5) blur(6px);
                                }
                            }
                            .animate-shard {
                                animation: shard 0.5s ease-out forwards;
                            }

                            @keyframes frost-burst {
                                0% { opacity: 0; transform: scale(0.2); }
                                15% { opacity: 0.7; transform: scale(1.1); }
                                50% { opacity: 0.4; transform: scale(1.4); }
                                100% { opacity: 0; transform: scale(2); }
                            }

                            @keyframes streak-glow {
                                0%, 100% { box-shadow: 0 0 10px rgba(255, 200, 0, 0.3); }
                                50% { box-shadow: 0 0 25px rgba(255, 200, 0, 0.6); }
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
                        className="absolute flex flex-col items-center justify-center animate-fruit-ninja max-w-[90vw] px-2"
                        style={{
                            left: randomLeft,
                            transform: "translateX(-50%)",
                        }}
                    >
                        {feedbackType && (
                            <div className="absolute -top-14 sm:-top-16 md:-top-20 animate-feedback-from-word text-center w-full px-2">
                                <span
                                    className={`font-black italic ${
                                        feedbackType === "correct"
                                            ? "text-3xl sm:text-4xl md:text-5xl text-transparent bg-clip-text bg-gradient-to-r from-yellow-300 via-amber-400 to-orange-500"
                                            : "text-2xl sm:text-3xl md:text-4xl text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-sky-400 to-blue-500"
                                    }`}
                                    style={{
                                        filter:
                                            feedbackType === "correct"
                                                ? "drop-shadow(0 0 20px rgba(255,200,0,0.5)) drop-shadow(0 2px 2px rgba(0,0,0,0.3))"
                                                : "drop-shadow(0 0 16px rgba(34,211,238,0.4)) drop-shadow(0 2px 2px rgba(0,0,0,0.3))",
                                        WebkitTextStroke:
                                            feedbackType === "correct"
                                                ? "1.5px #92400e"
                                                : "1.5px #075985",
                                    }}
                                >
                                    {feedbackMessage}
                                </span>
                            </div>
                        )}

                        {showPointsFeedback && (
                            <div
                                className="absolute -top-12 sm:-top-14 md:-top-16 animate-float-score text-3xl sm:text-4xl md:text-6xl font-black italic"
                                style={{
                                    color: "#FFCC00",
                                    textShadow: "4px 4px 0px rgba(0,0,0,0.5)",
                                    WebkitTextStroke: "2px #827717",
                                }}
                            >
                                +{pointsFeedbackValue}
                            </div>
                        )}

                        <div className={`relative ${isMispronounced ? "animate-shake" : ""}`}>
                            {isExploding && (
                                <div
                                    className="absolute inset-0 rounded-full pointer-events-none"
                                    style={{
                                        background:
                                            "radial-gradient(circle, rgba(103,232,249,0.5) 0%, rgba(34,211,238,0.2) 30%, transparent 70%)",
                                        animation: "frost-burst 0.5s ease-out forwards",
                                    }}
                                />
                            )}
                            <p
                                className={`text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase break-words text-center ${
                                    !isWordReady
                                        ? "opacity-30 blur-[2px]"
                                        : "opacity-100 blur-0 transition-all duration-500"
                                }`}
                                style={{
                                    fontFamily:
                                        'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
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
                                            className={`inline-block ${isExploding ? "animate-shard" : ""}`}
                                            style={{
                                                animationDelay: `${i * 30}ms`,
                                                "--sx": `${sx}px`,
                                                "--sy": `${sy}px`,
                                                "--sr": `${sr}deg`,
                                                textShadow: `
                                                    2px 2px 0px ${color.shadow},
                                                    4px 4px 0px ${color.shadow},
                                                    6px 6px 0px rgba(0,0,0,0.3)
                                                `,
                                            }}
                                        >
                                            {char === " " ? "\u00A0" : char}
                                        </span>
                                    );
                                })}
                            </p>
                        </div>
                    </div>

                    {streak > 0 && (
                        <div
                            key={`streak-${streak}`}
                            className="absolute top-6 left-1/2 z-30 animate-streak-bounce-in"
                            style={{ transform: "translateX(-50%)" }}
                        >
                            <div className="flex items-center gap-1.5 sm:gap-2 bg-gradient-to-r from-amber-500/20 to-orange-600/20 backdrop-blur-sm rounded-full px-3 sm:px-4 py-1.5 sm:py-2 border border-amber-400/40 shadow-lg shadow-amber-500/20 animate-streak-glow">
                                <span
                                    className="material-symbols-outlined text-xl sm:text-2xl"
                                    style={{
                                        color:
                                            streak >= 5
                                                ? "#ff4444"
                                                : streak >= 3
                                                  ? "#ff8800"
                                                  : "#ffcc00",
                                        filter: `drop-shadow(0 0 6px ${streak >= 5 ? "#ff444488" : streak >= 3 ? "#ff880088" : "#ffcc0088"})`,
                                    }}
                                >
                                    local_fire_department
                                </span>
                                <span className="text-lg sm:text-xl md:text-2xl font-black text-white">
                                    {streak}
                                </span>
                            </div>
                        </div>
                    )}

                </>
            ) : null}
        </div>
    );
});

export default ReadModeMainContent;
