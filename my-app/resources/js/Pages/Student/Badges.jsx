import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

/**
 * UI Configuration Mapping
 * Keys match the 'slug' provided by the backend response.
 */
const BADGE_UI_CONFIG = {
    "profile-pioneer": {
        icon: "👤",
        statusLabel: "UNLOCKED",
        colors: {
            bg: "bg-[#a3e635]",
            text: "text-[#064e3b]",
            shadow: "shadow-[#14532d]",
            border: "border-[#064e3b]",
            title: "text-[#a3e635]",
        },
    },
    "story-finisher": {
        icon: "📚",
        statusLabel: "FINISHED",
        colors: {
            bg: "bg-[#a3e635]",
            text: "text-[#064e3b]",
            shadow: "shadow-[#14532d]",
            border: "border-[#064e3b]",
            title: "text-[#a3e635]",
        },
    },
    "word-master": {
        icon: "🥇",
        statusLabel: "MASTERED",
        colors: {
            bg: "bg-primary-container",
            text: "text-white",
            shadow: "shadow-[#7000ff]",
            border: "border-slate-950",
            title: "text-primary",
        },
    },
    "clear-speaker": {
        icon: "🥈",
        statusLabel: "EXPERT",
        colors: {
            bg: "bg-secondary-container",
            text: "text-white",
            shadow: "shadow-[#890064]",
            border: "border-slate-950",
            title: "text-secondary",
        },
    },
    // Add mappings for other hardcoded IDs to maintain consistency
    "tutorial-completion": {
        icon: "🚀",
        statusLabel: "COMPLETED",
        colors: {
            bg: "bg-primary-container",
            text: "text-white",
            shadow: "shadow-[#7000ff]",
            border: "border-slate-950",
            title: "text-primary",
        },
    },
    "on-fire": {
        icon: "🔥",
        statusLabel: "STREAK",
        colors: {
            bg: "bg-primary-container",
            text: "text-white",
            shadow: "shadow-[#7000ff]",
            border: "border-slate-950",
            title: "text-primary",
        },
    },
    default: {
        icon: "⭐",
        statusLabel: "LOCKED",
        colors: {
            bg: "bg-slate-700",
            text: "text-white",
            shadow: "shadow-slate-900",
            border: "border-slate-950",
            title: "text-slate-400",
        },
    },
};

export default function Badges({ badges }) {
    // 1. Map dynamic badges from the backend response
    const dynamicAchievements = (badges || []).map((badge) => {
        const ui = BADGE_UI_CONFIG[badge.slug] || BADGE_UI_CONFIG.default;
        return {
            id: badge.id,
            title: badge.name,
            description: badge.description,
            requirement: badge.requirement,
            icon: ui.icon,
            progress: badge.is_earned ? 100 : 0,
            isLocked: !badge.is_earned,
            statusLabel: ui.statusLabel,
            colors: ui.colors,
        };
    });

    // 2. Keep the other hardcoded ones that aren't in the response yet
    // These will be removed once your backend provides them in the 'badges' prop
    const legacyHardcoded = [
        {
            id: "tutorial-completion",
            title: "Tutorial Master",
            description: "Completed both tutorial modes",
            requirement: "Learn the basics of Read and Speak modes.",
            ...BADGE_UI_CONFIG["tutorial-completion"],
            progress: 100,
            isLocked: false,
        },
        {
            id: "on-fire",
            title: "On Fire",
            description: "5 correct words in a row",
            requirement: "Keep the momentum going for 5 correct words.",
            ...BADGE_UI_CONFIG["on-fire"],
            progress: 80,
            isLocked: true,
        },
        // Add any others here...
    ].filter((h) => !dynamicAchievements.some((d) => d.slug === h.id));

    const achievements = [...dynamicAchievements, ...legacyHardcoded];

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
