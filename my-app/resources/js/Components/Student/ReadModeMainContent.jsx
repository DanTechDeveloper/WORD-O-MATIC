import { useEffect, useState } from "react";

const FRUIT_COLORS = [
    { shadow: "#FF3B30", bubble: "bg-red-500/40" }, // Watermelon Red
    { shadow: "#4CD964", bubble: "bg-green-500/40" }, // Lime Green
    { shadow: "#FF9500", bubble: "bg-orange-500/40" }, // Orange
    { shadow: "#FFCC00", bubble: "bg-yellow-500/40" }, // Lemon Yellow
    { shadow: "#5856D6", bubble: "bg-purple-500/40" }, // Grape Purple
    { shadow: "#007AFF", bubble: "bg-blue-500/40" }, // Blueberry Blue
    { shadow: "#FF2D55", bubble: "bg-pink-500/40" }, // Dragonfruit Pink
];

export default function ReadModeMainContent({
    words,
    currentIndex,
    isActive,
    isExploding,
}) {
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
                        0% { transform: scale(1); opacity: 1; filter: brightness(1); }
                        100% { transform: scale(3.5); opacity: 0; filter: brightness(2); }
                    }
                    .animate-blast {
                        animation: blast 0.5s ease-out forwards;
                    }
                `}
            </style>

            {isActive && currentWord && (
                <div
                    key={currentIndex} // Key to re-trigger animation on index change
                    className="absolute flex flex-col items-center justify-center animate-fruit-ninja"
                    style={{ left: randomLeft, transform: "translateX(-50%)" }} // Apply random horizontal position and center it
                >
                    <div className="text-center">
                        <p
                            className={`text-7xl font-black italic tracking-widest uppercase transition-colors duration-300 ${
                                isExploding ? "animate-blast" : ""
                            }`}
                            style={{
                                color: activeColor.shadow,
                                fontFamily:
                                    '"Arial Black", "Arial Bold", Gadget, sans-serif',
                            }}
                        >
                            {currentWord.word}
                        </p>
                    </div>
                </div>
            )}
        </div>
    );
}
