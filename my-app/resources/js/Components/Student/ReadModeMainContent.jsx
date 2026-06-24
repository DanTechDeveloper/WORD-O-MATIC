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
                                className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight uppercase break-words text-center"
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
                </>
            ) : null}
        </div>
    );
});

export default ReadModeMainContent;
