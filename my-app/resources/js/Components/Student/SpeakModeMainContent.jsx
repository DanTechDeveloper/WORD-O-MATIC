import { memo } from "react";

const SpeakModeMainContent = memo(function SpeakModeMainContent({
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
    streakShake,
}) {
    const isActive = gameState === "ACTIVE";

    return (
        <main className="flex-1 flex relative overflow-hidden">
            <style>
                {`
                    @keyframes float-score {
                        0% { transform: translateY(0); opacity: 1; }
                        100% { transform: translateY(-80px); opacity: 0; }
                    }
                    .animate-float-score {
                        animation: float-score 0.5s ease-out forwards;
                    }

                    @keyframes frost-burst {
                        0% { opacity: 0; transform: scale(0.2); }
                        15% { opacity: 0.7; transform: scale(1.1); }
                        50% { opacity: 0.4; transform: scale(1.4); }
                        100% { opacity: 0; transform: scale(2); }
                    }

                    @keyframes shake {
                        0%, 100% { transform: translateX(0); }
                        25% { transform: translateX(-15px); }
                        75% { transform: translateX(15px); }
                    }
                    .animate-shake {
                        animation: shake 0.3s ease-in-out;
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

                    @keyframes feedback-pop {
                        0% { transform: translateY(0) scale(0.5); opacity: 0; }
                        20% { transform: translateY(-8px) scale(1.15); opacity: 1; }
                        40% { transform: translateY(-16px) scale(1); opacity: 1; }
                        100% { transform: translateY(-60px) scale(0.9); opacity: 0; }
                    }
                    .animate-feedback-pop {
                        animation: feedback-pop 0.7s ease-out forwards;
                    }
                `}
            </style>

            {gameState === "COUNTDOWN" ? (
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl md:text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                        {countdownValue}
                    </span>
                </div>
            ) : (
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 flex items-center justify-center px-4 sm:px-8 py-16">
                        {isActive && isExploding && (
                            <div
                                className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 pointer-events-none z-20"
                                style={{
                                    background:
                                        "radial-gradient(circle, rgba(103,232,249,0.5) 0%, rgba(34,211,238,0.2) 30%, transparent 70%)",
                                    animation: "frost-burst 0.5s ease-out forwards",
                                }}
                            />
                        )}

                        <div className="relative w-full max-w-5xl">
                            <div className="flex items-center justify-center gap-4 mb-4">
                                {feedbackType && (
                                    <span
                                        className={`font-black italic whitespace-nowrap ${
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
                                )}

                                {feedbackType === "correct" && (
                                    <div className="flex items-center gap-1 bg-gradient-to-r from-amber-500/20 to-orange-600/20 backdrop-blur-sm rounded-full px-2.5 py-1 sm:px-3 sm:py-1.5 border border-amber-400/40 shadow-lg shadow-amber-500/20">
                                        <span
                                            className="material-symbols-outlined text-lg sm:text-xl"
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
                                        <span className="text-base sm:text-lg md:text-xl font-black text-white">
                                            {streak}
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={`font-headline-xl text-left leading-relaxed tracking-tight select-none text-4xl md:text-5xl lg:text-6xl flex flex-wrap gap-x-4 gap-y-3 ${isMispronounced ? "animate-shake" : ""} ${streakShake ? `animate-streak-shake-${streakShake}` : ""}`}>
                                {words.map((word, index) => (
                                    <span
                                        key={index}
                                        className={`transition-all duration-300 whitespace-nowrap ${
                                            index < currentIndex
                                                ? "opacity-20 text-on-background"
                                                : index === currentIndex
                                                  ? "text-lime-400 opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                                                  : "opacity-60 text-on-background/50"
                                        }`}
                                    >
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {showPointsFeedback && (
                            <div
                                className="absolute -top-10 left-1/2 -translate-x-1/2 animate-float-score text-3xl sm:text-4xl font-black italic z-10 whitespace-nowrap"
                                style={{
                                    color: "#FFCC00",
                                    textShadow: "4px 4px 0px rgba(0,0,0,0.5)",
                                    WebkitTextStroke: "2px #827717",
                                }}
                            >
                                +{pointsFeedbackValue}
                            </div>
                        )}
                    </div>
                </div>
            )}
        </main>
    );
});

export default SpeakModeMainContent;
