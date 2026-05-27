import { Link } from "@inertiajs/react";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";

export default function ReadModeLevels() {
    return (
        <DashboardLayout>
            <main className="max-w-5xl mx-auto py-12">
                {/* <!-- Main Container --> */}
                <div className="bg-surface-container rounded-3xl p-8 md:p-12 border-4 border-surface-variant neo-3d-shadow relative overflow-hidden">
                    {/* <!-- Level Progress Section --> */}
                    <section className="mb-16">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-on-surface text-4xl md:text-5xl font-black tracking-tight mb-2 uppercase italic">
                                    Level 4: Word Warrior ⚔️
                                </h2>
                                <p className="text-on-surface-variant text-lg font-bold">
                                    You're 65% of the way to becoming a
                                    Syntax Commander!
                                </p>
                            </div>
                            <div className="bg-lime-400 text-slate-950 px-6 py-3 rounded-xl font-black text-2xl border-b-4 border-lime-700">
                                1,250 XP
                            </div>
                        </div>
                        <div className="h-10 w-full bg-slate-950 rounded-full border-4 border-surface-variant relative overflow-hidden">
                            <div
                                className="absolute top-0 left-0 h-full bg-secondary-container rounded-full transition-all duration-1000"
                                style={{ width: "65%" }}
                            >
                                <div className="absolute inset-0 bg-white/10 animate-pulse"></div>
                            </div>
                            {/* <!-- Progress Rocket --> */}
                            <div
                                className="absolute top-1/2 -translate-y-1/2 ml-[-20px] transition-all duration-1000"
                                style={{ left: '65%' }}
                            >
                                <span className="material-symbols-outlined text-lime-400 text-4xl animate-pulse">
                                    rocket
                                </span>
                            </div>
                        </div>
                    </section>

                    {/* <!-- Mission Map Title --> */}
                    <div className="text-center mb-12">
                        <h3 className="text-on-surface text-3xl font-black inline-block relative uppercase italic">
                            MISSION MAP: THE LINGUISTIC GALAXY 🚀
                            <span className="absolute -bottom-2 left-0 w-full h-2 bg-lime-400 rounded-full"></span>
                        </h3>
                    </div>

                    {/* <!-- Mission Grid --> */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-gutter relative">
                        {/* <!-- Mission 1: Completed --> */}
                        <div className="group cursor-pointer">
                            <div className="bg-slate-900 rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-lime-400 shadow-[6px_6px_0px_0px_#1a2e05] transition-all active:translate-y-1 active:shadow-none">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-lime-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        check_circle
                                    </span>
                                    <span className="bg-lime-400 text-slate-950 text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 01
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white text-xl font-black leading-tight uppercase">
                                        Glitchy Greeting
                                    </h4>
                                    <p className="text-lime-400 text-sm font-bold uppercase">
                                        Status: Mastered!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Mission 2: Completed --> */}
                        <div className="group cursor-pointer">
                            <div className="bg-slate-900 rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-lime-400 shadow-[6px_6px_0px_0px_#1a2e05] transition-all active:translate-y-1 active:shadow-none">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-lime-400 text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        check_circle
                                    </span>
                                    <span className="bg-lime-400 text-slate-950 text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 02
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white text-xl font-black leading-tight uppercase">
                                        Syntax Space-Out
                                    </h4>
                                    <p className="text-lime-400 text-sm font-bold uppercase">
                                        Status: Mastered!
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Mission 3: Current (Highlighted) --> */}
                        <div className="group cursor-pointer relative">
                            <div className="absolute -top-4 -right-2 z-10 bg-lime-400 text-slate-950 font-black px-4 py-1 rounded-lg border-2 border-slate-950 rotate-12 shadow-[4px_4px_0px_0px_#1a2e05] text-sm">
                                CURRENT!
                            </div>
                            <div className="bg-secondary-container rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-slate-950 shadow-[6px_6px_0px_0px_#55003d] transition-all hover:-translate-y-1 active:translate-y-1 active:shadow-none">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-white text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                        rocket_launch
                                    </span>
                                    <span className="bg-white/20 text-white text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 03
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-white text-2xl font-black leading-tight uppercase">
                                        Robot Rhetoric
                                    </h4>
                                    <p className="text-white/90 text-sm font-bold uppercase">
                                        Ready to Launch 🚀
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Mission 4: Locked --> */}
                        <div className="group opacity-50">
                            <div className="bg-slate-950 rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-dashed border-surface-variant">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                                        lock
                                    </span>
                                    <span className="bg-surface-variant text-on-surface-variant text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 04
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-on-surface-variant text-xl font-black leading-tight uppercase">
                                        Logic Labyrinth
                                    </h4>
                                    <p className="text-on-surface-variant text-sm font-bold uppercase">
                                        Locked: Level 5
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Mission 5: Locked --> */}
                        <div className="group opacity-50">
                            <div className="bg-slate-950 rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-dashed border-surface-variant">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                                        lock
                                    </span>
                                    <span className="bg-surface-variant text-on-surface-variant text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 05
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-on-surface-variant text-xl font-black leading-tight uppercase">
                                        Mastering Matic
                                    </h4>
                                    <p className="text-on-surface-variant text-sm font-bold uppercase">
                                        Locked: Level 7
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* <!-- Mission 6: Locked --> */}
                        <div className="group opacity-50">
                            <div className="bg-slate-950 rounded-2xl p-6 h-48 flex flex-col justify-between border-4 border-dashed border-surface-variant">
                                <div className="flex justify-between items-start">
                                    <span className="material-symbols-outlined text-on-surface-variant text-4xl">
                                        lock
                                    </span>
                                    <span className="bg-surface-variant text-on-surface-variant text-xs font-black px-2 py-1 rounded uppercase">
                                        MISSION 06
                                    </span>
                                </div>
                                <div>
                                    <h4 className="text-on-surface-variant text-xl font-black leading-tight uppercase">
                                        Galactic Grammar
                                    </h4>
                                    <p className="text-on-surface-variant text-sm font-bold uppercase">
                                        Locked: Boss Battle
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* <!-- Footer Action Button --> */}
                    <div className="mt-16 flex justify-center">
                        <button className="bg-lime-400 text-slate-950 text-2xl font-black px-12 py-5 rounded-2xl border-b-[8px] border-lime-700 active:translate-y-1 active:border-b-4 transition-all uppercase flex items-center gap-3">
                            <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                                play_circle
                            </span>
                            Continue Adventure
                        </button>
                    </div>
                </div>

                {/* <!-- Back Button Section --> */}
                <div className="mt-12 flex justify-center">
                    <Link href="/dashboard" className="bg-surface-container-high border-4 border-surface-variant px-8 py-4 rounded-xl text-on-surface font-bold flex items-center gap-2 hover:bg-surface-variant active-3d transition-all uppercase">
                        <span className="material-symbols-outlined">arrow_back</span>
                        Back to Home
                    </Link>
                </div>
            </main>
        </DashboardLayout>
    );
}
