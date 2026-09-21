import { Head, Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockFlow from "@/Components/Student/BadgeUnlockFlow";
import NextBadge from "@/Components/Student/NextBadge";
import StatTile from "@/Components/Student/StatTile";
import DeadlineBanner from "@/Components/DeadlineBanner";
import { getDeadlineInfo } from "@/hooks/Student/useDeadlineStatus";

const CONFETTI = [
    { icon: "celebration", color: "text-accent" },
    { icon: "star", color: "text-lime-400" },
    { icon: "auto_awesome", color: "text-tertiary" },
    { icon: "local_fire_department", color: "text-orange-400" },
    { icon: "party_mode", color: "text-quest" },
    { icon: "emoji_events", color: "text-amber-400" },
    { icon: "bolt", color: "text-yellow-300" },
];

const HEADLINES = {
    zero: [
        "EVERY CHAMPION STARTS SOMEWHERE!",
        "FIRST TRY DONE, LET'S GO!",
        "EVERY WORD COUNTS!",
    ],
    low: ["YOU GOT THIS!", "KEEP GOING!", "GOOD TRY! KEEP PRACTICING!"],
    mid: ["GREAT JOB!", "NICE WORK!", "KEEP IT UP!"],
    high: ["INCREDIBLE!", "OUTSTANDING!", "AMAZING!"],
};

export default function GameResults({
    session,
    moduleTitle,
    totalItems,
    badgeProgress,
    moduleLevel,
    nextModuleLevel,
    isMaxLevel,
    deadlineHit,
    bestScore = 0,
    isTutorial = false,
    sentenceScores = null,
    isPractice = false,
}) {
    const displayScore = parseInt(session.score) || 0;
    const accuracyPct = parseFloat(session.accuracy) || 0;
    const isPracticeMode = !!isPractice;
    const isPerfect = !deadlineHit && !isPracticeMode && accuracyPct >= 100;
    const headlinePool =
        displayScore === 0
            ? HEADLINES.zero
            : accuracyPct >= 80
              ? HEADLINES.high
              : accuracyPct >= 60
                ? HEADLINES.mid
                : HEADLINES.low;
    const headline = isPerfect ? "PERFECT!" : headlinePool[session.id % headlinePool.length];
    const isCelebrating = !deadlineHit && !isPracticeMode && accuracyPct >= 80;
    // ponytail: SQ-only presentation detail — rendered from the persisted
    // array, never recalculated (score stays the authoritative aggregate).
    const sentenceBreakdown =
        !isTutorial &&
        session.module_type === "paragraph" &&
        Array.isArray(sentenceScores) &&
        sentenceScores.length > 0;
    const { flash, auth } = usePage().props;
    const isGlobalClosed = getDeadlineInfo(auth?.deadline).phase === "closed";
    const newBadgeSlugs = flash?.new_badges?.map((b) => b.slug) ?? [];
    // ponytail: Dashboard AvatarSpeechBubble is now the tutorial-complete end, not GameResults
    const newBadges = badgeProgress?.filter((b) => newBadgeSlugs.includes(b.slug)) ?? [];
    const [badgeFlowDone, setBadgeFlowDone] = useState(false);

    const nextBadge =
        badgeProgress
            ?.filter((b) => !b.is_earned)
            .sort((a, b) => {
                const ap = a.threshold > 0 ? a.current_value / a.threshold : 0;
                const bp = b.threshold > 0 ? b.current_value / b.threshold : 0;
                return bp - ap;
            })[0] ?? null;

    const renderResults = () => (
        <div className="bg-background text-on-background font-body-md">
            <Head title="Game Results — Word-O-Matic">
                <meta name="description" content="Your game results on Word-O-Matic." />
            </Head>
            <div className="relative min-h-screen flex flex-col items-center justify-center px-4 xs:px-5 sm:px-6 py-8 sm:py-12">
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[80px] rounded-full -z-10" aria-hidden="true" />

                {isCelebrating && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {CONFETTI.map((c, i) => (
                            <span
                                key={i}
                                className={`material-symbols-outlined absolute text-3xl ${c.color}`}
                                aria-hidden="true"
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${-10 - i * 5}%`,
                                    fontVariationSettings: "'FILL' 1",
                                }}
                            >
                                {c.icon}
                            </span>
                        ))}
                    </div>
                )}
                <div className="w-full max-w-[92vw] sm:max-w-lg mx-auto flex flex-col gap-6 sm:gap-8 animate-fade-in px-1 sm:px-0">
                    <div className="text-center px-2 sm:px-0 max-w-[98vw] sm:max-w-[64ch] mx-auto overflow-visible">
                        <h1 className="font-black text-primary uppercase leading-none tracking-tight whitespace-nowrap overflow-visible text-[clamp(1rem,5.2vw,2.8rem)] xs:text-[clamp(1.1rem,5vw,3rem)] sm:text-[clamp(1.5rem,4.5vw,3.5rem)] md:text-[clamp(2rem,4vw,4rem)]">
                            {deadlineHit ? "TIME'S UP!" : headline}
                        </h1>
                        <p className="text-lg font-bold text-on-surface-variant uppercase tracking-wider mt-2">
                            {moduleTitle}
                        </p>
                    </div>

                    {deadlineHit && (
                        <DeadlineBanner message="Time's up! The Game ended after the Challenge — so no points, no badges, and no leaderboard this time. You still played great!" />
                    )}
                    {isPracticeMode && (
                        <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500 rounded-xl flex items-start gap-3">
                            <span className="material-symbols-outlined text-sky-600" style={{ fontVariationSettings: "'FILL' 1" }}>school</span>
                            <p className="text-sky-700 font-semibold">Practice mode — scores won’t save while reports are closed. Keep playing!</p>
                        </div>
                    )}

                    {!isTutorial && (
                        <div className="flex gap-3 sm:gap-4">
                            <StatTile
                                label="Best"
                                value={`${bestScore}/${totalItems}`}
                                valueClassName="text-quest"
                                note={bestScore > displayScore ? "Your best" : bestScore === displayScore && bestScore > 0 ? "New best!" : undefined}
                            />
                            <StatTile
                                label={deadlineHit ? "You played" : isPracticeMode ? "Practice" : "Score"}
                                value={`${displayScore}/${totalItems}`}
                                valueClassName={deadlineHit || isPracticeMode ? "text-on-surface-variant" : "text-accent"}
                                note={
                                    deadlineHit
                                        ? "Points not counted — deadline passed"
                                        : isPracticeMode
                                          ? "Practice — not saved"
                                          : undefined
                                }
                            />
                        </div>
                    )}

                    {sentenceBreakdown && (
                        <div className="bg-surface-container rounded-3xl border-4 border-outline/20 p-4 sm:p-6">
                            <div className="text-on-surface-variant font-black uppercase text-[10px] sm:text-xs tracking-widest mb-3">
                                Sentence Scores
                            </div>
                            <div className="space-y-2">
                                {sentenceScores.map((s, i) => (
                                    <div key={i} className="flex justify-between items-center gap-2">
                                        <span className="text-on-surface-variant font-bold text-sm sm:text-base md:text-lg">
                                            Sentence {i + 1}
                                        </span>
                                        <span className="text-quest font-black uppercase italic tracking-tighter text-xl sm:text-2xl">
                                            {s}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="text-center font-bold text-accent flex items-center justify-center gap-1.5 sm:gap-2 whitespace-nowrap max-w-[96vw] overflow-visible mx-auto text-[clamp(0.75rem,3.8vw,1.25rem)] xs:text-[clamp(0.85rem,3.5vw,1.3rem)] sm:text-[clamp(0.875rem,3.2vw,1.4rem)] md:text-[clamp(1rem,2.2vw,1.5rem)]">
                        <span
                            className="material-symbols-outlined text-xl sm:text-2xl shrink-0"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            sentiment_very_satisfied
                        </span>
                        {isPerfect
                            ? "Amazing!"
                            : accuracyPct >= 80
                              ? "Outstanding keep shining!"
                              : accuracyPct >= 60
                                ? "Great progress!"
                                : accuracyPct >= 40
                                  ? "Good try practice makes progress!"
                                  : "Every try counts keep going!"}
                    </div>

                    {!deadlineHit && !isPracticeMode && !isTutorial && nextBadge && (
                        <NextBadge badge={nextBadge} />
                    )}

                    {isGlobalClosed || isPracticeMode || deadlineHit ? (
                        <div className="flex gap-4">
                            <Link
                                href="/student/dashboard"
                                className="flex-1 bg-primary text-on-primary font-bold py-4 sm:py-5 rounded-2xl border border-surface-variant/20 text-sm sm:text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined mr-2">
                                    home
                                </span>
                                Home
                            </Link>
                        </div>
                    ) : (
                        <div className="flex flex-col xs:flex-row gap-3 sm:gap-4">
                            <Link
                                href={`/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${moduleLevel}`}
                                data-sfx="major"
                                className="flex-1 bg-surface-container-high text-on-surface font-bold py-4 sm:py-5 rounded-2xl border border-surface-variant/20 text-sm sm:text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest text-center flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined mr-2">
                                    replay
                                </span>
                                Again
                            </Link>
                            {!isMaxLevel &&
                                (nextModuleLevel ? (
                                    <Link
                                        href={`/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${nextModuleLevel}`}
                                        data-sfx="major"
                                        className="flex-1 bg-primary text-on-primary font-bold py-4 sm:py-5 rounded-2xl border border-surface-variant/20 text-sm sm:text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center flex items-center justify-center"
                                    >
                                        <span className="material-symbols-outlined mr-2">
                                            arrow_forward
                                        </span>
                                        Next Level
                                    </Link>
                                ) : (
                                    <Link
                                        href="/student/readModeLevels"
                                        className="flex-1 bg-surface-container-high text-on-surface font-bold py-4 sm:py-5 rounded-2xl border border-surface-variant/20 text-sm sm:text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest text-center flex items-center justify-center"
                                    >
                                        <span
                                            className="material-symbols-outlined mr-2"
                                            style={{
                                                fontVariationSettings:
                                                    "'FILL' 1",
                                            }}
                                        >
                                            menu_book
                                        </span>
                                        Levels
                                    </Link>
                                ))}
                            <Link
                                href="/student/dashboard"
                                className="flex-1 bg-surface-container-high text-on-surface font-bold py-4 sm:py-5 rounded-2xl border border-surface-variant/20 text-sm sm:text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest text-center flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined mr-2">
                                    home
                                </span>
                                Home
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (newBadges.length > 0 && !badgeFlowDone && !isPracticeMode) {
        return (
            <div className="bg-background text-on-background font-body-md">
                <BadgeUnlockFlow
                    badges={newBadges}
                    onDone={() => setBadgeFlowDone(true)}
                />
            </div>
        );
    }

    return renderResults();
}
