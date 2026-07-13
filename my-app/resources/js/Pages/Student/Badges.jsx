import { useEffect } from "react";
import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

const METRIC_LABELS = {
    total_points: "Points",
    streak: "Streak",
    accuracy: "Accuracy",
    action: "Action",
};

const PALETTE = {
    accent: { bg: "bg-accent", text: "text-slate-950", border: "border-accent", title: "text-accent" },
    quest: { bg: "bg-quest", text: "text-slate-950", border: "border-quest", title: "text-quest" },
    primary: { bg: "bg-primary", text: "text-slate-950", border: "border-primary", title: "text-primary" },
    secondary: { bg: "bg-secondary", text: "text-slate-950", border: "border-secondary", title: "text-secondary" },
    tertiary: { bg: "bg-tertiary", text: "text-slate-950", border: "border-tertiary", title: "text-tertiary" },
    error: { bg: "bg-error", text: "text-slate-950", border: "border-error", title: "text-error" },
};

const BADGE_UI_CONFIG = {
    "first-steps": { statusLabel: "STARTED", colors: PALETTE.accent },
    "word-master": { statusLabel: "MASTERED", colors: PALETTE.tertiary },
    "story-finisher": { statusLabel: "FINISHED", colors: PALETTE.quest },
    "on-fire": { statusLabel: "STREAK", colors: PALETTE.error },
    "blazing-streak": { statusLabel: "STREAK", colors: PALETTE.tertiary },
    "unstoppable": { statusLabel: "STREAK", colors: PALETTE.primary },
    "clear-speaker": { statusLabel: "EXPERT", colors: PALETTE.secondary },
    "perfect-round": { statusLabel: "PERFECT", colors: PALETTE.quest },
    "tutorial-complete": { statusLabel: "COMPLETED", colors: PALETTE.accent },
    "profile-pioneer": { statusLabel: "UNLOCKED", colors: PALETTE.quest },
    default: { statusLabel: "UNLOCKED", colors: PALETTE.primary },
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
            icon: badge.icon,
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
                    <span className="material-symbols-outlined text-5xl lg:text-7xl text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                    Achievements
                </h2>
                <p className="text-on-surface-variant text-base font-bold max-w-lg mx-auto">
                    Collect them all by completing challenges
                </p>
            </div>

            {/* Unlocked */}
            {earnedAchievements.length > 0 && (
                <div className="mb-10">
                    <h3 className="text-xl font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
                        <span className="material-symbols-outlined text-accent text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
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
                                <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center">
                                    <span className={`material-symbols-outlined text-7xl ${badge.colors.title}`}>{badge.icon}</span>
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
                        <span className="material-symbols-outlined text-on-surface-variant/50 text-2xl">lock</span>
                        To Unlock
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                        {lockedAchievements.map((badge) => (
                            <div
                                key={badge.id}
                                className="relative bg-surface-container-low rounded-xl border border-dashed border-surface-variant/20 p-6 text-center opacity-70"
                            >
                                <div className="w-24 h-24 mx-auto mb-3 flex items-center justify-center grayscale opacity-60">
                                    <span className="material-symbols-outlined text-7xl text-on-surface-variant">{badge.icon}</span>
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
