import { useEffect } from "react";
import useDeadlineStatus from "@/hooks/Student/useDeadlineStatus";
import { playBadgeUnlockSound, playClickSound, pauseBackgroundMusic, startBackgroundMusic, setBgmSilenced } from "@/utils/sounds";
import ArcadeBackground from "@/Components/Shared/ArcadeBackground";

export default function BadgeUnlockModal({
    badges = [],
    show,
    onContinue,
}) {
    const deadlineClosed = useDeadlineStatus();

    useEffect(() => {
        if (show) {
            setBgmSilenced(true)
            pauseBackgroundMusic()
            return () => {
                setBgmSilenced(false)
                startBackgroundMusic()
            }
        }
    }, [show])

    // ponytail: one fanfare per screen, not per card — deps on the count, so a
    // re-render with a new array identity (same badges) cannot re-fire it.
    useEffect(() => {
        if (show && badges.length) playBadgeUnlockSound()
    }, [show, badges.length])

    if (deadlineClosed || !show || !badges.length) return null;

    // ponytail: one badge keeps the full-size hero (the common case, unchanged);
    // a burst renders every badge at once so the kid taps once, not N times.
    const isBurst = badges.length > 1;
    const badge = badges[0];

    return (
        <div
            className="fixed inset-0 z-[110] flex items-center justify-center bg-background overflow-hidden"
            role="dialog"
            aria-modal="true"
            aria-label={isBurst ? `${badges.length} badges unlocked` : `${badge.name} unlocked`}
        >
            <ArcadeBackground />
            <style>{`
                @keyframes badge-pop {
                    0% { transform: scale(0.4) rotate(-8deg); opacity: 0; }
                    60% { transform: scale(1.15) rotate(3deg); opacity: 1; }
                    100% { transform: scale(1) rotate(0deg); opacity: 1; }
                }
                .badge-pop { animation: badge-pop 0.6s cubic-bezier(0.22, 1, 0.36, 1) both; }
            `}</style>

            {/* ponytail: arcade wash — lime center + quest corner, capped <0.2 per DESIGN.md §6 */}
            <div
                className="absolute inset-0 pointer-events-none"
                style={{
                    background:
                        "radial-gradient(circle at center, rgba(163,230,53,0.18), transparent 62%)",
                }}
            />
            <div
                className="absolute inset-0 pointer-events-none opacity-60"
                style={{
                    background:
                        "radial-gradient(circle at 75% 20%, rgba(56,189,248,0.14), transparent 45%)",
                }}
            />

            {/* ponytail: overflow-y-auto — a catch-up login can award every
                badge at once, and overflow-hidden clipped the list with no way
                to reach the button. */}
            <div className={`relative z-10 flex flex-col items-center text-center px-4 xs:px-5 sm:px-6 mx-auto animate-fade-in max-h-[90vh] overflow-y-auto ${isBurst ? "max-w-[95vw] sm:max-w-5xl" : "max-w-[92vw] sm:max-w-2xl"}`}>
                {isBurst && (
                    <div className="relative z-10 mb-6 sm:mb-8 flex flex-col items-center gap-2">
                        <span className="text-accent font-black text-base sm:text-xl uppercase tracking-[0.12em] flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined text-xl sm:text-2xl" aria-hidden="true">
                                celebration
                            </span>
                            You unlocked {badges.length} new badges!
                        </span>
                    </div>
                )}

                {isBurst ? (
                    // ponytail: every badge on one screen, one tap to exit. No
                    // progress bar (all are at 100%) and no BadgeCard reuse —
                    // the Dashboard flash payload carries no current_value/threshold.
                    <div className="w-full grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
                        {badges.map((b, i) => (
                            <div
                                key={b.slug ?? i}
                                className="bg-surface-container-high border-2 border-accent/40 rounded-xl p-3 sm:p-4 flex flex-col items-center text-center shadow-[4px_4px_0_0_#4c1d95]"
                            >
                                <span
                                    className="material-symbols-outlined text-accent text-4xl sm:text-5xl leading-none block relative badge-pop mb-2"
                                    style={{ animationDelay: `${i * 90}ms` }}
                                    aria-hidden="true"
                                >
                                    {b.icon}
                                </span>
                                <h2 className="font-black text-accent uppercase text-base sm:text-xl tracking-tight break-words mb-1">
                                    {b.name}
                                </h2>
                                <p className="font-body-sm text-on-surface-variant text-xs sm:text-sm">
                                    {b.description}
                                </p>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {/* ponytail: no orb behind the hero icon. It was a
                            third radial on a screen that already has the lime
                            wash below (0.18, centered, unconditional) — 0.35 on
                            top of it, same hue same spot. DESIGN.md §6 #22 bans
                            radial orbs anyway, and this one was the heaviest.
                            The wash still halos the icon; the name's
                            drop-shadow and the lime banner carry the emphasis
                            without a fifth device for a single badge. */}
                        <span
                            className="material-symbols-outlined text-accent text-[6rem] xs:text-[8rem] sm:text-[10rem] leading-none block relative badge-pop mb-6 sm:mb-8"
                            aria-hidden="true"
                        >
                            {badge.icon}
                        </span>

                        <div
                            className="bg-accent text-surface-container-lowest font-black px-6 sm:px-8 py-2 sm:py-3 rounded-xl border-2 border-surface-container-lowest text-base sm:text-lg uppercase tracking-[0.12em] mb-4 sm:mb-6 shadow-[4px_4px_0_0_#4c1d95] sm:shadow-[6px_6px_0_0_#4c1d95]"
                        >
                            New Badge Unlocked!
                        </div>

                        <h1 className="text-3xl xs:text-4xl sm:text-5xl md:text-7xl font-black text-accent uppercase tracking-tight mb-3 sm:mb-4 drop-shadow-[0_0_30px_rgba(163,230,53,0.5)] break-words px-2">
                            {badge.name}
                        </h1>

                        <p className="font-body-md text-on-surface-variant mb-10 max-w-md">
                            {badge.description}
                        </p>

                        {badge.current_value != null && badge.threshold != null && (
                            <div className="w-full max-w-sm">
                                <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-2 uppercase">
                                    <span>Progress</span>
                                    <span className="text-accent">
                                        {badge.current_value}/{badge.threshold}
                                    </span>
                                </div>
                                <div className="w-full bg-surface-container h-5 rounded-full border-2 border-accent/40 overflow-hidden">
                                    <div
                                        className="h-full bg-accent transition-all duration-1000 ease-out"
                                        style={{
                                            width: `${Math.min((badge.current_value / badge.threshold) * 100, 100)}%`,
                                            boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        )}
                    </>
                )}

                {/* ponytail: sticky footer. The scroll container above is
                    overflow-y-auto because a 6-badge burst overflows a 667px
                    phone — but that pushes TAP TO CONTINUE below the fold, and
                    the kid has to discover there IS a scroll. Sticky pins it to
                    the bottom of the viewport at any depth, so the one tap that
                    exits the celebration is always visible.

                    The opaque backdrop is BURST-ONLY. Sticky floats the button
                    over content, so without it the badge grid would show
                    through while scrolling. The solo hero fits inside 90vh
                    (~416px of content) and never scrolls, so a fade there just
                    dims the empty space under the button for nothing.
                    `mt-10` stays (breathing room above the grid), `pt-6` makes
                    the fade do the separating instead of raw padding. */}
                <div className={`sticky bottom-0 w-full mt-10 pt-6 pb-1 ${isBurst ? "bg-gradient-to-t from-background via-background to-transparent" : ""}`}>
                    <button
                        type="button"
                        onClick={() => { playClickSound(); onContinue() }}
                        autoFocus
                        className="shrink-0 tactile-button mx-auto flex items-center justify-center bg-accent text-surface-container-lowest font-black px-10 py-4 rounded-xl border-2 border-surface-container-lowest text-xl uppercase tracking-[0.12em] transition-[transform,background-color] hover:bg-accent-hover"
                    >
                        TAP TO CONTINUE
                    </button>
                </div>
            </div>
        </div>
    );
}
