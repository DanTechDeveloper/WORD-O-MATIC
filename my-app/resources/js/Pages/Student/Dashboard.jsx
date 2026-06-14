import { Link, usePage } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";

export default function Dashboard({ data }) {
    const readProgress = data?.read_progress;
    const speakProgress = data?.speak_progress;
    const lastLevel = data?.last_active_level;
    console.log(data);

    const { auth } = usePage().props;

    return (
        <>
            <DashboardLayout>
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* <!-- Hero Tile --> */}
                    <section className="lg:col-span-8">
                        <div className="h-full bg-surface-container rounded-3xl p-8 border border-surface-variant/20 shadow-sm flex flex-col md:flex-row items-center justify-between gap-6 overflow-hidden relative">
                            <div className="absolute -right-10 -top-10 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl"></div>
                            <div className="relative z-10 flex-1">
                                <h2 className="text-4xl md:text-5xl font-bold text-primary mb-3 leading-tight">
                                    Ready for Blast Off?
                                </h2>
                                <p className="text-body-md font-body-md text-on-surface-variant mb-5 max-w-sm">
                                    Welcome back, {auth.user.name.split(" ")[0]}
                                    ! Jump back into your last session and reach
                                    for the stars.
                                </p>
                                <Link
                                    href="/student/readModeLevels"
                                    className="inline-flex bg-lime-400 text-slate-950 px-8 py-4 rounded-xl font-bold text-xl hover:bg-lime-300 hover:scale-[1.02] transition-all items-center gap-3 shadow-md"
                                >
                                    Continue: Level {lastLevel || 1}
                                    <span className="material-symbols-outlined text-2xl">
                                        arrow_forward
                                    </span>
                                </Link>
                            </div>
                            <div className="w-full md:w-1/3 aspect-square bg-slate-900/30 rounded-2xl border border-dashed border-primary-container/30 flex items-center justify-center">
                                <img
                                    alt="Space Robot"
                                    className="w-4/5 h-4/5 object-contain"
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV2holqsnD129m3TMxChpoOltZl2WKS74mx-Y9BjOc0KyZ6tm13wDkqMcEu78NUVht77qV72xz4uK45ZzW28r5y17wmQbSmaUUfYNEeRprCZYPgBmrLlbWDK4f6neKQYvSP1nOHZ5m90QnZZ_oukXlIGBgh2IMTuA2Mk8mGZgOH3rAdvrqNndJX0YrYPtJog1RrrFjwbVrOvyO2VFQT4zDzFFTA92-M_AvrtkW-158VJJetx6zUY-hZQdXrHfTXhRmOjZBRTZ-gfMK"
                                />
                            </div>
                        </div>
                    </section>

                    {/* <!-- Quick Modes Tile --> */}
                    <section className="lg:col-span-4 grid grid-cols-1 gap-4">
                        <Link
                            href="/student/readModeLevels"
                            className="group bg-surface-container-high border border-surface-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all text-left flex items-center gap-4"
                        >
                            <div className="bg-secondary-container text-on-secondary-container w-14 h-14 rounded-xl flex items-center justify-center">
                                <span
                                    className="material-symbols-outlined text-3xl"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    menu_book
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-secondary">
                                    Read Mode
                                </h3>
                                <p className="text-xs text-on-surface-variant font-medium">
                                    Explore Galaxies
                                </p>
                            </div>
                        </Link>
                        <Link
                            href="/student/speakModeLevels"
                            className="group bg-surface-container-high border border-surface-variant/20 rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.01] transition-all text-left flex items-center gap-4"
                        >
                            <div className="bg-lime-400 text-slate-950 w-14 h-14 rounded-xl flex items-center justify-center">
                                <span
                                    className="material-symbols-outlined text-3xl font-bold"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    record_voice_over
                                </span>
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-lime-400">
                                    Speak Mode
                                </h3>
                                <p className="text-xs text-on-surface-variant font-medium">
                                    Cosmic Comms
                                </p>
                            </div>
                        </Link>
                    </section>

                    {/* <!-- Mission Progress Tile --> */}
                    <section className="lg:col-span-12 bg-surface-container rounded-3xl border border-surface-variant/20 p-8 shadow-sm">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-xl font-bold text-on-surface flex items-center gap-2">
                                <span className="material-symbols-outlined text-primary-fixed-dim">
                                    insights
                                </span>
                                Mission Progress
                            </h3>
                        </div>
                        <div className="space-y-6">
                            {/* <!-- Progress Item 1 --> */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="text-lg font-semibold">
                                            Read Mode Level {data?.read_level}
                                        </h4>
                                    </div>
                                    <span className="text-lg font-bold text-lime-400">
                                        {readProgress}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full border border-surface-variant/10 relative overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-secondary-container rounded-full transition-all duration-700"
                                        style={{ width: `${readProgress}%` }}
                                    >
                                        <div className="w-full h-full opacity-20 bg-[linear-gradient(45deg,rgba(255,255,255,0.4)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.4)_75%,transparent_75%,transparent)] bg-[length:20px_20px]"></div>
                                    </div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 ml-[-10px] flex items-center justify-center"
                                        style={{ left: `${readProgress}%` }}
                                    >
                                        <span className="material-symbols-outlined text-white text-xl animate-bounce">
                                            rocket
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* <!-- Progress Item 2 --> */}
                            <div>
                                <div className="flex justify-between items-end mb-2">
                                    <div>
                                        <h4 className="text-lg font-semibold">
                                            Speak Mode Level {data?.speak_level}
                                        </h4>
                                    </div>
                                    <span className="text-lg font-bold text-lime-400">
                                        {speakProgress}%
                                    </span>
                                </div>
                                <div className="h-3 w-full bg-slate-900 rounded-full border border-surface-variant/10 relative overflow-hidden">
                                    <div
                                        className="absolute top-0 left-0 h-full bg-primary rounded-full transition-all duration-1000"
                                        style={{ width: `${speakProgress}%` }}
                                    >
                                        <div className="w-full h-full bg-[linear-gradient(45deg,rgba(255,255,255,0.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,0.2)_50%,rgba(255,255,255,0.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[stripes_1s_linear_infinite]"></div>
                                    </div>
                                    <div
                                        className="absolute top-1/2 -translate-y-1/2 ml-[-10px] flex items-center justify-center"
                                        style={{ left: `${speakProgress}%` }}
                                    >
                                        <span className="material-symbols-outlined text-secondary-container text-xl animate-pulse">
                                            smart_toy
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>

                    {/* <!-- Badges Tile --> */}
                    <section className="lg:col-span-12 bg-surface-container rounded-3xl border border-surface-variant/20 p-8 shadow-sm flex flex-col">
                        <h3 className="text-xl font-bold text-on-surface mb-6 flex items-center gap-2">
                            <span className="material-symbols-outlined text-tertiary">
                                workspace_premium
                            </span>
                            Badges
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 flex-grow">
                            <div className="bg-slate-900 rounded-2xl p-4 border border-surface-variant/10 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-1">
                                    <span
                                        className="material-symbols-outlined text-tertiary text-2xl"
                                        style={{
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        auto_stories
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-on-surface">
                                    Word Master
                                </span>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-4 border border-surface-variant/10 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-secondary-container/10 flex items-center justify-center mb-1">
                                    <span
                                        className="material-symbols-outlined text-secondary text-2xl"
                                        style={{
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        history_edu
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-on-surface">
                                    Story Finisher
                                </span>
                            </div>
                            <div className="bg-slate-900 rounded-2xl p-4 border border-surface-variant/10 flex flex-col items-center justify-center text-center hover:bg-slate-800 transition-colors">
                                <div className="w-10 h-10 rounded-full bg-lime-400/5 flex items-center justify-center mb-1">
                                    <span
                                        className="material-symbols-outlined text-lime-400 text-2xl"
                                        style={{
                                            fontVariationSettings: "'FILL' 1",
                                        }}
                                    >
                                        volume_up
                                    </span>
                                </div>
                                <span className="text-xs font-bold text-on-surface">
                                    Clear Speaker
                                </span>
                            </div>
                            <div className="bg-slate-900/40 rounded-2xl p-4 border border-dashed border-surface-variant/20 flex flex-col items-center justify-center text-center opacity-40">
                                <span className="material-symbols-outlined text-2xl">
                                    lock
                                </span>
                                <span className="text-xs font-bold">
                                    Locked
                                </span>
                            </div>
                        </div>
                        <Link
                            href="/student/badges"
                            className="mt-8 w-full md:w-max md:px-12 mx-auto py-3 bg-surface-container-high text-on-surface-variant rounded-xl font-bold text-xs uppercase hover:bg-surface-container-highest transition-all text-center border border-surface-variant/10"
                        >
                            View All Badges
                        </Link>
                    </section>
                </div>
            </DashboardLayout>
        </>
    );
}
