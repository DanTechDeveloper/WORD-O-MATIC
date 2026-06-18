import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

export default function GameResults({ session, moduleTitle, totalItems }) {
    const accuracy = session.accuracy;
    const isPerfect = parseFloat(accuracy) >= 100;

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto py-12 px-6">
                {/* Header Section */}
                <div className="text-center mb-16 relative">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-primary/20 blur-[100px] rounded-full -z-10 animate-pulse" />
                    <h1 className="font-headline-xl text-[56px] text-white uppercase tracking-tighter mb-2 drop-shadow-[0_4px_0_rgba(114,18,255,1)]">
                        {isPerfect ? "MISSION PERFECT!" : "MISSION COMPLETE!"}
                    </h1>
                    <p className="text-primary font-black uppercase tracking-[0.2em] text-sm">
                        Session Report: {moduleTitle}
                    </p>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    {/* Words Smashed Card */}
                    <div className="bg-surface-container border-4 border-slate-900 rounded-[2.5rem] p-8 text-center shadow-[8px_8px_0_0_#0f172a]">
                        <span className="material-symbols-outlined text-lime-400 text-5xl mb-4">
                            bolt
                        </span>
                        <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">
                            Items Smashed
                        </h3>
                        <div className="text-5xl font-black text-white">
                            {session.score}
                            <span className="text-slate-600 text-2xl font-bold ml-1">
                                /{totalItems}
                            </span>
                        </div>
                    </div>

                    {/* Accuracy Card */}
                    <div className="bg-surface-container border-4 border-slate-900 rounded-[2.5rem] p-8 text-center shadow-[8px_8px_0_0_#0f172a]">
                        <span className="material-symbols-outlined text-fuchsia-400 text-5xl mb-4">
                            target
                        </span>
                        <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">
                            Accuracy Rate
                        </h3>
                        <div className="text-5xl font-black text-white">
                            {accuracy}%
                        </div>
                    </div>

                    {/* Streak Card */}
                    <div className="bg-surface-container border-4 border-slate-900 rounded-[2.5rem] p-8 text-center shadow-[8px_8px_0_0_#0f172a]">
                        <span className="material-symbols-outlined text-orange-400 text-5xl mb-4">
                            local_fire_department
                        </span>
                        <h3 className="text-slate-400 font-bold uppercase text-xs tracking-widest mb-1">
                            Highest Streak
                        </h3>
                        <div className="text-5xl font-black text-white">
                            {session.streak}
                        </div>
                    </div>
                </div>

                {/* Progress Bar Visualizer */}
                <div className="bg-slate-950 border-4 border-slate-900 p-8 rounded-[2rem] mb-12">
                    <div className="flex justify-between items-center mb-4">
                        <span className="text-white font-black uppercase tracking-tight">
                            Galactic Mastery
                        </span>
                        <span className="text-primary font-black">
                            {accuracy}%
                        </span>
                    </div>
                    <div className="w-full bg-slate-900 h-8 rounded-2xl border-2 border-slate-800 p-1 overflow-hidden">
                        <div
                            className="h-full bg-gradient-to-r from-primary to-fuchsia-500 rounded-xl transition-all duration-1000 ease-out shadow-[0_0_20px_rgba(114,18,255,0.5)]"
                            style={{ width: `${accuracy}%` }}
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-4">
                    <Link
                        href={
                            session.module_type === "word"
                                ? "/student/readModeLevels"
                                : "/student/speakModeLevels"
                        }
                        className="flex-1 bg-white text-slate-950 text-xl font-black py-6 rounded-3xl uppercase text-center hover:scale-[1.02] active:scale-[0.98] transition-all shadow-[0_6px_0_0_#cbd5e1]"
                    >
                        Continue Journey
                    </Link>
                    <button
                        onClick={() =>
                            (window.location.href =
                                window.location.origin +
                                `/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${session.module_id}`)
                        }
                        className="flex-1 bg-slate-900 text-white border-4 border-slate-800 text-xl font-black py-6 rounded-3xl uppercase text-center hover:bg-slate-800 transition-all shadow-[0_6px_0_0_#0f172a]"
                    >
                        Retry Mission
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
