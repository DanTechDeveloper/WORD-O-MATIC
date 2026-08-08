import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockFlow from "@/Components/Student/BadgeUnlockFlow";
import NextBadge from "@/Components/Student/NextBadge";
import StatTile from "@/Components/Student/StatTile";
import DeadlineBanner from "@/Components/DeadlineBanner";
import useDeadlineStatus from "@/hooks/Student/useDeadlineStatus";

const CONFETTI = [
    { icon: "celebration", color: "text-accent" },
    { icon: "star", color: "text-lime-400" },
    { icon: "auto_awesome", color: "text-tertiary" },
    { icon: "local_fire_department", color: "text-orange-400" },
    { icon: "party_mode", color: "text-quest" },
    { icon: "emoji_events", color: "text-amber-400" },
    { icon: "bolt", color: "text-yellow-300" },
]

const HEADLINES = {
    zero: ["EVERY CHAMPION STARTS SOMEWHERE!", "FIRST TRY DONE, LET'S GO!", "EVERY WORD COUNTS!"],
    low: ["YOU GOT THIS!", "KEEP GOING!", "PRACTICE MAKES PROGRESS!"],
    mid: ["GREAT JOB!", "NICE WORK!", "KEEP IT UP!"],
    high: ["INCREDIBLE!", "OUTSTANDING!", "AMAZING!"],
}

export default function GameResults({
    session,
    moduleTitle,
    totalItems,
    badgeProgress,
    nextModuleId,
    isMaxLevel,
    deadlineHit,
}) {
    const displayScore = parseInt(session.score) || 0;
    const accuracyPct = parseFloat(session.accuracy) || 0;
    const isPerfect = !deadlineHit && accuracyPct >= 100;
    const headlinePool = displayScore === 0
        ? HEADLINES.zero
        : accuracyPct >= 80 ? HEADLINES.high
        : accuracyPct >= 60 ? HEADLINES.mid
        : HEADLINES.low;
    const headline = isPerfect ? "PERFECT!" : headlinePool[session.id % headlinePool.length];
    const isCelebrating = !deadlineHit && accuracyPct >= 80;
    const { flash } = usePage().props;
    const isDeadlineClosed = useDeadlineStatus();
    const newBadgeSlugs = flash?.new_badges?.map(b => b.slug) ?? [];
    const newBadges = badgeProgress?.filter(b => newBadgeSlugs.includes(b.slug)) ?? [];
    const [badgeFlowDone, setBadgeFlowDone] = useState(false);

    const nextBadge = badgeProgress?.filter((b) => !b.is_earned).sort((a, b) => {
        const ap = a.threshold > 0 ? (a.current_value / a.threshold) : 0;
        const bp = b.threshold > 0 ? (b.current_value / b.threshold) : 0;
        return bp - ap;
    })[0] ?? null;

    const renderResults = () => (
        <div className="bg-background text-on-background font-body-md">
            <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />

                {isCelebrating && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {CONFETTI.map((c, i) => (
                            <span
                                key={i}
                                className={`material-symbols-outlined absolute text-3xl animate-bounce ${c.color}`}
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${-10 - i * 5}%`,
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: `${1 + (i % 3) * 0.5}s`,
                                    fontVariationSettings: "'FILL' 1",
                                }}
                            >
                                {c.icon}
                            </span>
                        ))}
                    </div>
                )}
                <div className="w-full max-w-lg mx-auto flex flex-col gap-8 animate-fade-in">
                    <div className="text-center">
                        <h1 className="text-6xl sm:text-7xl font-black text-primary uppercase leading-tight">
                            {deadlineHit ? "TIME'S UP!" : headline}
                        </h1>
                        <p className="text-lg font-bold text-on-surface-variant uppercase tracking-wider mt-2">
                            {moduleTitle}
                        </p>
                    </div>

                    {deadlineHit && (
                        <DeadlineBanner
                            isDeadlineClosed
                            message="Time's up! The Game ended after the Challenge — so no points, no badges, and no leaderboard this time. You still played great!"
                        />
                    )}

                    <div className="flex gap-4">
                        <StatTile
                            label={deadlineHit ? "You played" : "Score"}
                            value={displayScore}
                            note={deadlineHit ? "Points not counted — deadline passed" : undefined}
                        />
                        <StatTile label="Words" value={totalItems} valueClassName="text-on-surface" />
                    </div>

                    <div className="text-center text-xl sm:text-2xl font-bold text-lime-400 flex items-center justify-center gap-2">
                        <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>sentiment_very_satisfied</span>
                        {isPerfect ? "Amazing!" : "You're doing great!"}
                    </div>

                    {!deadlineHit && nextBadge && <NextBadge badge={nextBadge} />}

                    {isDeadlineClosed ? (
                        <div className="flex gap-4">
                            <Link
                                href="/student/dashboard"
                                className="flex-1 bg-primary text-on-primary font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined mr-2">home</span>Home
                            </Link>
                        </div>
                    ) : (
                        <div className="flex gap-4">
                            <button
                                onClick={() =>
                                    (window.location.href =
                                        window.location.origin +
                                        `/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${session.module_id}`)
                                }
                                className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest"
                            >
                                <span className="material-symbols-outlined mr-2">replay</span>Again
                            </button>
                            {!isMaxLevel && (nextModuleId ? (
                                <Link
                                    href={`/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${nextModuleId}`}
                                    className="flex-1 bg-primary text-on-primary font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined mr-2">arrow_forward</span>Next Level
                                </Link>
                            ) : (
                                <Link
                                    href="/student/readModeLevels"
                                    className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest text-center flex items-center justify-center"
                                >
                                    <span className="material-symbols-outlined mr-2" style={{ fontVariationSettings: "'FILL' 1" }}>menu_book</span>
                                    Levels
                                </Link>
                            ))}
                            <Link
                                href="/student/dashboard"
                                className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest text-center flex items-center justify-center"
                            >
                                <span className="material-symbols-outlined mr-2">home</span>Home
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );

    if (newBadges.length > 0 && !badgeFlowDone) {
        return (
            <div className="bg-background text-on-background font-body-md">
                <BadgeUnlockFlow badges={newBadges} onDone={() => setBadgeFlowDone(true)} />
            </div>
        );
    }

    return renderResults();
}
