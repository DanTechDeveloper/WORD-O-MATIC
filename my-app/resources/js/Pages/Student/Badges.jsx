import { Head, Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import DeadlineBanner from "@/Components/DeadlineBanner";
import BackButton from "@/Components/Student/BackButton";
import PageHeader from "@/Components/Student/PageHeader";
import ProgressBar from "@/Components/Student/ProgressBar";
import useDeadlineStatus from "@/hooks/Student/useDeadlineStatus";

const PALETTE = {
    accent: { bg: "bg-accent", text: "text-background", border: "border-accent", title: "text-accent" },
    quest: { bg: "bg-quest", text: "text-background", border: "border-quest", title: "text-quest" },
    primary: { bg: "bg-primary", text: "text-background", border: "border-primary", title: "text-primary" },
    secondary: { bg: "bg-secondary", text: "text-background", border: "border-secondary", title: "text-secondary" },
    tertiary: { bg: "bg-tertiary", text: "text-background", border: "border-tertiary", title: "text-tertiary" },
    error: { bg: "bg-error", text: "text-background", border: "border-error", title: "text-error" },
};

const BADGE_UI_CONFIG = {
    "first-steps": { statusLabel: "STARTED", colors: PALETTE.accent },
    "word-master": { statusLabel: "MASTERED", colors: PALETTE.tertiary },
    "halfway-hero": { statusLabel: "HALFWAY", colors: PALETTE.quest },
    "story-explorer": { statusLabel: "EXPLORER", colors: PALETTE.accent },
    "story-master": { statusLabel: "MASTER", colors: PALETTE.quest },
    "sentence-star": { statusLabel: "STAR", colors: PALETTE.quest },
    "on-fire": { statusLabel: "STREAK", colors: PALETTE.error },
    "blazing-streak": { statusLabel: "STREAK", colors: PALETTE.tertiary },
    "unstoppable": { statusLabel: "STREAK", colors: PALETTE.primary },
    "clear-speaker": { statusLabel: "EXPERT", colors: PALETTE.secondary },
    "perfect-round": { statusLabel: "PERFECT", colors: PALETTE.quest },
    "tutorial-complete": { statusLabel: "COMPLETED", colors: PALETTE.accent },
    "profile-pioneer": { statusLabel: "UNLOCKED", colors: PALETTE.quest },
    default: { statusLabel: "UNLOCKED", colors: PALETTE.primary },
};

// ponytail: mode comes from the badges.mode column (server truth), never a
// slug map here — new badges land in a section automatically. Unknown modes
// collapse to shared so a missing value renders instead of vanishing.
const MODE_SECTIONS = [
    { mode: "word", title: "Word Blast", icon: "menu_book", iconClass: "text-accent" },
    { mode: "paragraph", title: "Story Quest", icon: "mic", iconClass: "text-quest" },
    { mode: "shared", title: "Shared Milestones", icon: "emoji_events", iconClass: "text-primary" },
];

function EarnedBadgeCard({ badge }) {
    return (
        <div
            className="relative bg-surface-container rounded-xl border border-outline/20 p-6 text-center hover:-translate-y-1 transition-transform duration-150 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
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
            <div className="mt-3">
                <ProgressBar
                    value={badge.progress}
                    barClassName={badge.colors.bg}
                    trackClassName="bg-background"
                    heightClassName="h-2.5"
                />
            </div>
        </div>
    );
}

function LockedBadgeCard({ badge }) {
    return (
        <div
            className="relative bg-surface-container-low rounded-xl border border-dashed border-outline/20 p-6 text-center opacity-70"
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
                            <span>{Math.round(badge.currentValue)}/{Math.round(badge.threshold)}</span>
                        </div>
                        <ProgressBar
                            value={badge.progress}
                            barClassName="bg-surface-variant"
                            trackClassName="bg-background"
                            heightClassName="h-2.5"
                        />
                    </div>
            )}
        </div>
    );
}

export default function Badges({ badges, tutorialSkipped = false, wordTutorialDone = false, speakTutorialDone = false }) {
    const isDeadlineClosed = useDeadlineStatus();

    const dynamicAchievements = (badges || []).map((badge) => {
        const ui = BADGE_UI_CONFIG[badge.slug] || BADGE_UI_CONFIG.default;
        const hasThreshold = badge.threshold != null && badge.current_value != null;
        const progress = badge.is_earned
            ? 100
            : hasThreshold
                ? Math.min(Math.round((badge.current_value / badge.threshold) * 100), 100)
                : 0;
        return {
            id: badge.id,
            slug: badge.slug,
            mode: badge.mode ?? "shared",
            title: badge.name,
            description: badge.description,
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

    const byMode = (mode) => dynamicAchievements.filter((b) => b.mode === mode);

    return (
        <DashboardLayout>
            <Head title="Badges — Word-O-Matic">
                <meta name="description" content="Your badges and achievements on Word-O-Matic." />
            </Head>
            <div className="mb-4 pt-2">
                <BackButton />
            </div>

            <DeadlineBanner isDeadlineClosed={isDeadlineClosed} />

            {tutorialSkipped && (
                <div className="mb-6 bg-amber-500/15 border-2 border-amber-400/40 rounded-2xl px-5 py-4 flex items-start gap-3">
                    <span className="material-symbols-outlined text-amber-400 text-2xl shrink-0 mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>info</span>
                    <div className="flex-1">
                        <p className="text-amber-300 font-black uppercase text-sm">Tutorial skipped — badge locked</p>
                        <p className="text-on-surface-variant text-sm mt-1">
                            You skipped the tutorial, so <span className="font-bold text-on-surface">Tutorial Complete</span> is not claimable yet. Complete both phases to earn it.
                            {wordTutorialDone && !speakTutorialDone && " Word Blast done — finish Story Quest!"}
                            {!wordTutorialDone && " Start with Word Blast — then Story Quest unlocks."}
                        </p>
                        <Link href="/student/tutorial" data-sfx="major" className="inline-flex items-center gap-2 mt-3 rounded-xl px-4 py-2 font-black text-xs uppercase tracking-wider bg-amber-400 text-background hover:brightness-110 transition-all">
                            <span className="material-symbols-outlined text-base">school</span>
                            Go to Tutorial
                        </Link>
                    </div>
                </div>
            )}

            <PageHeader
                icon="emoji_events"
                title="Achievements"
                subtitle="Collect them all by completing challenges"
            />

            {/* Mode sections: Word Blast / Story Quest / Shared */}
            {MODE_SECTIONS.map((section) => {
                const items = byMode(section.mode);
                if (items.length === 0) return null;
                const earned = items.filter((b) => !b.isLocked);
                const locked = items.filter((b) => b.isLocked);
                return (
                    <div key={section.mode} className="mb-10">
                        <h3 className="text-xl font-black text-on-surface uppercase tracking-wider mb-4 flex items-center gap-2">
                            <span className={`material-symbols-outlined text-2xl ${section.iconClass}`} style={{ fontVariationSettings: "'FILL' 1" }}>{section.icon}</span>
                            {section.title}
                        </h3>
                        {earned.length > 0 && (
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                {earned.map((badge) => (
                                    <EarnedBadgeCard key={badge.id} badge={badge} />
                                ))}
                            </div>
                        )}
                        {locked.length > 0 && (
                            <div className={earned.length > 0 ? "mt-4" : ""}>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {locked.map((badge) => (
                                        <LockedBadgeCard key={badge.id} badge={badge} />
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                );
            })}
        </DashboardLayout>
    );
}
