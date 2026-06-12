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
}) {
    const isActive = gameState === "ACTIVE";
    const word = words?.[currentIndex];

    const positions = ["80%", "50%", "20%"];
    const randomLeft = positions[currentIndex % positions.length];

    const color = FRUIT_COLORS[currentIndex % FRUIT_COLORS.length];

    if (gameState === "COUNTDOWN") {
        return (
            <div className="flex-1 flex items-center justify-center">
                <span className="text-[12rem] mt-10 font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                    {countdownValue}
                </span>
            </div>
        );
    }

    if (!isActive || !word) {
        return null;
    }

    return (
        <div className="flex-1 w-full relative overflow-hidden pointer-events-none">
            <style>
                {`
                    @keyframes fruitNinjaFall {
                        0% { top: -10%; opacity: 0; }
                        100% { top: 30%; opacity: 1; }
                    }

                    .animate-fruit-ninja {
                        animation: fruitNinjaFall 2s ease-out forwards;
                    }

                    @keyframes blast {
                        0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                        100% { transform: scale(4.5); opacity: 0; filter: brightness(3); }
                    }

                    .animate-blast {
                        animation: blast 0.5s ease-out forwards;
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
                `}
            </style>

            <div
                key={`${currentIndex}-${word.word}`}
                className="absolute flex flex-col items-center justify-center animate-fruit-ninja"
                style={{
                    left: randomLeft,
                    transform: "translateX(-50%)",
                }}
            >
                {showPointsFeedback && (
                    <div
                        className="absolute -top-16 animate-float-score text-6xl font-black italic"
                        style={{
                            color: "#FFCC00",
                            textShadow: "4px 4px 0px rgba(0,0,0,0.5)",
                            WebkitTextStroke: "2px #827717",
                        }}
                    >
                        +{pointsFeedbackValue}
                    </div>
                )}

                <p
                    className={`text-8xl font-black tracking-tight uppercase transition-all duration-300 ${
                        isExploding ? "animate-blast" : ""
                    } ${isMispronounced ? "animate-shake" : ""}`}
                    style={{
                        color: "#FFFFFF",
                        fontFamily:
                            'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
                        textShadow: `
                            2px 2px 0px ${color.shadow},
                            4px 4px 0px ${color.shadow},
                            6px 6px 0px rgba(0,0,0,0.3)
                        `,
                    }}
                >
                    {word.word}
                </p>
            </div>
        </div>
    );
});

export default ReadModeMainContent;
