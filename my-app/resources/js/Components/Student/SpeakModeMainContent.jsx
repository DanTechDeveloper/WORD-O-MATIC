export default function SpeakModeMainContent({ storySegments }) {
    return (
        <>
            <main className="flex-grow overflow-y-auto flex flex-col items-start justify-center max-w-7xl mx-auto w-full py-10 px-8">
                <div className="w-full relative">
                    <div className="font-headline-xl text-left leading-tight tracking-tight select-none text-4xl md:text-5xl lg:text-6xl">
                        {storySegments.map((segment, index) => (
                            <span key={index} className={segment.className}>
                                {segment.text}
                            </span>
                        ))}
                        <span className="blinking-cursor"></span>
                    </div>
                </div>
            </main>
        </>
    );
}
