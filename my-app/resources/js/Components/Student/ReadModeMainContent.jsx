import { useEffect, useState, memo } from "react";

const FRUIT_COLORS = [
    { shadow: "#FF3B30", bubble: "bg-red-500/40" }, // Watermelon Red
    { shadow: "#4CD964", bubble: "bg-green-500/40" }, // Lime Green
    { shadow: "#FF9500", bubble: "bg-orange-500/40" }, // Orange
    { shadow: "#FFCC00", bubble: "bg-yellow-500/40" }, // Lemon Yellow
    { shadow: "#5856D6", bubble: "bg-purple-500/40" }, // Grape Purple
    { shadow: "#007AFF", bubble: "bg-blue-500/40" }, // Blueberry Blue
    { shadow: "#FF2D55", bubble: "bg-pink-500/40" }, // Dragonfruit Pink
];

const ReadModeMainContent = memo(function ReadModeMainContent({
    words,
    currentIndex,
    gameState,
    countdownValue,
    isExploding,
    interimMatch,
}) {
    const isActive = gameState === "ACTIVE";
    const currentWord =
        words && words.length > currentIndex ? words[currentIndex] : null;
    const [randomLeft, setRandomLeft] = useState("50%");
    const [activeColor, setActiveColor] = useState(FRUIT_COLORS[0]);

    useEffect(() => {
        if (isActive && currentWord) {
            // Cycle through positions: Right (80%), Center (50%), Left (20%)
            const positions = ["80%", "50%", "20%"];
            setRandomLeft(positions[currentIndex % positions.length]);

            // Pick a random color for this word
            const randomColor =
                FRUIT_COLORS[Math.floor(Math.random() * FRUIT_COLORS.length)];
            setActiveColor(randomColor);
        }
    }, [currentIndex, isActive, currentWord]);

    return (
        <div className="flex-1 w-full relative overflow-hidden pointer-events-none">
            <style>
                {`
                    @keyframes fruitNinjaFall {
                        0% { top: -10%; opacity: 0; } /* Start slightly above the viewport */
                        100% { top: 30%; opacity: 1; } /* Fall to the 30% mark */
                    }
                    .animate-fruit-ninja {
                        animation: fruitNinjaFall 2s ease-out forwards; /* Slower fall over 2 seconds */
                    }
                    @keyframes blast {
                        0% { transform: scale(1) translate(0, 0); opacity: 1; filter: brightness(1); }
                        10% { transform: scale(1.1) translate(-3px, 3px); filter: brightness(1.5); }
                        20% { transform: scale(1.2) translate(3px, -3px); filter: brightness(2); }
                        30% { transform: scale(1.3) translate(-3px, -3px); filter: brightness(1.5); }
                        40% { transform: scale(1.4) translate(3px, 3px); filter: brightness(2); }
                        100% { transform: scale(4.5); opacity: 0; filter: brightness(3); }
                    }
                    .animate-blast {
                        animation: blast 0.5s ease-out forwards;
                    }
                    @keyframes pulse-glow-read {
                        0%, 100% {
                            filter: brightness(1) drop-shadow(0 0 10px rgba(163,230,53,0.5));
                            transform: translateX(-50%) scale(1);
                        }
                        50% {
                            filter: brightness(1.3) drop-shadow(0 0 30px rgba(163,230,53,0.9));
                            transform: translateX(-50%) scale(1.05);
                        }
                    }
                `}
            </style>

            {gameState === "COUNTDOWN" ? (
                <div className="flex-1 flex items-center justify-center">
                    <span className="text-[12rem] mt-10 font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                        {countdownValue}
                    </span>
                </div>
            ) : (
                isActive &&
                currentWord && (
                    <div
                        key={currentIndex} // Key to re-trigger animation on index change
                        className="absolute flex flex-col items-center justify-center animate-fruit-ninja"
                        style={{
                            left: randomLeft,
                            transform: "translateX(-50%)",
                        }} // Apply random horizontal position and center it
                    >
                        <div className="text-center">
                            <p
                                className={`text-8xl font-black tracking-tight uppercase transition-all duration-300 ${
                                    isExploding ? "animate-blast" : ""
                                }`}
                                style={{
                                    color: "#FFFFFF",
                                    fontFamily:
                                        'Impact, Haettenschweiler, "Arial Narrow Bold", sans-serif',
                                    textShadow: `
                                        2px 2px 0px ${activeColor.shadow},
                                        4px 4px 0px ${activeColor.shadow},
                                        6px 6px 0px rgba(0,0,0,0.3)
                                    `,
                                    ...(interimMatch && !isExploding
                                        ? { animation: "pulse-glow-read 0.8s ease-in-out infinite" }
                                        : {}),
                                }}
                            >
                                {currentWord.word}
                            </p>
                        </div>
                    </div>
                )
            )}
        </div>
    );
});

export default ReadModeMainContent;
