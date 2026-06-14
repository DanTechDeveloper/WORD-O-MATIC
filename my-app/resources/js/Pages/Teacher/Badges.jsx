import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link, Head } from "@inertiajs/react";
import BadgesModalInput from "@/Components/Teacher/BadgesModalInput";
import { useState } from "react";

export default function Badges() {
    const [showModal, setShowModal] = useState(false);

    // Mockup data including teacher-specific stats
    const achievements = [
        {
            id: "avatar-selection",
            title: "Avatar Ready",
            description: "Completed avatar selection",
            requirement: "Choose your cosmic identity in the selection screen.",
            icon: "👤",
            earnedCount: 28,
            totalStudents: 30,
            colors: {
                bg: "bg-[#a3e635]",
                text: "text-[#064e3b]",
                border: "border-[#064e3b]",
                title: "text-[#a3e635]",
            },
        },
        {
            id: "tutorial-completion",
            title: "Tutorial Master",
            description: "Completed both tutorial modes",
            requirement: "Learn the basics of Read and Speak modes.",
            icon: "🚀",
            earnedCount: 25,
            totalStudents: 30,
            colors: {
                bg: "bg-primary-container",
                text: "text-white",
                border: "border-slate-950",
                title: "text-primary",
            },
        },
        {
            id: "word-explorer",
            title: "Word Explorer",
            description: "10 correctly pronounced words",
            requirement: "Maintain accuracy across 10 distinct words.",
            icon: "🥉",
            earnedCount: 15,
            totalStudents: 30,
            colors: {
                bg: "bg-secondary-container",
                text: "text-white",
                border: "border-slate-950",
                title: "text-secondary",
            },
        },
    ];

    return (
        <DashboardLayout>
            <BadgesModalInput
                show={showModal}
                onClose={() => setShowModal(false)}
            />
            <Head title="Badge Management" />
            <div className="max-w-full mx-auto px-8 pt-12">
                <div className="flex justify-between items-end mb-12">
                    <div>
                        <h2 className="text-6xl font-black text-white uppercase tracking-tighter drop-shadow-[4px_4px_0px_rgba(163,230,53,1)]">
                            BADGE SYSTEM
                        </h2>
                        <p className="text-xl font-bold text-slate-400 mt-2">
                            Configure and monitor cosmic achievements for your
                            cadets.
                        </p>
                    </div>
                    <button
                        onClick={() => setShowModal(true)}
                        className="bg-lime-400 text-slate-950 font-black px-8 py-4 rounded-xl border-4 border-slate-950 shadow-[6px_6px_0px_0px_#3f6212] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all flex items-center gap-2 uppercase tracking-wider"
                    >
                        <span className="material-symbols-outlined font-black">
                            add
                        </span>
                        Create New Badge
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {achievements.map((badge) => (
                        <div
                            key={badge.id}
                            className="group relative bg-slate-900 border-4 border-slate-800 p-6 rounded-2xl transition-all duration-200 shadow-[8px_8px_0px_0px_#0f172a]"
                        >
                            {/* Header Stats */}
                            <div className="flex justify-between items-start mb-6">
                                <div
                                    className={`w-20 h-20 ${badge.colors.bg} ${badge.colors.border} border-4 rounded-full flex items-center justify-center text-4xl shadow-[0px_4px_0px_0px_rgba(0,0,0,0.3)]`}
                                >
                                    {badge.icon}
                                </div>
                                <div className="text-right">
                                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                                        Unlocked By
                                    </p>
                                    <p className="text-2xl font-black text-white">
                                        {badge.earnedCount}
                                        <span className="text-slate-600">
                                            /{badge.totalStudents}
                                        </span>
                                    </p>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="space-y-4">
                                <div>
                                    <h3
                                        className={`text-2xl font-black uppercase tracking-tight ${badge.colors.title}`}
                                    >
                                        {badge.title}
                                    </h3>
                                    <p className="text-sm font-bold text-slate-400">
                                        {badge.description}
                                    </p>
                                </div>

                                <div className="bg-slate-950 p-4 rounded-xl border-2 border-slate-800 italic text-xs text-slate-500 font-medium">
                                    <span className="text-slate-400 font-black uppercase not-italic block mb-1">
                                        Requirement:
                                    </span>
                                    {badge.requirement}
                                </div>

                                {/* Progress Bar Visualization */}
                                <div className="w-full bg-slate-950 h-3 rounded-full border-2 border-slate-800 overflow-hidden">
                                    <div
                                        className={`h-full ${badge.colors.bg}`}
                                        style={{
                                            width: `${(badge.earnedCount / badge.totalStudents) * 100}%`,
                                        }}
                                    ></div>
                                </div>
                            </div>

                            {/* Admin Actions */}
                            <div className="mt-8 flex gap-3">
                                <button className="flex-1 bg-slate-800 text-white font-black py-3 rounded-xl border-2 border-slate-700 hover:bg-slate-700 transition-colors flex items-center justify-center gap-2 text-xs uppercase">
                                    <span className="material-symbols-outlined text-sm">
                                        edit
                                    </span>
                                    Edit
                                </button>
                                <button className="bg-rose-500/10 text-rose-500 font-black px-4 rounded-xl border-2 border-rose-500/20 hover:bg-rose-500 hover:text-slate-950 transition-all flex items-center justify-center">
                                    <span className="material-symbols-outlined">
                                        delete
                                    </span>
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 p-8 bg-slate-900/50 rounded-3xl border-4 border-dashed border-slate-800 flex flex-col items-center text-center">
                    <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4">
                        <span className="material-symbols-outlined text-slate-500 text-3xl">
                            Auto_Awesome
                        </span>
                    </div>
                    <h4 className="text-white font-black text-xl uppercase italic">
                        Need more challenges?
                    </h4>
                    <p className="text-slate-500 font-bold max-w-md mt-2">
                        You can create custom badges for specific class
                        milestones or holiday events to keep the engagement
                        high.
                    </p>
                </div>
            </div>
        </DashboardLayout>
    );
}
