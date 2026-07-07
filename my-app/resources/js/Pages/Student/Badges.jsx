import { useEffect } from "react";
import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

const METRIC_LABELS = {
    total_points: "Points",
    streak: "Streak",
    accuracy: "Accuracy",
    action: "Action",
};

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
    useEffect(() => {
        localStorage.removeItem('hasNewBadge');
    }, []);

    const dynamicAchievements = (badges || []).map((badge) => {
        const ui = BADGE_UI_CONFIG[badge.slug] || BADGE_UI_CONFIG.default;
        const hasThreshold = badge.threshold != null && badge.current_value != null;
        const progress = badge.is_earned
            ? 100
            : hasThreshold
                ? Math.min((badge.current_value / badge.threshold) * 100, 100)
                : 0;
        return {
            id: badge.id,
            slug: badge.slug,
            title: badge.name,
            description: badge.description,
            requirement: badge.requirement,
            icon: ui.icon,
            progress,
            isLocked: !badge.is_earned,
            statusLabel: ui.statusLabel,
            colors: ui.colors,
            hasThreshold,
            currentValue: badge.current_value,
            threshold: badge.threshold,
        };
    });

    const earnedAchievements = dynamicAchievements.filter((b) => !b.isLocked);
    const lockedAchievements = dynamicAchievements.filter((b) => b.isLocked);

    return (
        <DashboardLayout>
            <div className="mb-4 pt-2">
                <Link
                    href="/student/dashboard"
                    className="bg-surface-container-high border-2 border-surface-variant/50 p-2 rounded-full text-on-surface inline-flex items-center justify-center hover:bg-surface-variant transition-all aspect-square shadow-lg w-12 h-12"
                >
                    <span className="material-symbols-outlined text-2xl">arrow_back</span>
                </Link>
            </div>

            <div className="mb-8 text-center">
                <h2 className="text-4xl lg:text-6xl font-black text-on-surface uppercase tracking-tight mb-2 flex items-center justify-center gap-3">
                    <span>🏆</span> Achievements
                </h2>
                <p className="text-on-surface-variant text-base font-bold max-w-lg mx-auto">
                    Collect them all by completing challenges
                </p>
            </div>

            {/* Unlocked */}
            {earnedAchievements.length > 0 && (
                <div className="mb-10">
                    <h3 className="text-xl font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="text-lime-400 text-2xl">✦</span>
                        Unlocked
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {earnedAchievements.map((badge) => (
                            <div
                                key={badge.id}
                                className="relative bg-surface-container rounded-xl border border-surface-variant/20 p-6 text-center hover:-translate-y-1 transition-all duration-200"
                            >
                                <div className={`absolute -top-3 right-2 text-sm font-black px-3 py-1 rounded-md ${badge.colors.bg} ${badge.colors.text} border ${badge.colors.border}`}>
                                    {badge.statusLabel}
                                </div>
                                <div className={`w-24 h-24 mx-auto mb-3 rounded-full ${badge.colors.bg} ${badge.colors.border} border-2 flex items-center justify-center text-5xl`}>
                                    {badge.icon}
                                </div>
                                <h4 className={`text-lg font-black uppercase tracking-tight ${badge.colors.title}`}>
                                    {badge.title}
                                </h4>
                                <p className="text-sm text-on-surface-variant/70 mt-1 leading-tight">
                                    {badge.description}
                                </p>
                                <div className="mt-3 w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                    <div className={`h-full ${badge.colors.bg}`} style={{ width: `${badge.progress}%` }} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Locked */}
            {lockedAchievements.length > 0 && (
                <div>
                    <h3 className="text-xl font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="text-on-surface-variant/50 text-2xl">✦</span>
                        To Unlock
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {lockedAchievements.map((badge) => (
                            <div
                                key={badge.id}
                                className="relative bg-surface-container-low rounded-xl border border-dashed border-surface-variant/20 p-6 text-center opacity-70"
                            >
                                <div className="w-24 h-24 mx-auto mb-3 rounded-full bg-slate-800 border-2 border-slate-700 flex items-center justify-center text-5xl grayscale">
                                    {badge.icon}
                                </div>
                                <h4 className="text-lg font-black uppercase tracking-tight text-on-surface-variant/60">
                                    {badge.title}
                                </h4>
                                <p className="text-sm text-on-surface-variant/40 mt-1 leading-tight">
                                    {badge.description}
                                </p>
                                {badge.hasThreshold && (
                                    <div className="mt-3">
                                        <div className="flex justify-between text-sm font-bold text-on-surface-variant/50 mb-1">
                                            <span>{badge.currentValue}/{badge.threshold}</span>
                                        </div>
                                        <div className="w-full bg-slate-900 h-2.5 rounded-full overflow-hidden">
                                            <div className="h-full bg-slate-700" style={{ width: `${badge.progress}%` }} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
