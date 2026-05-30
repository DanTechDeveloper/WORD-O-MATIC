import GameplayLayout from "@/Layouts/GameplayLayout";
export default function GameplaySpeakMode() {
    const storySegments = [
        {
            text: "In a distant nebula, a brave ",
            className: "text-on-background/40",
        },
        {
            text: "galactic explorer",
            className:
                "relative inline-block bg-lime-400 text-slate-950 px-4 rounded-sm neo-shadow-lime py-0.5",
            hasCursor: true,
        },
        {
            text: " prepares to chart the unknown clusters of the binary sun system. The engines hum with plasma energy as the navigation bot calculates the hyperspace jump sequence.",
            className: "text-purple-900/40 opacity-50",
        },
    ];

    return (
        <>
            <GameplayLayout>
                <main className="flex-grow overflow-y-auto flex flex-col items-start justify-center max-w-7xl mx-auto w-full py-10 px-8">
                    <div className="w-full relative">
                        <div className="font-headline-xl text-left leading-tight tracking-tight select-none text-4xl md:text-5xl lg:text-6xl">
                            {storySegments.map((segment, index) => (
                                <span key={index} className={segment.className}>
                                    {segment.hasCursor && (
                                        <span className="blinking-cursor"></span>
                                    )}
                                    {segment.text}
                                </span>
                            ))}
                        </div>
                    </div>
                </main>
            </GameplayLayout>
        </>
    );
}
