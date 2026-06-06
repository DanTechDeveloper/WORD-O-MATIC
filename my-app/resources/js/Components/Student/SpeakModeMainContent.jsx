export default function SpeakModeMainContent({ words, currentWordIndex }) {
    return (
        <>
            <main className="flex-grow overflow-y-auto flex flex-col items-start justify-center max-w-7xl mx-auto w-full py-10 px-8">
                <div className="w-full relative">
                    <div className="font-headline-xl text-left leading-relaxed tracking-tight select-none text-4xl md:text-5xl lg:text-6xl flex flex-wrap gap-x-4 gap-y-2">
                        {words.map((word, index) => (
                            <span
                                key={index}
                                className={`transition-all duration-300 ${
                                    index < currentWordIndex
                                        ? "opacity-20 text-on-background" // Spoken: low opacity
                                        : index === currentWordIndex
                                          ? "text-lime-400 opacity-100 scale-110 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]" // Current: Highlighted
                                          : "opacity-60 text-on-background/50" // Future: default
                                }`}
                            >
                                {word}
                            </span>
                        ))}
                    </div>
                </div>
            </main>
        </>
    );
}
