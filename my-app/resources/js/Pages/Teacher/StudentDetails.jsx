import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";

export default function StudentDetail({ data }) {
    const [activeMode, setActiveMode] = useState("read");

    console.log(data);
    const student = {
        id: data.student_id,
        section: data.student?.section,
        name: data.name,
        avatar:
            data.student?.avatar ||
            "https://lh3.googleusercontent.com/aida-public/AB6AXuAgZOj0Csd-wTVehC2hKqya5LsWjibMtl2k7u0rwLw07NOodqBRyJcyz6B0y62wGMLC79R0wuZ-SV8Kr8YSHaqJwAVOBZDyviTPvbCDrAHaipLpSQOokfSwI9XsnNao1SCIhxKx3Mi5ETvcIpX9Ntt2OHt60MHNrAUovC6X0ncME1-6gTNBMsN5aKev3-NmGumU2wxIwgHHHUa723xho1Hohi3sOwLMcl2mY38bLFL8aQtMTcrcVRJ6MKFkfdO7JnGX-IZqR9qpKr6F",
        stats: [
            {
                label: "Word Smashed",
                value: data.student?.words_smashed?.toLocaleString() || "0",
                icon: "reorder",
                color: "text-lime-400",
            },
            {
                label: "Word Blast Acc",
                value: data.student?.wordBlastAcc
                    ? `${data.student.wordBlastAcc}%`
                    : "N/A",
                icon: "auto_stories",
                color: "text-purple-400",
            },
            {
                label: "Story Quest Acc",
                value: data.student?.storyQuestAcc
                    ? `${data.student.storyQuestAcc}%`
                    : "N/A",
                icon: "record_voice_over",
                color: "text-cyan-400",
            },
        ],
        modes: [
            {
                name: "Read Mode",
                level: `Lvl ${data.student?.read_level || 1}`,
                sub: "Speed Scholar",
                progress: data.student?.read_progress || 0,
                color: "bg-lime-400",
            },
            {
                name: "Speak Mode",
                level: `Lvl ${data.student?.speak_level || 1}`,
                sub: "Vocal Voyager",
                progress: data.student?.speak_progress || 0,
                color: "bg-cyan-400",
            },
        ],
        readCurriculum: data.readCurriculum || [],
        speakCurriculum: data.speakCurriculum || [],
    };

    return (
        <DashboardLayout>
            {/* Back Button & Header */}
            <div className="mb-10">
                <Link
                    href="/teacher/students"
                    className="text-slate-500 hover:text-lime-400 font-black uppercase text-xs tracking-widest flex items-center gap-2 transition-colors mb-4"
                >
                    <span className="material-symbols-outlined text-sm">
                        arrow_back
                    </span>
                    Back to Fleet Command
                </Link>

                {/* User Profile & General Statistics */}
                <div className="flex flex-col lg:flex-row gap-8 items-start">
                    {/* Profile Card */}
                    <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-8 flex items-center gap-6 shadow-[8px_8px_0_0_#020617] w-full lg:w-auto">
                        <div className="w-24 h-24 rounded-2xl bg-slate-950 border-4 border-lime-400 overflow-hidden rotate-3 shadow-[4px_4px_0_0_#3f6212]">
                            <img
                                src={student.avatar}
                                alt={student.name}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <div>
                            <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                {student.name}
                            </h1>
                            <p className="mt-2 text-slate-500 font-black uppercase text-sm tracking-widest">
                                Student ID: {student.id}
                            </p>
                            <p className="text-slate-500 font-black uppercase text-sm tracking-widest">
                                Section: {student.section}
                            </p>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 w-full">
                        {student.stats.map((stat, i) => (
                            <div
                                key={i}
                                className="bg-slate-900 rounded-3xl border-4 border-slate-800 p-6 shadow-[8px_8px_0_0_#020617]"
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className="text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                        {stat.label}
                                    </span>
                                    <span
                                        className={`material-symbols-outlined ${stat.color}`}
                                    >
                                        {stat.icon}
                                    </span>
                                </div>
                                <div className="text-2xl font-black text-white italic uppercase tracking-tighter">
                                    {stat.value}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Current Level Of Mode */}
            <div className="mb-12">
                <h2 className="text-xl font-black text-slate-500 uppercase italic tracking-tighter mb-6 flex items-center gap-2">
                    <span className="w-8 h-1 bg-slate-800"></span> Current Level
                    Status
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    {student.modes.map((mode, i) => (
                        <div
                            key={i}
                            className="bg-slate-900 rounded-[2rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] relative overflow-hidden group"
                        >
                            <div className="relative z-10">
                                <div className="flex justify-between items-end mb-6">
                                    <div>
                                        <div className="text-lime-400 font-black uppercase text-xs tracking-widest mb-1">
                                            {mode.name}
                                        </div>
                                        <div className="text-4xl font-black text-white uppercase italic tracking-tighter">
                                            {mode.level}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-slate-500 font-black uppercase text-[10px] tracking-widest mb-1">
                                            Rank
                                        </div>
                                        <div className="text-white font-black uppercase italic tracking-tighter">
                                            {mode.sub}
                                        </div>
                                    </div>
                                </div>
                                {/* Progress Bar */}
                                <div className="h-4 bg-slate-950 rounded-full border-2 border-slate-800 p-0.5">
                                    <div
                                        className={`h-full ${mode.color} rounded-full shadow-[0_0_10px_rgba(163,230,53,0.3)] transition-all duration-1000`}
                                        style={{ width: `${mode.progress}%` }}
                                    ></div>
                                </div>
                                <div className="mt-2 text-right text-[10px] font-black text-slate-600 uppercase tracking-widest">
                                    {mode.progress}% to next rank
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Read Mode: Mastery & Training Zones */}
            {activeMode === "read" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-lime-400 p-3 bg-lime-400/10 rounded-2xl border-2 border-lime-400/20">
                                verified
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Mastery Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-lime-400">
                            {student.readCurriculum.map((level, i) => (
                                <div key={i} className="mb-8 last:mb-0">
                                    {level.mastered.length > 0 && (
                                        <>
                                            <div className="text-lime-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-lime-400 shadow-[0_0_8px_#4ade80]"></div>
                                                {level.level}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {level.mastered.map((word, j) => (
                                                    <span key={j} className="px-4 py-2 bg-slate-900 border-2 border-slate-800 text-white font-black rounded-xl text-sm hover:border-lime-400 transition-colors cursor-default">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-400 p-3 bg-orange-400/10 rounded-2xl border-2 border-orange-400/20">
                                exercise
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Training Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.readCurriculum.map((level, i) => (
                                <div key={i} className="mb-8 last:mb-0">
                                    {level.training.length > 0 && (
                                        <>
                                            <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                                {level.level}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {level.training.map((word, j) => (
                                                    <span key={j} className="px-4 py-2 bg-slate-900 border-2 border-slate-800 text-slate-400 font-black rounded-xl text-sm hover:border-orange-400 transition-colors cursor-default">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Speak Mode: Mastery & Training Zones */}
            {activeMode === "speak" && (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-10">
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-cyan-400 p-3 bg-cyan-400/10 rounded-2xl border-2 border-cyan-400/20">
                                verified
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Mastery Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-cyan-400">
                            {student.speakCurriculum.map((level, i) => (
                                <div key={i} className="mb-8 last:mb-0">
                                    {level.mastered.length > 0 && (
                                        <>
                                            <div className="text-cyan-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-cyan-400 shadow-[0_0_8px_#22d3ee]"></div>
                                                {level.level}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {level.mastered.map((word, j) => (
                                                    <span key={j} className="px-4 py-2 bg-slate-900 border-2 border-slate-800 text-white font-black rounded-xl text-sm hover:border-cyan-400 transition-colors cursor-default">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <span className="material-symbols-outlined text-orange-400 p-3 bg-orange-400/10 rounded-2xl border-2 border-orange-400/20">
                                exercise
                            </span>
                            <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">
                                Training Zone
                            </h3>
                        </div>
                        <div className="bg-slate-950 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] min-h-[400px] max-h-[600px] overflow-y-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-slate-800 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-orange-400">
                            {student.speakCurriculum.map((level, i) => (
                                <div key={i} className="mb-8 last:mb-0">
                                    {level.training.length > 0 && (
                                        <>
                                            <div className="text-orange-400 font-black uppercase text-xs tracking-widest mb-4 flex items-center gap-2">
                                                <div className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_#fb923c]"></div>
                                                {level.level}
                                            </div>
                                            <div className="flex flex-wrap gap-2">
                                                {level.training.map((word, j) => (
                                                    <span key={j} className="px-4 py-2 bg-slate-900 border-2 border-slate-800 text-slate-400 font-black rounded-xl text-sm hover:border-orange-400 transition-colors cursor-default">
                                                        {word}
                                                    </span>
                                                ))}
                                            </div>
                                        </>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Mode Selector Bar */}
            <div className="flex justify-center mt-12">
                <div className="bg-slate-950 p-2 rounded-[2rem] border-4 border-slate-800 flex gap-2 shadow-[8px_8px_0_0_#020617]">
                    <button
                        onClick={() => setActiveMode("read")}
                        className={`px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all flex items-center gap-3 ${
                            activeMode === "read"
                                ? "bg-lime-400 text-slate-950 shadow-[0_0_20px_rgba(163,230,53,0.4)]"
                                : "text-slate-500 hover:text-white hover:bg-slate-900"
                        }`}
                    >
                        <span className="material-symbols-outlined font-black">
                            menu_book
                        </span>
                        WORD BLAST
                    </button>
                    <button
                        onClick={() => setActiveMode("speak")}
                        className={`px-8 py-4 rounded-2xl font-black uppercase italic tracking-tighter transition-all flex items-center gap-3 ${
                            activeMode === "speak"
                                ? "bg-cyan-400 text-slate-950 shadow-[0_0_20px_rgba(34,211,238,0.4)]"
                                : "text-slate-500 hover:text-white hover:bg-slate-900"
                        }`}
                    >
                        <span className="material-symbols-outlined font-black">
                            mic
                        </span>
                        STORY QUEST
                    </button>
                </div>
            </div>
        </DashboardLayout>
    );
}
