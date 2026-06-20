import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect } from "react";

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

    useEffect(() => {
        if (step === 0 && hasNewBadge) {
            const timer = setTimeout(() => setStep(1), 4000);
            return () => clearTimeout(timer);
        }
    }, [step, hasNewBadge]);

    const activeBadges = badgeProgress?.filter((b) => !b.is_earned) ?? [];

    /* ───────── helper: badge card ───────── */
    const renderBadgeCard = (badge, compact = false) => {
        const progressPercent =
            badge.threshold > 0
                ? Math.min((badge.current_value / badge.threshold) * 100, 100)
                : 0;

        const iconSize = compact ? "w-14 h-14 text-2xl" : "w-20 h-20 text-4xl";
        const textSize = compact ? "text-xs" : "text-sm";
        const headingSize = compact ? "font-headline-xs" : "font-headline-sm";

        return (
            <div
                key={badge.slug}
                className="group relative bg-surface-container-highest p-4 rounded-xl border-4 border-primary-container/40 transition-all duration-200 hover:-translate-y-1"
                style={{ boxShadow: "8px 8px 0px 0px #1a1a2e" }}
            >
                {badge.is_earned && (
                    <div
                        className="absolute -top-3 -right-1 font-black px-2 py-1 rounded-lg border-2 rotate-12 z-10 bg-primary-container text-white border-slate-950 text-[10px] uppercase"
                        style={{ boxShadow: "4px 4px 0px 0px rgba(0,0,0,0.5)" }}
                    >
                        EARNED
                    </div>
                )}
                <div className="flex flex-col items-center text-center space-y-3">
                    <div
                        className={`${iconSize} bg-primary/20 border-4 border-primary-container rounded-full flex items-center justify-center`}
                        style={{ boxShadow: "0px 6px 0px 0px rgba(0,0,0,0.3)" }}
                    >
                        <span className={iconSize}>{badge.icon}</span>
                    </div>
                    <div>
                        <h3
                            className={`${headingSize} text-primary uppercase tracking-tight`}
                        >
                            {badge.name}
                        </h3>
                        <p
                            className={`font-body-sm text-on-surface-variant ${textSize}`}
                        >
                            {badge.description}
                        </p>
                    </div>
                    <div className="w-full">
                        <div className="flex justify-between text-[10px] font-bold text-on-surface-variant mb-1 uppercase">
                            <span>Progress</span>
                            <span className="text-primary">
                                {badge.current_value}/{badge.threshold}
                            </span>
                        </div>
                        <div className="w-full bg-slate-950 h-3 rounded-full border-2 border-primary-container/40 overflow-hidden">
                            <div
                                className="h-full bg-primary transition-all duration-1000"
                                style={{
                                    width: `${progressPercent}%`,
                                    boxShadow:
                                        "inset 0 2px 4px rgba(0,0,0,0.3)",
                                }}
                            ></div>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

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
                                    renderBadgeCard(badge, true),
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
    if (step === 0 && newBadge) {
        return (
            <div className="bg-background text-on-background font-body-md">
                <div className="relative min-h-screen flex flex-col items-center justify-center bg-gradient-to-b from-background via-[#bcff00]/5 to-background overflow-hidden">
                    {/* Background glow */}
                    <div className="absolute inset-0 bg-[#bcff00]/10 blur-[150px] rounded-full animate-pulse" />
                    <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-[#bcff00]/20 blur-[100px] rounded-full animate-ping" />

                    <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
                        {/* Icon */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 bg-[#bcff00]/30 blur-3xl rounded-full scale-150 animate-pulse" />
                            <span className="text-[10rem] leading-none animate-bounce block relative">
                                {newBadge.icon}
                            </span>
                        </div>

                        {/* Pill */}
                        <div
                            className="bg-[#bcff00] text-[#1a3300] font-black px-8 py-3 rounded-xl border-2 border-slate-950 text-lg uppercase tracking-widest mb-6"
                            style={{
                                boxShadow:
                                    "6px 6px 0px 0px rgba(0,0,0,0.5)",
                            }}
                        >
                            🎉 New Badge Unlocked!
                        </div>

                        {/* Name */}
                        <h1 className="text-5xl md:text-7xl font-black text-[#bcff00] uppercase tracking-tight mb-4 drop-shadow-[0_0_30px_rgba(188,255,0,0.5)]">
                            {newBadge.name}
                        </h1>

                        {/* Description */}
                        <p className="font-headline-sm text-on-surface-variant mb-10 max-w-md">
                            {newBadge.description}
                        </p>

                        {/* Progress bar */}
                        <div className="w-full max-w-sm">
                            <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-2 uppercase">
                                <span>Progress</span>
                                <span className="text-[#bcff00]">
                                    {newBadge.current_value}/
                                    {newBadge.threshold}
                                </span>
                            </div>
                            <div className="w-full bg-slate-950 h-5 rounded-full border-2 border-[#bcff00]/40 overflow-hidden">
                                <div
                                    className="h-full bg-[#bcff00] transition-all duration-1000"
                                    style={{
                                        width: `${Math.min((newBadge.current_value / newBadge.threshold) * 100, 100)}%`,
                                        boxShadow:
                                            "inset 0 2px 4px rgba(0,0,0,0.3)",
                                    }}
                                ></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    /* Step 1: Results with badge progress */
    return renderResultsView("YOUR'E NEXT TO ACHIEVE");
}
