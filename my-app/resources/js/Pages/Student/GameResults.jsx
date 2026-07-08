import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";

function Stars({ filled, total }) {
    return (
        <div className="flex justify-center gap-2">
            {Array.from({ length: total }, (_, i) => (
                <span
                    key={i}
                    className={`text-4xl sm:text-5xl ${i < filled ? "opacity-100" : "opacity-20"}`}
                >
                    ⭐
                </span>
            ))}
        </div>
    );
}

function NextBadge({ badge }) {
    const pct = badge.threshold > 0 ? Math.min((badge.current_value / badge.threshold) * 100, 100) : 0;
    const nearComplete = pct >= 80;
    return (
        <div className="bg-surface-container rounded-2xl p-5 border border-surface-variant/20 flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center text-4xl flex-shrink-0 border border-primary/20">
                {badge.icon}
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-on-surface mb-2 truncate">
                    Next: {badge.name}
                </div>
                <div className="h-4 bg-background rounded-full overflow-hidden border border-surface-variant/10">
                    <div
                        className="h-full rounded-full transition-all duration-1000"
                        style={{
                            width: `${pct}%`,
                            background: nearComplete
                                ? "linear-gradient(90deg, #d1bcff, #bcff00)"
                                : "linear-gradient(90deg, #d1bcff, #7000ff)",
                        }}
                    />
                </div>
            </div>
            {nearComplete && <span className="text-2xl">✨</span>}
        </div>
    );
}

export default function GameResults({
    session,
    moduleTitle,
    totalItems,
    badgeProgress,
}) {
    const displayScore = parseInt(session.score) || 0;
    const accuracyPct = parseFloat(session.accuracy) || 0;
    const starScore = Math.round((accuracyPct / 100) * totalItems);
    const isPerfect = accuracyPct >= 100;
    const { flash } = usePage().props;
    const newBadgeSlugs = flash?.new_badges?.map(b => b.slug) ?? [];
    const newBadges = badgeProgress?.filter(b => newBadgeSlugs.includes(b.slug)) ?? [];
    const [badgeIndex, setBadgeIndex] = useState(0);

    const nextBadge = badgeProgress?.filter((b) => !b.is_earned).sort((a, b) => {
        const ap = a.threshold > 0 ? (a.current_value / a.threshold) : 0;
        const bp = b.threshold > 0 ? (b.current_value / b.threshold) : 0;
        return bp - ap;
    })[0] ?? null;

    const done = badgeIndex >= newBadges.length;
    if (done && newBadges.length > 0) {
        localStorage.setItem('hasNewBadge', '1');
    }

    const renderResults = () => (
        <div className="bg-background text-on-background font-body-md">
            <div className="relative min-h-screen flex flex-col items-center justify-center px-6 py-12">
                <div className="absolute top-1/2 left-1/4 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-primary/10 blur-[120px] rounded-full -z-10 animate-pulse" />

                {isPerfect && (
                    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
                        {["🎉","⭐","✨","🌟","🎊","💫","🔥"].map((e, i) => (
                            <span
                                key={i}
                                className="absolute text-3xl animate-bounce"
                                style={{
                                    left: `${10 + i * 12}%`,
                                    top: `${-10 - i * 5}%`,
                                    animationDelay: `${i * 0.15}s`,
                                    animationDuration: `${1 + (i % 3) * 0.5}s`,
                                }}
                            >
                                {e}
                            </span>
                        ))}
                    </div>
                )}
                <div className="w-full max-w-lg mx-auto flex flex-col gap-8 animate-fade-in">
                    <div className="text-center">
                        <h1 className="text-6xl sm:text-7xl font-black text-primary uppercase leading-tight">
                            {isPerfect ? "PERFECT!" : "GREAT JOB!"}
                        </h1>
                        <p className="text-lg font-bold text-on-surface-variant uppercase tracking-wider mt-2">
                            {moduleTitle}
                        </p>
                    </div>

                    <Stars filled={starScore} total={totalItems} />

                    <div className="flex gap-4">
                        <div className="flex-1 bg-surface-container rounded-2xl py-6 px-4 text-center border border-surface-variant/20">
                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                                Score
                            </div>
                            <div className="text-5xl sm:text-6xl font-black text-lime-400">
                                {displayScore}
                            </div>
                        </div>
                        <div className="flex-1 bg-surface-container rounded-2xl py-6 px-4 text-center border border-surface-variant/20">
                            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">
                                Words
                            </div>
                            <div className="text-5xl sm:text-6xl font-black text-on-surface">
                                {totalItems}
                            </div>
                        </div>
                    </div>

                    <div className="text-center text-xl sm:text-2xl font-bold text-lime-400">
                        😊 {isPerfect ? "Amazing!" : "You're doing great!"}
                    </div>

                    {nextBadge && <NextBadge badge={nextBadge} />}

                    <div className="flex gap-4">
                        <button
                            onClick={() =>
                                (window.location.href =
                                    window.location.origin +
                                    `/student/gameplay${session.module_type === "word" ? "Read" : "Speak"}Mode/${session.module_id}`)
                            }
                            className="flex-1 bg-surface-container-high text-on-surface font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:bg-surface-container-highest"
                        >
                            🔄 Again
                        </button>
                        <Link
                            href="/student/dashboard"
                            className="flex-1 bg-primary text-on-primary font-bold py-5 rounded-2xl border border-surface-variant/20 text-base uppercase tracking-wider active:scale-[0.97] transition-all hover:brightness-110 text-center"
                        >
                            🏠 Home
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );

    if (newBadges.length > 0 && badgeIndex < newBadges.length) {
        return (
            <div className="bg-background text-on-background font-body-md">
                <BadgeUnlockModal
                    badge={newBadges[badgeIndex]}
                    show={true}
                    onContinue={() => setBadgeIndex(i => i + 1)}
                />
            </div>
        );
    }

    return renderResults();
}
