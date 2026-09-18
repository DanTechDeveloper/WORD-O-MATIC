import { memo, useRef, useEffect } from "react";

const SpeakModeMainContent = memo(function SpeakModeMainContent({
    words,
    currentIndex,
    highlightCount = 1,
    gameState,
    countdownValue,
    isMispronounced,
    showPointsFeedback,
    pointsFeedbackValue,
    streak,
    feedbackType,
    feedbackMessage,
    streakShake,
}) {
    const activeWordRef = useRef(null);
    const activeCount = Math.max(1, highlightCount | 0 || 1);

    useEffect(() => {
        activeWordRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }, [currentIndex]);

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
                        0% { transform: translateY(8px) scale(0.8); opacity: 0; }
                        30% { transform: translateY(0) scale(1); opacity: 1; }
                        100% { transform: translateY(0) scale(1); opacity: 1; }
                    }
                    .animate-feedback-pop {
                        animation: feedback-pop 0.35s ease-out forwards;
                    }
                `}
            </style>

            {gameState === "IDLE" ? (
                <div className="flex-1 flex" />
            ) : gameState === "COUNTDOWN" ? (
                <div className="absolute inset-0 flex items-center justify-center px-4">
                    <span className="text-5xl xs:text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-extrabold text-quest italic animate-bounce drop-shadow-[0_0_24px_rgba(56,189,248,0.5)] text-center">
                        {countdownValue}
                    </span>
                </div>
            ) : (
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 flex items-start justify-center overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-8 pt-12 sm:pt-15 pb-12 sm:pb-16">
                        <div className="relative w-full max-w-7xl my-auto">
                            <div className="sticky top-2 z-30 flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3 min-h-8 sm:min-h-10" />

                            <div
                                    className={`font-headline-xl text-left leading-relaxed tracking-normal sm:tracking-tight select-none font-medium sm:font-semibold lg:font-bold text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl flex flex-wrap gap-x-2 xs:gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-6 md:gap-y-8`}
                            >
                                {words.map((word, index) => (
                                    <span
                                        key={index}
                                        ref={
                                            index === currentIndex
                                                ? activeWordRef
                                                : undefined
                                        }
                                        className={`transition-all duration-300 whitespace-nowrap relative ${index === currentIndex && streakShake ? `animate-streak-shake-${streakShake} ` : ""}${
                                            index < currentIndex
                                                ? "opacity-20 text-on-background"
                                                : index >= currentIndex && index < currentIndex + activeCount
                                                  ? isMispronounced && index === currentIndex
                                                      ? "font-bold sm:font-extrabold text-rose-400 opacity-100 relative z-10 border-2 border-rose-500 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-shake"
                                                      : "font-bold sm:font-extrabold text-quest opacity-100 relative z-10 border-2 border-quest/80 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                                  : "opacity-60 text-on-background/50"
                                        }`}
                                    >
                                        {index === currentIndex &&
                                            feedbackType && (
                                                <span
                                                    className={`absolute left-1/2 -translate-x-1/2 -top-5 xs:-top-6 sm:-top-7 md:-top-9 z-30 flex items-center gap-1 sm:gap-1.5 font-bold italic whitespace-normal text-center leading-tight text-sm xs:text-sm sm:text-base md:text-lg lg:text-xl rounded-full px-3 sm:px-3.5 py-1 sm:py-1.5 border bg-slate-900/85 animate-feedback-pop w-max max-w-[88vw] sm:max-w-[380px] md:max-w-[420px] justify-center ${
                                                        feedbackType ===
                                                        "correct"
                                                            ? "text-yellow-300 border-amber-400/60"
                                                            : "text-rose-400 border-rose-500/60"
                                                    }`}
                                                    style={{
                                                        filter:
                                                            feedbackType ===
                                                            "correct"
                                                                ? "drop-shadow(0 0 8px rgba(255,200,0,0.45))"
                                                                : "drop-shadow(0 0 8px rgba(244,63,94,0.45))",
                                                    }}
                                                >
                                                    {feedbackMessage}
                                                    {feedbackType ===
                                                        "correct" && (
                                                        <span className="flex flex-wrap items-center justify-center gap-1 sm:gap-1.5">
                                                            <span
                                                                className="material-symbols-outlined text-lg xs:text-xl sm:text-2xl md:text-2xl"
                                                                style={{
                                                                    color:
                                                                        streak >=
                                                                        5
                                                                            ? "#ff4444"
                                                                            : streak >=
                                                                                 3
                                                                              ? "#ff8800"
                                                                              : "#ffcc00",
                                                                    filter: `drop-shadow(0 0 6px ${streak >= 5 ? "#ff444488" : streak >= 3 ? "#ff880088" : "#ffcc0088"})`,
                                                                }}
                                                            >
                                                                local_fire_department
                                                            </span>
                                                            <span className="text-[10px] xs:text-xs sm:text-xs md:text-sm font-bold uppercase tracking-widest text-amber-200/90">
                                                                STREAK!
                                                            </span>
                                                            <span className="text-xl xs:text-xl sm:text-2xl md:text-3xl font-extrabold text-white">
                                                                {streak}
                                                            </span>
                                                        </span>
                                                    )}
                                                </span>
                                            )}
                                        {word}
                                    </span>
                                ))}
                            </div>
                        </div>

                        {showPointsFeedback && (
                            <div
                                className="absolute -top-10 left-1/2 -translate-x-1/2 animate-float-score text-2xl sm:text-3xl font-extrabold italic z-10 whitespace-nowrap"
                                style={{
                                    color: "#FFCC00",
                                    textShadow: "0 0 12px rgba(0,0,0,0.45)",
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
