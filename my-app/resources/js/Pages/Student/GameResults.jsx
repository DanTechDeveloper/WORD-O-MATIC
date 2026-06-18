import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

export default function GameResults({ session, moduleTitle, totalItems }) {
    const accuracy = session.accuracy;
    const isPerfect = parseFloat(accuracy) >= 100;

    const hasStreakBadge = session.streak >= 5;
    const hasClearSpeakerBadge = parseFloat(accuracy) >= 100;

    return (
        <DashboardLayout minimal={true}>
            <div className="relative min-h-[calc(100vh-6rem)] flex flex-col items-center justify-center py-12">
                {/* Background Glow */}
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center w-full">
                    {/* Left Side: Success Header & Primary Stats */}
                    <div className="flex flex-col space-y-8">
                        <div className="text-left">
                            <h1 className="font-headline-xl text-secondary-container tracking-tighter drop-shadow-[4px_4px_0px_#3c0090] mb-2 uppercase leading-tight">
                                🚀{" "}
                                {isPerfect
                                    ? "MISSION PERFECT!"
                                    : "MISSION COMPLETE!"}
                            </h1>
                            <p className="font-headline-sm text-primary tracking-wide uppercase">
                                {moduleTitle}
                            </p>
                        </div>

                        <div className="grid grid-cols-1 gap-6">
                            {/* Score Card - Single Large Line */}
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
                                <div className="mt-4 bg-primary-container/20 border-2 border-primary-container inline-block px-4 py-1 rounded-full font-label-bold text-white uppercase text-xs">
                                    {isPerfect
                                        ? "Mastery Achieved!"
                                        : "Linguistic Legend In Training"}
                                </div>
                            </div>

                            {/* Accuracy Card - Horizontal Layout */}
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
                    </div>

                    {/* Right Side: Quest Progress */}
                    <div className="flex flex-col">
                        <section className="bg-surface-container p-8 border-4 border-slate-900 rounded-[2.5rem] shadow-[8px_8px_0_0_#0f172a]">
                            <h2 className="font-headline-sm text-primary tracking-wide mb-8 uppercase text-center lg:text-left flex items-center gap-3 justify-center lg:justify-start">
                                <span className="material-symbols-outlined text-3xl">
                                    stars
                                </span>
                                ✨ COSMIC QUESTS
                            </h2>
                            <div className="flex flex-col gap-5">
                                {hasStreakBadge || hasClearSpeakerBadge ? (
                                    <>
                                        {/* Quest 1: Streak Badge */}
                                        {hasStreakBadge && (
                                            <div
                                                className="group relative bg-surface-container-highest p-5 rounded-xl border-4 border-primary-container/40 transition-all duration-200 hover:-translate-y-1"
                                                style={{
                                                    boxShadow:
                                                        "8px 8px 0px 0px #1a1a2e",
                                                }}
                                            >
                                                <div
                                                    className="absolute -top-4 -right-1 font-black px-3 py-1.5 rounded-lg border-2 rotate-12 z-10 bg-primary-container text-white border-slate-950 text-[11px] uppercase"
                                                    style={{
                                                        boxShadow:
                                                            "4px 4px 0px 0px rgba(0,0,0,0.5)",
                                                    }}
                                                >
                                                    UNLOCKED
                                                </div>
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <div
                                                        className="w-20 h-20 bg-primary/20 border-4 border-primary-container rounded-full flex items-center justify-center text-4xl"
                                                        style={{
                                                            boxShadow:
                                                                "0px 6px 0px 0px rgba(0,0,0,0.3)",
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-primary text-4xl">
                                                            local_fire_department
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-headline-sm text-primary uppercase tracking-tight">
                                                            On Fire Streak
                                                        </h3>
                                                        <p className="font-body-sm text-on-surface-variant text-sm">
                                                            5 correct words in a
                                                            row
                                                        </p>
                                                    </div>
                                                    <div className="w-full">
                                                        <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase">
                                                            <span>
                                                                Progress
                                                            </span>
                                                            <span className="text-primary">
                                                                {session.streak}
                                                                /5
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-950 h-4 rounded-full border-2 border-primary-container/40 overflow-hidden">
                                                            <div
                                                                className="h-full bg-primary transition-all duration-1000"
                                                                style={{
                                                                    width: `${Math.min((session.streak / 5) * 100, 100)}%`,
                                                                    boxShadow:
                                                                        "inset 0 2px 4px rgba(0,0,0,0.3)",
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Quest 2: Clear Speaker Badge */}
                                        {hasClearSpeakerBadge && (
                                            <div
                                                className="group relative bg-surface-container-highest p-5 rounded-xl border-4 border-on-tertiary-fixed-variant/40 transition-all duration-200 hover:-translate-y-1"
                                                style={{
                                                    boxShadow:
                                                        "8px 8px 0px 0px #1a1a2e",
                                                }}
                                            >
                                                <div
                                                    className="absolute -top-4 -right-1 font-black px-3 py-1.5 rounded-lg border-2 rotate-12 z-10 bg-[#bcff00] text-[#1a3300] border-slate-950 text-[11px] uppercase"
                                                    style={{
                                                        boxShadow:
                                                            "4px 4px 0px 0px rgba(0,0,0,0.5)",
                                                    }}
                                                >
                                                    MASTERY
                                                </div>
                                                <div className="flex flex-col items-center text-center space-y-4">
                                                    <div
                                                        className="w-20 h-20 bg-[#bcff00]/10 border-4 border-[#bcff00]/40 rounded-full flex items-center justify-center text-4xl"
                                                        style={{
                                                            boxShadow:
                                                                "0px 6px 0px 0px rgba(0,0,0,0.3)",
                                                        }}
                                                    >
                                                        <span className="material-symbols-outlined text-[#bcff00] text-4xl">
                                                            record_voice_over
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <h3 className="font-headline-sm text-[#bcff00] uppercase tracking-tight">
                                                            Clear Speaker
                                                        </h3>
                                                        <p className="font-body-sm text-on-surface-variant text-sm">
                                                            Speak with clarity &
                                                            precision
                                                        </p>
                                                    </div>
                                                    <div className="w-full">
                                                        <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase">
                                                            <span>
                                                                Progress
                                                            </span>
                                                            <span className="text-[#bcff00]">
                                                                {accuracy}%
                                                            </span>
                                                        </div>
                                                        <div className="w-full bg-slate-950 h-4 rounded-full border-2 border-on-tertiary-fixed-variant/40 overflow-hidden">
                                                            <div
                                                                className="h-full bg-[#bcff00] transition-all duration-1000"
                                                                style={{
                                                                    width: `${accuracy}%`,
                                                                    boxShadow:
                                                                        "inset 0 2px 4px rgba(0,0,0,0.3)",
                                                                }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                ) : (
                                    <div className="bg-surface-container-highest p-5 rounded-xl border-4 border-slate-700 text-center flex flex-col items-center justify-center min-h-[150px]">
                                        <p className="font-headline-sm text-on-surface-variant">
                                            Nice try! No new badges unlocked
                                            this match. Keep practicing!
                                        </p>
                                        <span className="material-symbols-outlined text-4xl text-on-surface-variant mt-4">
                                            sports_gymnastics
                                        </span>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col justify-center items-center sm:flex-row gap-4 mt-12 max-w-3xl mx-auto w-full">
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
                        <span className="material-symbols-outlined">map</span>
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
                        <span className="material-symbols-outlined">home</span>
                        MENU
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
