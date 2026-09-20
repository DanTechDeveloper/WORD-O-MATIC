import { memo, useRef, useEffect } from "react";

// Story Quest sentence view: karaoke-style live highlight (BLUE current +
// quest glow following interim speech) with GREEN/RED verdicts locking on
// authoritative results. Fresh mount starts neutral with a start-here pulse
// (no static border until speech begins); resume mounts show restored
// verdicts + a you-are-here marker. Sentence-final punctuation renders dim
// outside the chip (display-only; matching is normalized). Sentence level =
// ONE feedback overlay per completed sentence. No streak, no per-word popups.
function renderWordText(word) {
    const m = String(word ?? "").match(/^(.*?)([.!?]+)$/);
    if (!m) return word;
    return (
        <>
            <span>{m[1]}</span>
            <span className="opacity-50">{m[2]}</span>
        </>
    );
}
const SpeakModeMainContent = memo(function SpeakModeMainContent({
    words,
    currentIndex,
    verdicts = {},
    sentenceFeedback = null,
    sentenceBreak = false,
    highlightCount = 1,
    gameState,
    countdownValue,
    isResume = false,
    hasSpoken = false,
    breakJustEnded = false,
    previewWords = null,
}) {
    const activeWordRef = useRef(null);
    const activeCount = Math.max(1, highlightCount | 0 || 1);

    useEffect(() => {
        activeWordRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "center",
        });
    }, [currentIndex]);

    return (
        <main className="flex-1 flex relative overflow-hidden">
            {gameState === "IDLE" ? (
                previewWords?.length ? (
                    // ponytail: tutorial tour shows the sentence statically — the
                    // IDLE stage is otherwise empty, so READ THE SENTENCE would
                    // point at nothing. Neutral styling; karaoke takes over live.
                    <div className="flex-1 flex items-start justify-center overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-8 pt-12 sm:pt-15 pb-12 sm:pb-16">
                        <div className="relative w-full max-w-7xl my-auto">
                            <div className="font-headline-xl text-left leading-relaxed tracking-normal sm:tracking-tight select-none font-medium sm:font-semibold lg:font-bold text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl flex flex-wrap gap-x-2 xs:gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-6 md:gap-y-8">
                                {previewWords.map((word, index) => (
                                    <span key={index} className="whitespace-nowrap opacity-60 text-on-background/50">
                                        {renderWordText(word)}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex-1 flex" />
                )
            ) : gameState === "COUNTDOWN" ? (
                <div className="absolute inset-0 flex items-center justify-center px-4">
                    <span className="text-5xl xs:text-6xl sm:text-8xl md:text-[10rem] lg:text-[12rem] font-extrabold text-quest italic animate-bounce drop-shadow-[0_0_24px_rgba(56,189,248,0.5)] text-center">
                        {countdownValue}
                    </span>
                </div>
            ) : (
                <div className="flex-1 flex flex-col relative">
                    <div className="flex-1 flex items-start justify-center overflow-y-auto px-3 xs:px-4 sm:px-6 md:px-8 pt-12 sm:pt-15 pb-12 sm:pb-16">
                        <div className="relative w-full max-w-7xl my-auto">
                            <div className="sticky top-2 z-30 flex items-center justify-center gap-2 sm:gap-4 mb-2 sm:mb-3 min-h-8 sm:min-h-10" />

                            <div
                                className={`font-headline-xl text-left leading-relaxed tracking-normal sm:tracking-tight select-none font-medium sm:font-semibold lg:font-bold text-3xl xs:text-4xl sm:text-5xl md:text-6xl lg:text-7xl flex flex-wrap gap-x-2 xs:gap-x-3 sm:gap-x-4 gap-y-4 sm:gap-y-6 md:gap-y-8`}
                            >
                                {words.map((word, index) => {
                                    const verdict = verdicts[index];
                                    // ponytail: branch order is the contract — verdicts always
                                    // win; fresh mount stays neutral until speech (resume
                                    // keeps its you-are-here marker, it is mid-round).
                                    // ponytail: no BLUE during modal — next sentence's 1st word highlights only after modal off (breakJustEnded handles it).
                                    const showFrontier = !sentenceBreak && (hasSpoken || isResume);
                                    return (
                                        <span
                                            key={index}
                                            ref={
                                                index === currentIndex
                                                    ? activeWordRef
                                                    : undefined
                                            }
                                            className={`transition-all duration-300 whitespace-nowrap relative ${
                                                verdict === "correct"
                                                    ? "font-bold sm:font-extrabold text-accent opacity-100 relative z-10 border-2 border-accent/80 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_10px_rgba(163,230,53,0.5)]"
                                                    : verdict === "wrong"
                                                      ? "font-bold sm:font-extrabold text-rose-400 opacity-100 relative z-10 border-2 border-rose-500 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                                                      : index === currentIndex && breakJustEnded
                                                        ? "font-bold text-quest animate-pulse opacity-80"
                                                        : index === currentIndex && showFrontier
                                                        ? "font-bold sm:font-extrabold text-quest opacity-100 relative z-10 border-2 border-quest/80 rounded-xl px-3 py-2 bg-slate-900/80 drop-shadow-[0_0_10px_rgba(56,189,248,0.5)]"
                                                        : index > currentIndex && index < currentIndex + activeCount && showFrontier
                                                          ? "font-bold text-quest opacity-100 border-2 border-quest/40 rounded-xl px-2 py-1 bg-slate-900/60"
                                                          : index === currentIndex && !isResume && !sentenceBreak
                                                            ? "font-bold text-quest animate-pulse opacity-80"
                                                            : index < currentIndex
                                                              ? "opacity-20 text-on-background"
                                                              : "opacity-60 text-on-background/50"
                                            }`}
                                        >
                                            {renderWordText(word)}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>

                        {sentenceBreak && sentenceFeedback && (() => {
                            const pct = sentenceFeedback.total ? (sentenceFeedback.score / sentenceFeedback.total) * 100 : 0;
                            const filled = Math.round((pct / 100) * 5);
                            const missed = Math.max(0, sentenceFeedback.total - sentenceFeedback.score);
                            return (
                            <div className="absolute inset-0 z-40 flex items-center justify-center px-4 pointer-events-none">
                                <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" aria-hidden="true" />
                                <div className="relative text-center bg-slate-900/90 border-2 border-quest/60 rounded-3xl px-6 sm:px-10 py-6 sm:py-8 shadow-[0_0_30px_rgba(56,189,248,0.4)] min-w-[280px] sm:min-w-[360px]">
                                    <div className="font-black uppercase italic tracking-tighter text-white text-2xl sm:text-4xl">
                                        {sentenceFeedback.message}
                                    </div>
                                    <div className="mt-3 flex items-center justify-center gap-1">
                                        {[...Array(5)].map((_, i) => (
                                            <span key={i} className={`material-symbols-outlined text-xl sm:text-2xl ${i < filled ? "text-amber-400" : "text-white/20"}`} style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                                        ))}
                                    </div>
                                    <div className="mt-3 font-black tracking-tighter text-white text-4xl sm:text-5xl">
                                        <span className="text-quest">{sentenceFeedback.score}</span><span className="text-white/30 mx-2">/</span><span>{sentenceFeedback.total}</span>
                                    </div>
                                    <div className="mt-4 h-2 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-quest transition-all duration-700" style={{ width: `${pct}%` }} />
                                    </div>
                                    {missed > 0 ? (
                                        <div className="mt-3 inline-flex items-center gap-2 bg-rose-500/15 border border-rose-500/30 rounded-full px-3 py-1 text-rose-300 text-xs sm:text-sm font-bold">
                                            <span className="material-symbols-outlined text-sm">error</span>
                                            {missed} tricky word{missed === 1 ? "" : "s"}
                                        </div>
                                    ) : (
                                        <div className="mt-3 inline-flex items-center gap-1.5 bg-accent/15 border border-accent/30 rounded-full px-3 py-1 text-accent text-xs sm:text-sm font-bold">
                                            <span className="material-symbols-outlined text-sm">verified</span>
                                            Perfect!
                                        </div>
                                    )}
                                    {sentenceFeedback.note && (
                                        <div className="mt-2 text-white/60 text-[11px] sm:text-xs font-bold leading-snug max-w-[32ch] mx-auto">
                                            {sentenceFeedback.note}
                                        </div>
                                    )}
                                </div>
                            </div>
                            );
                        })()}
                    </div>
                </div>
            )}
        </main>
    );
});

export default SpeakModeMainContent;
