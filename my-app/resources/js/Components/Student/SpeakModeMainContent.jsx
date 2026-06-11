import { memo } from "react";

const SpeakModeMainContent = memo(function SpeakModeMainContent({
    words,
    currentWordIndex,
    gameState,
    countdownValue,
    interimMatch,
}) {
    return (
        <>
            <style>
                {`
                    @keyframes pulse-glow {
                        0%, 100% {
                            opacity: 1;
                            filter: drop-shadow(0 0 10px rgba(163,230,53,0.5));
                            transform: scale(1.10);
                        }
                        50% {
                            opacity: 0.7;
                            filter: drop-shadow(0 0 25px rgba(163,230,53,0.9));
                            transform: scale(1.15);
                        }
                    }
                `}
            </style>
            <main className="flex-grow overflow-y-auto flex flex-col items-start justify-center max-w-7xl mx-auto w-full py-10 px-8">
                {gameState === "COUNTDOWN" ? (
                    <div className="w-full flex items-center justify-center">
                        <span className="text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                            {countdownValue}
                        </span>
                    </div>
                ) : (
                    <div className="w-full relative">
                        <div className="font-headline-xl text-left leading-relaxed tracking-tight select-none text-4xl md:text-5xl lg:text-6xl flex flex-wrap gap-x-4 gap-y-2">
                            {words.map((word, index) => (
                                <span
                                    key={index}
                                    className={`transition-all duration-300 ${
                                        index < currentWordIndex
                                            ? "opacity-20 text-on-background" // Spoken: low opacity
                                            : index === currentWordIndex
                                              ? interimMatch
                                                ? "text-lime-400 opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]" // Interim: pulsing
                                                : "text-lime-400 opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]" // Current: Highlighted
                                              : "opacity-60 text-on-background/50" // Future: default
                                    }`}
                                    style={
                                        index === currentWordIndex && interimMatch
                                            ? { animation: "pulse-glow 0.8s ease-in-out infinite" }
                                            : undefined
                                    }
                                >
                                    {word}
                                </span>
                            ))}
                        </div>
                    </div>
                )}
            </main>
        </>
    );
});

export default SpeakModeMainContent;
