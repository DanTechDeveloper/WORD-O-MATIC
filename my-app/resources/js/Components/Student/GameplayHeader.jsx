import { useState, useEffect, useRef, memo } from "react";

const GameplayHeader = memo(function GameplayHeader({
    level,
    isActive,
    scoreEmphasize,
    wordsSmashed = 0,
    onTimeUp,
    showPointsFeedback,
    pointsFeedbackValue,
    streakShake,
}) {
    const [timeLeft, setTimeLeft] = useState(60);

    useEffect(() => {
        if (!isActive) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(timer);
                    if (onTimeUpRef.current) onTimeUpRef.current();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive]);

    useEffect(() => {
        if (!isActive) {
            setTimeLeft(60);
        }
    }, [isActive]);

    const isLowTime = timeLeft <= 10;
    const onTimeUpRef = useRef(onTimeUp);
    onTimeUpRef.current = onTimeUp;
    const totalTime = 60;
    const percentage = (timeLeft / totalTime) * 100;

    return (
        <>
            {/* ───── Mobile layout ───── */}
            <div className="mt-3 w-full max-w-7xl mx-auto flex items-center justify-between gap-2 mb-4 px-2 lg:hidden">
                {/* Level Title */}
                <div className="bg-on-background/10 backdrop-blur-sm px-3 py-1 rounded-full border-2 border-on-background/20 shadow-md">
                    <span className="text-on-background font-black tracking-tight text-[10px] italic uppercase">
                        {level}
                    </span>
                </div>

                {/* Live Timer */}
                <div className="flex items-center gap-1.5 bg-on-background/5 backdrop-blur-md px-3 py-1.5 rounded-xl border-2 border-on-background/10 shadow-xl">
                    <span className="material-symbols-outlined text-on-background/60 text-base">
                        timer
                    </span>
                    <p
                        className={`text-xl font-black leading-none italic ${isLowTime ? "text-red-500 animate-pulse" : "text-lime-400"}`}
                    >
                        {timeLeft}s
                    </p>
                    {isLowTime && (
                        <span className="text-red-400 text-[10px] font-black">⚠️</span>
                    )}
                </div>
            </div>

            {/* ───── Desktop layout ───── */}
            <div className="hidden lg:flex mt-3 sm:mt-4 md:mt-6 w-full max-w-7xl mx-auto flex-wrap items-center justify-between gap-3 sm:gap-4 md:gap-6 mb-6 sm:mb-8 md:mb-12 px-2 sm:px-0">
                <div className="flex items-center gap-3 sm:gap-4 md:gap-6">
                    <div className="flex items-center gap-2 sm:gap-3 md:gap-4 bg-on-background/5 backdrop-blur-md p-2 sm:p-3 md:p-4 rounded-2xl border-2 border-on-background/10 shadow-2xl">
                        <div className="bg-primary p-1 sm:p-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                            <span className="material-symbols-outlined text-on-primary text-2xl sm:text-3xl">
                                sword_rose
                            </span>
                        </div>
                        <div className="relative">
                            <p className="text-on-background/60 text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none mb-1">
                                Words Smashed
                            </p>
                            <p className="text-on-background text-2xl sm:text-3xl font-black leading-none italic">
                                <span
                                    className={`${
                                        scoreEmphasize ? "animate-score-pulse" : ""
                                    } ${streakShake ? "animate-streak-number-shake" : ""}`}
                                >
                                    {wordsSmashed.toLocaleString()}
                                </span>
                            </p>
                            {showPointsFeedback && pointsFeedbackValue > 0 && (
                                <div
                                    className="absolute -top-8 sm:-top-9 md:-top-10 left-0 text-lime-400 text-3xl sm:text-4xl md:text-5xl font-black uppercase animate-points-feedback whitespace-nowrap drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                                    style={{
                                        animationDuration: "0.5s",
                                    }}
                                >
                                    +{pointsFeedbackValue}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Level Info */}
                <div className="flex flex-col items-center">
                    <div className="bg-on-background/10 backdrop-blur-sm px-8 py-2 rounded-full border-2 border-on-background/20 mb-2 shadow-lg">
                        <span className="text-on-background font-black tracking-tight text-sm italic uppercase">
                            {`LEVEL ${level}`}
                        </span>
                    </div>
                </div>

                {/* Energy / Timer Bar */}
                <div className="w-full md:w-72 lg:w-80 flex flex-col gap-2 bg-on-background/5 backdrop-blur-md p-2 sm:p-3 md:p-4 rounded-2xl border-2 border-on-background/10 shadow-2xl">
                    <div className="flex justify-between items-end">
                        <p className="text-on-background/60 text-[10px] sm:text-xs font-black uppercase tracking-widest leading-none">
                            Energy / Timer
                        </p>
                        <div className="flex flex-col items-end">
                            <p
                                className={`text-3xl sm:text-4xl font-black leading-none italic ${isLowTime ? "text-red-500 animate-pulse" : "text-lime-400"}`}
                            >
                                {timeLeft}s
                            </p>
                            <p
                                className={`text-[10px] font-black uppercase tracking-tighter ${isLowTime ? "text-red-400" : "text-lime-400/50"}`}
                            >
                                {isLowTime && timeLeft > 0
                                    ? "⚠️ Critical Time!"
                                    : "🚀 Hyper-Drive!"}
                            </p>
                        </div>
                    </div>
                    <div className="h-4 w-full bg-on-background/10 rounded-full overflow-hidden border-2 border-on-background/5 p-0.5">
                        <div
                            className={`h-full rounded-full transition-all duration-1000 ease-linear ${
                                isLowTime
                                    ? "bg-red-500 shadow-[0_0_20px_rgba(239,68,68,0.6)]"
                                    : "bg-gradient-to-r from-primary via-fuchsia-500 to-lime-400 shadow-[0_0_15px_rgba(132,204,22,0.4)]"
                            }`}
                            style={{ width: `${percentage}%` }}
                        ></div>
                    </div>
                </div>
            </div>
        </>
    );
});

export default GameplayHeader;
