import { Link, usePage } from "@inertiajs/react";
import { useState, useEffect, useCallback } from "react";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";

const SLIDES = [
    {
        mode: "read",
        emoji: "📖",
        title: "Word Blast",
        desc: "Smash words and build your vocabulary in this galactic adventure!",
        tag: "Featured Game",
        href: "/student/readModeLevels",
        gradient: "from-purple-700/40 via-purple-900/20 to-slate-950",
        border: "border-purple-500/20",
        iconBg: "from-purple-500/30 to-pink-500/20",
    },
    {
        mode: "speak",
        emoji: "🎤",
        title: "Story Quest",
        desc: "Read aloud and bring stories to life in your own voice!",
        tag: "New Adventure",
        href: "/student/speakModeLevels",
        gradient: "from-lime-600/30 via-lime-900/20 to-slate-950",
        border: "border-lime-500/20",
        iconBg: "from-lime-500/30 to-teal-500/20",
    },
];

export default function Dashboard({totalReadPoints, totalSpeakPoints, earnedReadPoints, earnedSpeakPoints }) {
    const [slide, setSlide] = useState(0);
    const [paused, setPaused] = useState(false);

    const next = useCallback(() => {
        setSlide((s) => (s + 1) % SLIDES.length);
    }, []);

    useEffect(() => {
        if (paused) return;
        const id = setInterval(next, 4000);
        return () => clearInterval(id);
    }, [paused, next]);

    const s = SLIDES[slide];

    return (
        <DashboardLayout>
            <div className="flex flex-col justify-center min-h-[calc(100dvh-168px)] space-y-6">

                    {/* Carousel */}
                    <section
                        className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${s.gradient} border ${s.border} p-6 lg:p-8 transition-all duration-500`}
                        onMouseEnter={() => setPaused(true)}
                        onMouseLeave={() => setPaused(false)}
                        onClick={next}
                    >
                        <div className="absolute top-0 right-0 w-64 h-64 bg-lime-400/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                        <div className="absolute bottom-0 left-0 w-48 h-48 bg-purple-600/10 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2" />

                        <div className="relative z-10 flex flex-col lg:flex-row items-center gap-6">
                            <div className="flex-1 text-center lg:text-left">
                                <span className="inline-block bg-lime-400/20 text-lime-400 text-sm font-black px-4 py-1.5 rounded-full border border-lime-400/30 mb-3 uppercase tracking-wider">
                                    {s.tag}
                                </span>
                                <h2 className="text-4xl lg:text-5xl font-black text-white uppercase tracking-tight mb-2">
                                    {s.title}
                                </h2>
                                <p className="text-on-surface-variant text-base lg:text-lg mb-6 max-w-md">
                                    {s.desc}
                                </p>
                                <Link
                                    href={s.href}
                                    onClick={(e) => e.stopPropagation()}
                                    className="inline-flex items-center gap-2 bg-lime-400 text-slate-950 font-black text-lg px-8 py-4 rounded-xl border-b-2 border-lime-700 hover:border-b-[3px] transition-all shadow-lg shadow-lime-400/20 hover:scale-105 active:scale-95"
                                >
                                    <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                    PLAY NOW
                                </Link>
                            </div>
                            <div className={`w-36 h-36 lg:w-44 lg:h-44 rounded-2xl bg-gradient-to-br ${s.iconBg} border border-white/10 flex items-center justify-center backdrop-blur-sm`}>
                                <span className="text-7xl lg:text-8xl">{s.emoji}</span>
                            </div>
                        </div>

                        {/* Dots */}
                        <div className="relative z-10 flex justify-center gap-2 mt-4">
                            {SLIDES.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={(e) => { e.stopPropagation(); setSlide(i); }}
                                    className={`w-2.5 h-2.5 rounded-full transition-all ${
                                        i === slide ? "bg-lime-400 scale-125" : "bg-white/30"
                                    }`}
                                />
                            ))}
                        </div>
                    </section>

                    {/* Game Modes */}
                    <section>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href="/student/readModeLevels"
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-purple-600/30 to-purple-900/20 border-2 border-purple-500/20 p-6 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/10 rounded-full blur-2xl" />
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-xl bg-purple-500/20 border-2 border-purple-400/30 flex items-center justify-center shrink-0">
                                        <span className="text-4xl">📖</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-black text-white uppercase">Word Blast</h4>
                                        <p className="text-on-surface-variant text-sm font-bold">Explore Galaxies</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 bg-lime-400 text-slate-950 font-black text-base px-5 py-2.5 rounded-xl border-b-2 border-lime-700 group-hover:border-b-[3px] transition-all">
                                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                                PLAY
                                            </span>
                                          
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-on-surface-variant/60 font-bold">Points</span>
                                                <span className="text-lime-400 font-black text-base">{earnedReadPoints || 0}/{totalReadPoints || 0}</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-950/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-purple-500 to-purple-400 rounded-full transition-all duration-700"
                                                    style={{ width: `${totalReadPoints ? (earnedReadPoints || 0) / totalReadPoints * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>

                            <Link
                                href="/student/speakModeLevels"
                                className="group relative overflow-hidden rounded-2xl bg-gradient-to-br from-lime-600/20 to-lime-900/20 border-2 border-lime-500/20 p-6 hover:scale-[1.02] hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className="absolute top-0 right-0 w-32 h-32 bg-lime-500/10 rounded-full blur-2xl" />
                                <div className="relative z-10 flex items-center gap-5">
                                    <div className="w-20 h-20 rounded-xl bg-lime-500/20 border-2 border-lime-400/30 flex items-center justify-center shrink-0">
                                        <span className="text-4xl">🎤</span>
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="text-2xl font-black text-white uppercase">Story Quest</h4>
                                        <p className="text-on-surface-variant text-sm font-bold">Embark on a narrative journey</p>
                                        <div className="mt-3 flex items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 bg-lime-400 text-slate-950 font-black text-base px-5 py-2.5 rounded-xl border-b-2 border-lime-700 group-hover:border-b-[3px] transition-all">
                                                <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                                                PLAY
                                            </span>
                                           
                                        </div>
                                        <div className="mt-3">
                                            <div className="flex items-center justify-between text-sm mb-1">
                                                <span className="text-on-surface-variant/60 font-bold">Points</span>
                                                <span className="text-lime-400 font-black text-base">{earnedSpeakPoints || 0}/{totalSpeakPoints || 0}</span>
                                            </div>
                                            <div className="h-3 w-full bg-slate-950/40 rounded-full overflow-hidden">
                                                <div
                                                    className="h-full bg-gradient-to-r from-lime-400 to-lime-300 rounded-full transition-all duration-700"
                                                    style={{ width: `${totalSpeakPoints ? (earnedSpeakPoints || 0) / totalSpeakPoints * 100 : 0}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>
                    </section>

                </div>
            </DashboardLayout>
    );
}
