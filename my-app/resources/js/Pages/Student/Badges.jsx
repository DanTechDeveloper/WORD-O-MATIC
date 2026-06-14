import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

export default function Badges() {
    // Temporary mockup data - in production, this should come from props
    const achievements = [
        {
            id: "avatar-selection",
            title: "Avatar Ready",
            description: "Completed avatar selection",
            requirement: "Choose your cosmic identity in the selection screen.",
            icon: "👤",
            progress: 100,
            isLocked: false,
            statusLabel: "UNLOCKED",
            colors: {
                bg: "bg-[#a3e635]",
                text: "text-[#064e3b]",
                shadow: "shadow-[#14532d]",
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
            progress: 100,
            isLocked: false,
            statusLabel: "COMPLETED",
            colors: {
                bg: "bg-primary-container",
                text: "text-white",
                shadow: "shadow-[#7000ff]",
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
            progress: 100,
            isLocked: false,
            statusLabel: "BRONZE",
            colors: {
                bg: "bg-secondary-container",
                text: "text-white",
                shadow: "shadow-[#890064]",
                border: "border-slate-950",
                title: "text-secondary",
            },
        },
        {
            id: "word-builder",
            title: "Word Builder",
            description: "50 correctly pronounced words",
            requirement: "Expand your vocabulary to 50 mastered words.",
            icon: "🥈",
            progress: 60,
            isLocked: true,
            statusLabel: "LOCKED",
            colors: {
                bg: "bg-[#a3e635]",
                text: "text-[#064e3b]",
                shadow: "shadow-[#14532d]",
                border: "border-[#064e3b]",
                title: "text-[#a3e635]",
            },
        },
        {
            id: "word-master",
            title: "Word Master",
            description: "100 correctly pronounced words",
            requirement: "Show mastery by pronouncing 100 words correctly.",
            icon: "🥇",
            progress: 30,
            isLocked: true,
            statusLabel: "LOCKED",
            colors: {
                bg: "bg-primary-container",
                text: "text-white",
                shadow: "shadow-[#7000ff]",
                border: "border-slate-950",
                title: "text-primary",
            },
        },
        {
            id: "speech-legend",
            title: "Speech Legend",
            description: "200 correctly pronounced words",
            requirement: "Reach legendary status with 200 words.",
            icon: "🏆",
            progress: 15,
            isLocked: true,
            statusLabel: "LOCKED",
            colors: {
                bg: "bg-secondary-container",
                text: "text-white",
                shadow: "shadow-[#890064]",
                border: "border-slate-950",
                title: "text-secondary",
            },
        },
        {
            id: "consistent-learner",
            title: "Consistent Learner",
            description: "3 correct words in a row",
            requirement: "Get 3 words right without missing a beat.",
            icon: "🔥",
            progress: 100,
            isLocked: false,
            statusLabel: "STREAK!",
            colors: {
                bg: "bg-[#a3e635]",
                text: "text-[#064e3b]",
                shadow: "shadow-[#14532d]",
                border: "border-[#064e3b]",
                title: "text-[#a3e635]",
            },
        },
        {
            id: "on-fire",
            title: "On Fire",
            description: "5 correct words in a row",
            requirement: "Keep the momentum going for 5 correct words.",
            icon: "🔥",
            progress: 80,
            isLocked: true,
            statusLabel: "LOCKED",
            colors: {
                bg: "bg-primary-container",
                text: "text-white",
                shadow: "shadow-[#7000ff]",
                border: "border-slate-950",
                title: "text-primary",
            },
        },
        {
            id: "perfect-run",
            title: "Perfect Run 10/10",
            description: "10 correct words in a row",
            requirement: "Achieve the ultimate streak of 10 words.",
            icon: "🔥",
            progress: 0,
            isLocked: true,
            statusLabel: "LOCKED",
            colors: {
                bg: "bg-secondary-container",
                text: "text-white",
                shadow: "shadow-[#890064]",
                border: "border-slate-950",
                title: "text-secondary",
            },
        },
        {
            id: "lesson-finisher",
            title: "Lesson Finisher",
            description: "Completed first module",
            requirement: "Finish all challenges in your first module.",
            icon: "📚",
            progress: 100,
            isLocked: false,
            statusLabel: "MASTERED",
            colors: {
                bg: "bg-[#a3e635]",
                text: "text-[#064e3b]",
                shadow: "shadow-[#14532d]",
                border: "border-[#064e3b]",
                title: "text-[#a3e635]",
            },
        },
    ];

    return (
        <DashboardLayout>
            <div className="max-w-full mx-auto px-margin pt-12">
                <div className="mb-12 text-center">
                    <h2 className="text-7xl font-bold text-on-background uppercase tracking-tighter mb-4 drop-shadow-[4px_4px_0px_rgba(114,18,255,1)]">
                        ACHIEVEMENTS
                    </h2>
                    <p className="text-xl font-bold text-on-surface-variant max-w-2xl mx-auto">
                        Your cosmic journey is paying off, Cadet! Check out the
                        powerful artifacts you've unlocked in the linguistics
                        nebula.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                    {achievements.map((badge) => (
                        <div
                            key={badge.id}
                            className={`group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 shadow-[8px_8px_0px_0px_#1a1a2e] ${!badge.isLocked ? `hover:-translate-y-1 ${badge.colors.shadow.replace("shadow-", "shadow-[8px_8px_0px_0px_")}]` : ""}`}
                        >
                            {/* Locked Overlay */}
                            {badge.isLocked && (
                                <div className="absolute inset-0 bg-slate-950/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-xl z-20 border-4 border-slate-800">
                                    <span className="material-symbols-outlined text-6xl text-slate-400 mb-2">
                                        lock
                                    </span>
                                    <p className="text-slate-400 font-black uppercase tracking-widest text-sm">
                                        LOCKED
                                    </p>
                                    <p className="text-slate-500 text-xs mt-2 px-4 text-center font-bold italic">
                                        {badge.requirement}
                                    </p>
                                </div>
                            )}

                            {/* Ribbon Label */}
                            <div
                                className={`absolute -top-6 -right-2 font-black px-4 py-2 rounded-lg border-2 rotate-12 shadow-[4px_4px_0px_0px_rgba(0,0,0,0.5)] z-10 transition-colors ${badge.isLocked ? "bg-slate-700 text-slate-400 border-slate-900" : `${badge.colors.bg} ${badge.colors.text} ${badge.colors.border}`}`}
                            >
                                {badge.isLocked ? "LOCKED" : badge.statusLabel}
                            </div>

                            <div
                                className={`flex flex-col items-center text-center space-y-6 ${badge.isLocked ? "grayscale opacity-50" : ""}`}
                            >
                                <div
                                    className={`w-32 h-32 ${badge.colors.bg} ${badge.colors.border} border-4 rounded-full flex items-center justify-center text-6xl shadow-[0px_6px_0px_0px_rgba(0,0,0,0.3)]`}
                                >
                                    {badge.icon}
                                </div>
                                <div>
                                    <h3
                                        className={`font-headline-md text-headline-md mb-2 uppercase tracking-tight ${!badge.isLocked ? badge.colors.title : "text-on-surface-variant"}`}
                                    >
                                        {badge.title}
                                    </h3>
                                    <p className="font-body-md text-body-md text-on-surface-variant">
                                        {badge.description}
                                    </p>
                                </div>
                                <div className="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                    <div
                                        className={`h-full transition-all duration-1000 ${badge.colors.bg}`}
                                        style={{
                                            width: `${badge.progress}%`,
                                            boxShadow:
                                                "inset 0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-center">
                    <Link
                        href="/student/dashboard"
                        className="bg-[#a3e635] text-[#064e3b] font-headline-md text-headline-md px-12 py-6 rounded-2xl border-4 border-[#064e3b] shadow-[0px_8px_0px_0px_#064e3b] active:translate-y-1 active:shadow-[0px_4px_0px_0px_#064e3b] transition-all flex items-center gap-3 active-press"
                    >
                        <span className="material-symbols-outlined text-4xl">
                            rocket
                        </span>
                        BACK TO HOME
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
