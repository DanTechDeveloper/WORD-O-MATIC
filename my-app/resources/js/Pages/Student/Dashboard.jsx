import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import BadgeUnlockFlow from "@/Components/Student/BadgeUnlockFlow";
import ProgressBar from "@/Components/Student/ProgressBar";
import DashboardLayout from "../../Layouts/Student/DashboardLayout";

const MODE_STYLES = {
    read: {
        icon: "menu_book",
        iconColor: "text-accent",
        border: "border-accent/40",
        barFill: "bg-accent",
        pointsColor: "text-accent",
        playBg: "bg-accent text-background",
    },
    speak: {
        icon: "mic",
        iconColor: "text-quest",
        border: "border-quest/40",
        barFill: "bg-quest",
        pointsColor: "text-quest",
        playBg: "bg-quest text-background",
    },
};

const MODES = [
    {
        mode: "read",
        title: "Word Blast",
        sub: "Explore Galaxies",
        desc: "Smash words and build your vocabulary in this galactic adventure!",
        href: "/student/readModeLevels",
    },
    {
        mode: "speak",
        title: "Story Quest",
        sub: "Speak Stories",
        desc: "Read aloud and bring stories to life in your own voice!",
        href: "/student/speakModeLevels",
    },
];

export default function Dashboard({
    totalReadPoints,
    totalSpeakPoints,
    earnedReadPoints,
    earnedSpeakPoints,
    wordTutorialDone = false,
    speakTutorialDone = false,
    tutorialComplete = false,
}) {
    const { auth, flash } = usePage().props;
    const [guideStep, setGuideStep] = useState(wordTutorialDone ? 1 : 0);
    const [guideDone, setGuideDone] = useState(tutorialComplete);
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");
    const newBadges = flash?.new_badges ?? [];
    const showGuide = !tutorialComplete && bodyUrl;
    const showGuideBubble = showGuide && !guideDone;
    const highlightRead = showGuide && !wordTutorialDone;
    const highlightSpeak = showGuide && wordTutorialDone && !speakTutorialDone;

    const guideSteps = [
        {
            title: "Start Here!",
            message: "Tap Word Blast Level 1 to start!",
            emoji: "bolt",
            color: "accent",
        },
        {
            title: "Next Up!",
            message: "Try Story Quest Level 1! Speak aloud!",
            emoji: "auto_stories",
            color: "quest",
        },
    ];
    const maxStep = wordTutorialDone ? 1 : 0;
    const currentStep = guideSteps[guideStep] || guideSteps[0];

    const advanceGuide = () => {
        if (guideStep < maxStep) {
            setGuideStep(guideStep + 1);
        } else {
            setGuideDone(true);
        }
    };

    const ringMap = {
        read: "ring-4 ring-accent ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-all duration-500 animate-pulse motion-reduce:animate-none",
        speak: "ring-4 ring-quest ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-all duration-500 animate-pulse motion-reduce:animate-none",
    };
    const ringClass = (targetMode) => {
        const isHighlight = targetMode === "read" ? highlightRead : highlightSpeak;
        if (!isHighlight) return "";
        return ringMap[targetMode];
    };

    const points = {
        read: { earned: earnedReadPoints || 0, total: totalReadPoints || 0 },
        speak: { earned: earnedSpeakPoints || 0, total: totalSpeakPoints || 0 },
    };

    return (
        <>
            {newBadges.length > 0 && (
                <BadgeUnlockFlow badges={newBadges} markNewBadge={false} />
            )}
            <DashboardLayout disableNav={showGuide}>
                <div className="flex flex-col justify-center py-10 lg:py-14 space-y-8">
                <header className="text-center lg:text-left">
                    <h1 className="text-4xl lg:text-5xl font-black uppercase italic tracking-[-0.04em] text-on-surface">
                        Pick Your Game
                    </h1>
                    <p className="mt-2 text-on-surface-variant text-base lg:text-lg">
                        {tutorialComplete
                            ? "Two ways to play. Choose the adventure that fits your mood."
                            : "Complete the tutorial to unlock the full game!"}
                    </p>
                </header>

                {showGuide && <div className="fixed inset-0 z-[5] bg-background/80" />}
                {showGuideBubble && (
                    <AvatarSpeechBubble
                        emoji={currentStep.emoji}
                        title={currentStep.title}
                        message={currentStep.message}
                        bodyUrl={bodyUrl}
                        color={currentStep.color}
                        onClick={advanceGuide}
                        position={highlightRead ? "bottom-right" : "bottom-left"}
                    />
                )}

                <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {MODES.map((m) => {
                        const s = MODE_STYLES[m.mode];
                        const p = points[m.mode];
                        const pct = p.total > 0 ? Math.min((p.earned / p.total) * 100, 100) : 0;
                        const isDimmed = showGuide && (
                            (m.mode === "read" && wordTutorialDone) ||
                            (m.mode === "speak" && !wordTutorialDone)
                        );
                        const highlightClass = ringClass(m.mode);
                        return (
                            <Link
                                key={m.mode}
                                href={isDimmed ? undefined : m.href}
                                as={isDimmed ? "div" : "a"}
                                data-sfx="major"
                                aria-label={`Play ${m.title}`}
                                className={`group relative flex flex-col rounded-2xl bg-surface ${s.border} border-2 p-6 lg:p-8 ${isDimmed ? "opacity-40 pointer-events-none select-none" : "tactile-card transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-container motion-reduce:transition-none motion-reduce:hover:translate-y-0 z-10"} ${highlightClass}`}
                            >
                                <div className="flex items-center gap-5">
                                    <div className={`w-20 h-20 lg:w-24 lg:h-24 shrink-0 rounded-2xl bg-background/40 border-2 ${s.border} flex items-center justify-center`}>
                                        <span
                                            className={`material-symbols-outlined text-4xl lg:text-5xl ${s.iconColor}`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            {s.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1">
                                        <h2 className="text-2xl lg:text-3xl font-black uppercase text-on-surface">
                                            {m.title}
                                        </h2>
                                        <p className="text-on-surface-variant text-sm font-bold mt-1">
                                            {m.sub}
                                        </p>
                                    </div>
                                </div>

                                <p className="mt-4 text-on-surface-variant text-sm lg:text-base">
                                    {m.desc}
                                </p>

                                <div className="mt-6">
                                    <span
                                        className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 lg:px-8 lg:py-4 font-black text-base lg:text-lg uppercase tracking-wider shadow-[0_6px_0_0_#4c1d95] group-active:shadow-[0_2px_0_0_#4c1d95] group-active:translate-y-1 transition-all duration-150 motion-reduce:transition-none motion-reduce:group-active:translate-y-0 ${s.playBg}`}
                                    >
                                        <span
                                            className="material-symbols-outlined text-2xl"
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            play_arrow
                                        </span>
                                        Play
                                    </span>
                                </div>

                                <div className="mt-6">
                                    <div className="flex items-center justify-between text-sm mb-1">
                                        <span className="text-on-surface-variant font-bold uppercase tracking-wider">
                                            Points Earned
                                        </span>
                                        <span className={`font-black text-base ${s.pointsColor}`}>
                                            {p.total > 0 ? `${p.earned}/${p.total}` : "Not started"}
                                        </span>
                                    </div>
                                    <ProgressBar value={pct} barClassName={s.barFill} />
                                </div>
                            </Link>
                        );
                    })}
                </section>
            </div>
            </DashboardLayout>
        </>
    );
}
