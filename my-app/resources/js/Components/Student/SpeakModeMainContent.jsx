import { memo, useRef, useEffect } from "react";

const SpeakModeMainContent = memo(function SpeakModeMainContent({
    words,
    currentIndex,
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

    useEffect(() => {
        activeWordRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
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
                <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-6xl sm:text-8xl md:text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                        {countdownValue}
                    </span>
                </div>
            ) : (
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 flex items-start sm:items-center justify-center overflow-y-auto px-4 sm:px-8 py-16">
                        <div className="relative w-full max-w-7xl">
                            <div className="sticky top-2 z-30 flex items-center justify-center gap-4 mb-4 min-h-[3.5rem]" />

                            <div className={`font-headline-xl text-left leading-relaxed tracking-tight select-none text-4xl md:text-5xl lg:text-7xl flex flex-wrap gap-x-4 gap-y-8`}>
                                {words.map((word, index) => (
                                    <span
                                        key={index}
                                        ref={index === currentIndex ? activeWordRef : undefined}
                                        className={`transition-all duration-300 whitespace-nowrap relative ${index === currentIndex && streakShake ? `animate-streak-shake-${streakShake} ` : ""}${
                                            index < currentIndex
                                                ? "opacity-20 text-on-background"
                                                : index === currentIndex
                                                  ? (isMispronounced
                                                        ? "text-rose-400 opacity-100 relative z-10 border-2 border-rose-500 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-shake"
                                                        : "text-lime-400 opacity-100 relative z-10 border-2 border-lime-400/80 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]")
                                                  : "opacity-60 text-on-background/50"
                                        }`}
                                    >
                                        {index === currentIndex && feedbackType && (
                                            <span
                                                className={`absolute left-1/2 -translate-x-1/2 -top-10 sm:-top-12 z-30 flex items-center gap-2 font-black italic whitespace-nowrap text-xl sm:text-2xl md:text-3xl rounded-full px-3 py-1 border bg-slate-900/85 animate-feedback-pop ${
                                                    feedbackType === "correct"
                                                        ? "text-yellow-300 border-amber-400/60"
                                                        : "text-cyan-300 border-sky-400/60"
                                                }`}
                                                style={{
                                                    filter:
                                                        feedbackType === "correct"
                                                            ? "drop-shadow(0 0 14px rgba(255,200,0,0.7))"
                                                            : "drop-shadow(0 0 12px rgba(34,211,238,0.6))",
                                                }}
                                            >
                                                {feedbackMessage}
                                                {feedbackType === "correct" && (
                                                    <span className="flex items-center gap-1">
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
