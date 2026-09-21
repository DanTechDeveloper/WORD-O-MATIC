import { Head, Link, usePage, router } from "@inertiajs/react";
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
    tutorialSkipped = false,
}) {
    const { auth, flash } = usePage().props;
    const [guideStep, setGuideStep] = useState(wordTutorialDone ? 1 : 0);
    const [guideDone, setGuideDone] = useState(tutorialComplete || tutorialSkipped);
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");
    const newBadges = flash?.new_badges ?? [];
    const [badgeFlowDone, setBadgeFlowDone] = useState(false);
    const [showSkipConfirm, setShowSkipConfirm] = useState(false);
    const isOnboarding = !tutorialComplete && !tutorialSkipped;
    const showGuide = isOnboarding && bodyUrl;
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

    // ponytail: bounded highlight — static ring, no pulse, keeps focus without motion overload for K-5
    const ringMap = {
        read: "ring-4 ring-accent ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-colors duration-200 motion-reduce:transition-none",
        speak: "ring-4 ring-quest ring-offset-4 ring-offset-background scale-[1.03] z-10 rounded-2xl transition-colors duration-200 motion-reduce:transition-none",
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
            <Head title="Pick Your Game — Word-O-Matic">
                <meta name="description" content="Pick your game — Word Blast or Story Quest — on Word-O-Matic." />
            </Head>
            {newBadges.length > 0 && !badgeFlowDone && (
                <BadgeUnlockFlow
                    badges={newBadges}
                    markNewBadge={false}
                    onDone={() => {
                        setBadgeFlowDone(true);
                    }}
                />
            )}
            <DashboardLayout disableNav={showGuide}>
                <div className="flex flex-col py-6 sm:py-8 space-y-6 sm:space-y-8">
                <header className="relative z-10 text-center lg:text-left">
                    <h1 className="text-2xl xs:text-3xl sm:text-4xl lg:text-5xl font-black uppercase italic tracking-[-0.04em] text-on-surface">
                        Pick Your Game
                    </h1>
                    <p className="mt-2 text-on-surface-variant text-base lg:text-lg">
                        {tutorialComplete
                            ? "Two ways to play. Choose the adventure that fits your mood."
                            : tutorialSkipped
                              ? "Tutorial skipped — both games unlocked. Replay the tutorial to earn the badge!"
                              : "Complete the tutorial to unlock the full game!"}
                    </p>
                </header>

                {isOnboarding && (
                    <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <button
                            type="button"
                            onClick={() => setShowSkipConfirm(true)}
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-bold text-sm uppercase tracking-wider bg-surface-container-high text-on-surface border-2 border-outline/20 hover:bg-surface-container-highest transition-colors"
                        >
                            <span className="material-symbols-outlined text-lg">skip_next</span>
                            Skip Tutorial
                        </button>
                    </div>
                )}
                {tutorialSkipped && !tutorialComplete && (
                    <div className="relative z-10 flex flex-wrap items-center gap-3">
                        <Link
                            href="/student/tutorial"
                            data-sfx="major"
                            className="inline-flex items-center gap-2 rounded-xl px-5 py-3 font-black text-sm uppercase tracking-wider bg-amber-400 text-background border-2 border-amber-600/30 hover:brightness-110 transition-all"
                        >
                            <span className="material-symbols-outlined text-lg">school</span>
                            Replay Tutorial to earn badge
                        </Link>
                    </div>
                )}

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

                {showSkipConfirm && (
                    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
                        <div className="absolute inset-0 bg-background/80" onClick={() => setShowSkipConfirm(false)} />
                        <div className="relative bg-surface border-2 border-outline/20 rounded-2xl p-6 sm:p-8 max-w-md w-full shadow-[8px_8px_0_0_#4c1d95]">
                            <div className="flex items-center gap-3 mb-4">
                                <span className="material-symbols-outlined text-3xl text-amber-400" style={{ fontVariationSettings: "'FILL' 1" }}>warning</span>
                                <h3 className="text-on-surface font-black uppercase text-lg">Skip Tutorial?</h3>
                            </div>
                            <p className="text-on-surface-variant text-sm leading-relaxed">
                                If you skip, you can play <span className="font-bold text-on-surface">Word Blast</span> and <span className="font-bold text-on-surface">Story Quest</span> right away, but the <span className="font-bold text-amber-300">Tutorial Complete</span> badge will not be claimable. You can still earn it later by completing both tutorials via the <span className="font-bold">Tutorial</span> button.
                            </p>
                            <div className="mt-6 flex flex-col sm:flex-row gap-3">
                                <button
                                    type="button"
                                    onClick={() => setShowSkipConfirm(false)}
                                    className="flex-1 rounded-xl px-5 py-3 font-bold text-sm uppercase tracking-wider bg-surface-container-high text-on-surface border-2 border-outline/20 hover:bg-surface-container-highest transition-colors"
                                >
                                    Keep Tutorial
                                </button>
                                <button
                                    type="button"
                                    data-sfx="major"
                                    onClick={() => {
                                        setShowSkipConfirm(false);
                                        router.post(route("student.tutorial.skip"));
                                    }}
                                    className="flex-1 rounded-xl px-5 py-3 font-black text-sm uppercase tracking-wider bg-amber-400 text-background hover:brightness-110 transition-all"
                                >
                                    Skip — I understand
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <section className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
                    {MODES.map((m) => {
                        const s = MODE_STYLES[m.mode];
                        const p = points[m.mode];
                        const pct = p.total > 0 ? Math.min((p.earned / p.total) * 100, 100) : 0;
                        const isDimmed = showGuide && (
                            (m.mode === "read" && wordTutorialDone) ||
                            (m.mode === "speak" && !wordTutorialDone)
                        );
                        const blockTarget = showGuide && !guideDone;
                        const highlightClass = ringClass(m.mode);
                        return (
                            <Link
                                key={m.mode}
                                href={isDimmed || blockTarget ? undefined : m.href}
                                as={isDimmed || blockTarget ? "div" : "a"}
                                data-sfx="major"
                                aria-label={`Play ${m.title}`}
                                className={`group relative flex flex-col rounded-2xl bg-surface ${s.border} border-2 p-4 sm:p-6 lg:p-8 ${isDimmed || blockTarget ? "opacity-40 pointer-events-none select-none" : "tactile-card transition-transform duration-150 hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-secondary-container motion-reduce:transition-none motion-reduce:hover:translate-y-0 z-10"} ${highlightClass}`}
                            >
                                <div className="flex items-center gap-4 sm:gap-5">
                                    <div className={`w-16 h-16 sm:w-20 sm:h-20 lg:w-24 lg:h-24 shrink-0 rounded-2xl bg-background/40 border-2 ${s.border} flex items-center justify-center`}>
                                        <span
                                            className={`material-symbols-outlined text-3xl sm:text-4xl lg:text-5xl ${s.iconColor}`}
                                            style={{ fontVariationSettings: "'FILL' 1" }}
                                        >
                                            {s.icon}
                                        </span>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h2 className="text-xl sm:text-2xl lg:text-3xl font-black uppercase text-on-surface truncate">
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
