import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import BadgeCard from "@/Components/Student/BadgeCard";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";

export default function GameResults({
    session,
    moduleTitle,
    totalItems,
    badgeProgress,
}) {
    const accuracy = session.accuracy;
    const isPerfect = parseFloat(accuracy) >= 100;
    const { flash } = usePage().props;
    const newBadgeSlug = flash?.new_badge?.slug;

    const hasNewBadge = badgeProgress?.some((b) => newBadgeSlug === b.slug);
    const newBadge = hasNewBadge
        ? badgeProgress?.find((b) => newBadgeSlug === b.slug)
        : null;

    const [step, setStep] = useState(0);



    const activeBadges = badgeProgress?.filter((b) => !b.is_earned) ?? [];

    /* ───────── results view (shared by both scenarios) ───────── */
    const renderResultsView = (badgeHeading) => (
        <div className="bg-background text-on-background font-body-md">
            <div className="relative min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center py-12 px-4">
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />

                <div className="w-full max-w-7xl mx-auto flex flex-col gap-8">
                    {/* Stats */}
                    <div className="text-center">
                        <h1 className="text-6xl md:text-7xl font-black text-secondary-container tracking-tighter drop-shadow-[4px_4px_0px_#3c0090] mb-3 uppercase leading-none">
                            🚀{" "}
                            {isPerfect
                                ? "MISSION PERFECT!"
                                : "MISSION COMPLETE!"}
                        </h1>
                        <p className="text-xl md:text-2xl font-bold text-primary tracking-wide uppercase">
                            {moduleTitle}
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-surface-container p-8 border-4 border-primary-container rounded-[2rem] neo-brutal-shadow-purple">
                            <span className="font-label-bold text-on-surface-variant mb-4 block uppercase tracking-widest italic">
                                🏆 TOTAL SCORE
                            </span>
                            <div className="text-[80px] md:text-[110px] font-black text-white leading-none tracking-tighter inline-block">
                                {session.score}
                                <span className="text-primary-container">
                                    {" "}
                                    / {totalItems}
                                </span>
                            </div>
                        </div>

                        <div className="bg-surface-container p-6 border-4 border-on-tertiary-fixed-variant rounded-[2rem] neo-brutal-shadow-lime flex items-center justify-between gap-6">
                            <div className="shrink-0">
                                <span className="font-label-bold text-on-surface-variant block mb-1 uppercase text-xs italic tracking-widest">
                                    🎯 Accuracy Rate
                                </span>
                                <div className="text-6xl font-black text-[#bcff00] italic drop-shadow-[3px_3px_0px_#1a3300]">
                                    {accuracy}%
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden border-2 border-black">
                                    <div
                                        className="h-full bg-[#bcff00] transition-all duration-1000"
                                        style={{ width: `${accuracy}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 flex items-center gap-2 text-tertiary text-xs font-black uppercase tracking-widest">
                                    <span className="material-symbols-outlined text-sm">
                                        bolt
                                    </span>
                                    FAST REFLEXES!
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Badge Progress */}
                    {activeBadges.length > 0 && (
                        <section className="bg-surface-container p-6 border-4 border-slate-900 rounded-[2.5rem] shadow-[8px_8px_0_0_#0f172a]">
                            <h2 className="font-headline-sm text-primary tracking-wide mb-6 uppercase text-center flex items-center gap-3 justify-center">
                                <span className="material-symbols-outlined text-3xl">
                                    stars
                                </span>
                                ✨ {badgeHeading}
                            </h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {activeBadges.map((badge) =>
                                    <BadgeCard key={badge.slug} badge={badge} compact />,
                                )}
                            </div>
                        </section>
                    )}

                    {/* Action Buttons */}
                    <div className="flex flex-col justify-center items-center sm:flex-row gap-4 w-full">
                        <button
                            onClick={() =>
                                (window.location.href =
                                    window.location.origin +
                                    `/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${session.module_id}`)
                            }
                            className="flex-1 bg-tertiary text-on-tertiary-fixed font-headline-sm py-5 rounded-2xl border-4 border-black neo-brutal-shadow-orange flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-tertiary-fixed"
                        >
                            <span className="material-symbols-outlined">
                                refresh
                            </span>
                            RETRY
                        </button>
                        <Link
                            href="/student/dashboard"
                            className="flex-1 bg-primary text-white font-headline-sm py-5 rounded-2xl border-4 border-black neo-brutal-shadow-purple flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110"
                        >
                            <span className="material-symbols-outlined">
                                map
                            </span>
                            BACK TO MAP
                        </Link>
                        <Link
                            href={
                                session.module_type === "word"
                                    ? "/student/readModeLevels"
                                    : "/student/speakModeLevels"
                            }
                            className="flex-1 bg-primary-container text-white font-headline-sm py-5 rounded-2xl border-4 border-black neo-brutal-shadow-purple flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110"
                        >
                            <span className="material-symbols-outlined">
                                home
                            </span>
                            MENU
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    /* ══════ WALANG BAGONG BADGE ══════ */
    if (!hasNewBadge) {
        return renderResultsView("QUEST PROGRESS");
    }

    /* ══════ MAY BAGONG BADGE ══════ */

    /* Step 0: Celebration */
    if (step === 0) {
        return (
            <div className="bg-background text-on-background font-body-md">
                <BadgeUnlockModal
                    badge={newBadge}
                    show={true}
                    onContinue={() => setStep(1)}
                />
            </div>
        );
    }

    /* Step 1: Results with badge progress */
    return renderResultsView("YOUR NEXT TO ACHIEVE");
}
