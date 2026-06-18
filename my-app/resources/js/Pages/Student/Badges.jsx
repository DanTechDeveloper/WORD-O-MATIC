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

    // 3. Separate earned vs locked for ordered sections
    const earnedAchievements = [
        ...dynamicAchievements,
        ...legacyHardcoded,
    ].filter((b) => !b.isLocked);
    const lockedAchievements = [
        ...dynamicAchievements,
        ...legacyHardcoded,
    ].filter((b) => b.isLocked);

    return (
        <DashboardLayout>
            {/* <!-- Section Header --> */}
            <div class="mb-12 text-center">
                <h2 class="font-headline-xl text-[45px] text-on-background uppercase tracking-tighter mb-4 drop-shadow-[4px_4px_0px_rgba(114,18,255,1)]">
                    GALACTIC ACHIEVEMENTS
                </h2>
                <p class="font-body-lg text-[20px] text-on-surface-variant max-w-2xl mx-auto">
                    Your cosmic journey is paying off, Cadet! Check out the
                    powerful artifacts you've unlocked in the linguistics
                    nebula.
                </p>
            </div>

            {/* <!-- Unlocked Artifacts Section --> */}
            {earnedAchievements.length > 0 && (
                <div class="mb-8">
                    <h3 class="font-headline-md text-headline-md text-on-background uppercase tracking-tight mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-primary">
                            verified
                        </span>
                        Unlocked Artifacts
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {earnedAchievements.map((badge) => (
                            <div
                                key={badge.id}
                                class={`group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 badge-card-hover hover:-translate-y-1 ${badge.colors.shadow.replace("shadow-", "shadow-[8px_8px_0px_0px_")}]`}
                            >
                                <div
                                    class={`absolute -top-6 -right-2 font-black px-4 py-2 rounded-lg border-2 rotate-12 z-10 ${badge.colors.bg} ${badge.colors.text} ${badge.colors.border}`}
                                    style={{
                                        boxShadow:
                                            "4px 4px 0px 0px rgba(0,0,0,0.5)",
                                    }}
                                >
                                    {badge.statusLabel}
                                </div>
                                <div class="flex flex-col items-center text-center space-y-6">
                                    <div
                                        class={`w-32 h-32 ${badge.colors.bg} ${badge.colors.border} border-4 rounded-full flex items-center justify-center text-6xl`}
                                        style={{
                                            boxShadow:
                                                "0px 6px 0px 0px rgba(0,0,0,0.3)",
                                        }}
                                    >
                                        {badge.icon}
                                    </div>
                                    <div>
                                        <h3
                                            class={`font-headline-md text-headline-md mb-2 uppercase tracking-tight ${badge.colors.title}`}
                                        >
                                            {badge.title}
                                        </h3>
                                        <p class="font-body-md text-body-md text-on-surface-variant">
                                            {badge.description}
                                        </p>
                                    </div>
                                    <div class="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                        <div
                                            class={`h-full ${badge.colors.bg}`}
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
                </div>
            )}

            {/* <!-- Cosmic Quests in Progress Section --> */}
            {lockedAchievements.length > 0 && (
                <div class="mt-12">
                    <h3 class="font-headline-md text-headline-md text-on-background uppercase tracking-tight mb-6 flex items-center gap-2">
                        <span class="material-symbols-outlined text-secondary">
                            pending_actions
                        </span>
                        Cosmic Quests in Progress
                    </h3>
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {lockedAchievements.map((badge) => (
                            <div
                                key={badge.id}
                                class="group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 opacity-90"
                                style={{ boxShadow: "8px 8px 0px 0px #1a1a2e" }}
                            >
                                <div class="flex flex-col items-center text-center space-y-6">
                                    <div
                                        class="w-32 h-32 bg-slate-800 border-4 border-slate-950 rounded-full flex items-center justify-center text-6xl grayscale"
                                        style={{
                                            boxShadow:
                                                "0px 6px 0px 0px #0c0c1f",
                                        }}
                                    >
                                        {badge.icon}
                                    </div>
                                    <div>
                                        <h3 class="font-headline-md text-headline-md text-primary mb-1 uppercase tracking-tight">
                                            {badge.title}
                                        </h3>
                                        <p class="font-body-md text-body-md text-on-surface-variant mb-1">
                                            {badge.description}
                                        </p>
                                        <p class="text-[12px] font-bold text-primary uppercase tracking-widest">
                                            {badge.requirement}
                                        </p>
                                    </div>
                                    <div class="w-full">
                                        <div class="flex justify-between text-xs font-bold text-on-surface-variant mb-1">
                                            <span>Progress</span>
                                            <span>{badge.progress}%</span>
                                        </div>
                                        <div class="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                            <div
                                                class={`h-full ${badge.colors.bg}`}
                                                style={{
                                                    width: `${badge.progress}%`,
                                                    boxShadow:
                                                        "inset 0 2px 4px rgba(0,0,0,0.3)",
                                                }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
           
        </DashboardLayout>
    );
}
