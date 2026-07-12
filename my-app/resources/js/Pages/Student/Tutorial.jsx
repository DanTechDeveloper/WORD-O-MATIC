import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";

const BEFORE_STEPS = [
    {
        target: '[data-purpose="avatar-speech"]',
        title: "Hi there!",
        message: "I'm your Word Buddy! I'll help you learn new words!",
        emoji: "smart_toy",
        color: "accent",
    },
    {
        target: '[data-purpose="read-mode-selection"]',
        title: "WORD BLAST MODE!",
        message: "Tap the lime card to launch Word Blast!",
        emoji: "bolt",
        color: "accent",
    },
    {
        target: '[data-purpose="story-mode-locked"]',
        title: "STORY QUEST",
        message: "Locked for now — finish Word Blast to unlock me!",
        emoji: "lock",
        color: "quest",
    },
];

const AFTER_STEPS = (allDone) => [
    {
        target: '[data-purpose="avatar-speech"]',
        title: "AMAZING!",
        message: allDone
            ? "You completed both practices! You're ready!"
            : "You did it! Story Quest is waiting for you!",
        emoji: "celebration",
        color: "quest",
    },
    ...(allDone ? [] : [
        {
            target: '[data-purpose="story-mode-unlocked"]',
            title: "STORY QUEST",
            message: "Tap here to start your speaking adventure!",
        emoji: "auto_stories",
        color: "quest",
        },
    ]),
];

export default function Tutorial() {
    const { auth } = usePage().props;
    const params = new URLSearchParams(window.location.search);
    const practiceDone = params.get("practiceDone") === "1" || sessionStorage.getItem("practiceDone") === "1";
    const practiceSpeakDone = params.get("practiceSpeakDone") === "1" || sessionStorage.getItem("practiceSpeakDone") === "1";
    const allPracticeDone = practiceDone && practiceSpeakDone;

    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const steps = practiceDone ? AFTER_STEPS(allPracticeDone) : BEFORE_STEPS;
    const [stepIndex, setStepIndex] = useState(0);
    const [guideDone, setGuideDone] = useState(false);
    const [showBadgeModal, setShowBadgeModal] = useState(false);

    useEffect(() => {
        if (allPracticeDone && guideDone) {
            setShowBadgeModal(true);
        }
    }, [allPracticeDone, guideDone]);

    const step = guideDone ? null : steps[stepIndex];

    const isTarget = (purpose) => {
        if (!step) return false;
        return step.target === `[data-purpose="${purpose}"]`;
    };

    const guideLocked =
        !practiceDone && !guideDone && !isTarget("read-mode-selection");
    const wordBlastUnlocked =
        practiceDone || guideDone || isTarget("read-mode-selection");
    const storyQuestUnlocked =
        practiceDone && (guideDone || isTarget("story-mode-unlocked"));

    const advanceGuide = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            setGuideDone(true);
        }
    };

    const ringClass = (purpose) => {
        if (!isTarget(purpose)) return "";
        const c =
            step.color === "quest"
                ? "ring-4 ring-quest ring-offset-4 ring-offset-background scale-[1.03]"
                : step.color === "secondary"
                ? "ring-4 ring-secondary-container ring-offset-4 ring-offset-background scale-[1.03]"
                : "ring-4 ring-accent ring-offset-4 ring-offset-background scale-[1.03]";
        return `${c} z-10 rounded-2xl transition-all duration-500 animate-pulse motion-reduce:animate-none`;
    };

    return (
        <div className="m-0 p-0 overflow-hidden select-none min-h-screen w-full relative bg-background">
            {!guideDone && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
                    {steps.map((s, i) => {
                        const dot = s.color === "quest" ? "bg-quest" : s.color === "secondary" ? "bg-secondary-container" : "bg-accent";
                        return (
                            <div
                                key={i}
                                className={`w-3 h-3 rounded-full transition-all duration-500 ${
                                    i === stepIndex
                                        ? `${dot} scale-125`
                                        : i < stepIndex
                                          ? `${dot}/50`
                                          : "bg-on-surface/20"
                                }`}
                            />
                        );
                    })}
                </div>
            )}

            <main className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-background">
                {/* WORD BLAST MODE */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={
                            wordBlastUnlocked
                                ? "/student/practice/read"
                                : undefined
                        }
                        as={wordBlastUnlocked ? "a" : "div"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 border-b-4 md:border-b-0 border-surface-variant relative overflow-hidden bg-gradient-to-br from-accent/20 to-background ${wordBlastUnlocked && !practiceDone ? "" : "cursor-not-allowed"} ${ringClass(practiceDone ? "read-mode-locked" : "read-mode-selection")}`}
                        data-purpose={
                            practiceDone
                                ? "read-mode-locked"
                                : "read-mode-selection"
                        }
                    >
                        <div className="z-20 text-center flex flex-col items-center">
                            <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center transition-all duration-500 relative">
                                <span className="absolute -top-4 -right-4 material-symbols-outlined text-4xl text-on-surface">menu_book</span>
                                <span className="material-symbols-outlined text-5xl md:text-6xl text-on-surface">play_arrow</span>
                            </div>

                            <h2 className="text-on-surface text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                                WORD BLAST{" "}
                                <span className="text-accent">MODE</span>
                            </h2>
                            <p className="text-on-surface-variant text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Practice complete!"
                                    : "Power up your visual recognition!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-surface-container-high/80">
                            <div
                                className={`h-full bg-accent transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[65%] group-hover:w-full"}`}
                                data-purpose="read-mode-progress"
                            />
                        </div>
                    </Link>

                    {practiceDone && (
                        <div
                            className="absolute inset-0 z-30 bg-background/80 flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="read-mode-locked"
                        >
                            <span className="inline-flex items-center gap-1 text-on-surface text-xs font-black tracking-widest uppercase bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Complete
                            </span>
                        </div>
                    )}

                    {guideLocked && (
                        <div className="absolute inset-0 z-30 bg-background/70 flex flex-col items-center justify-center pointer-events-auto transition-all duration-500">
                            <span className="inline-flex items-center gap-1 text-on-surface-variant/60 text-xs font-black tracking-widest uppercase bg-surface-container-high/80 px-4 py-2 rounded-full border border-outline-variant">
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Wait for the guide
                            </span>
                        </div>
                    )}
                </div>

                {/* STORY QUEST MODE */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={
                            storyQuestUnlocked
                                ? "/student/practice/speak"
                                : undefined
                        }
                        as={storyQuestUnlocked ? "a" : "div"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 bg-gradient-to-br from-quest/15 to-background ${storyQuestUnlocked ? "" : "cursor-not-allowed"} ${ringClass(storyQuestUnlocked ? "story-mode-unlocked" : "story-mode-locked")}`}
                        data-purpose={
                            storyQuestUnlocked
                                ? "story-mode-unlocked"
                                : "story-mode-locked"
                        }
                    >
                        <div className="z-20 text-center flex flex-col items-center">
                            <div
                                className={`mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-surface-container-high border-2 border-outline-variant flex items-center justify-center transition-all duration-500 relative ${practiceDone ? "group-hover:scale-110" : ""}`}
                            >
                                <span className="absolute -top-4 -right-4 material-symbols-outlined text-4xl text-on-surface">auto_stories</span>
                                <span className="material-symbols-outlined text-5xl md:text-6xl text-on-surface">play_arrow</span>
                            </div>

                            <h2 className="text-on-surface text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                                STORY QUEST{" "}
                                <span className="text-quest">MODE</span>
                            </h2>
                            <p className="text-on-surface-variant text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Unlocked! Start your adventure!"
                                    : "Enter the Word-O-Matic adventure!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-surface-container-high/80">
                            <div
                                className={`h-full bg-quest transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[40%] group-hover:w-full"}`}
                            />
                        </div>
                    </Link>

                    {practiceSpeakDone ? (
                        <div
                            className="absolute inset-0 z-30 bg-background/80 flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="story-mode-done"
                        >
                            <span className="inline-flex items-center gap-1 text-on-surface text-xs font-black tracking-widest uppercase bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant">
                                <span className="material-symbols-outlined text-sm">check_circle</span>
                                Complete
                            </span>
                        </div>
                    ) : !practiceDone ? (
                        <div
                            className="absolute inset-0 z-30 bg-background/80 flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="story-mode-locked"
                        >
                            <span className="inline-flex items-center gap-1 text-on-surface text-xs font-black tracking-widest uppercase bg-surface-container-high px-4 py-2 rounded-full border border-outline-variant">
                                <span className="material-symbols-outlined text-sm">lock</span>
                                Locked During Tutorial
                            </span>
                        </div>
                    ) : !storyQuestUnlocked ? (
                        <div className="absolute inset-0 z-30 bg-background/70 flex flex-col items-center justify-center pointer-events-auto transition-all duration-500">
                            <span className="inline-flex items-center gap-1 text-on-surface-variant/60 text-xs font-black tracking-widest uppercase bg-surface-container-high/80 px-4 py-2 rounded-full border border-outline-variant">
                                <span className="material-symbols-outlined text-sm">visibility</span>
                                Wait for the guide
                            </span>
                        </div>
                    ) : null}
                </div>

                {/* AVATAR SPEECH BUBBLE GUIDE */}
                {bodyUrl && !guideDone && step && (
                    <div data-purpose="avatar-speech">
                        <AvatarSpeechBubble
                            emoji={step.emoji}
                            title={step.title}
                            message={step.message}
                            bodyUrl={bodyUrl}
                            color={step.color}
                            onClick={advanceGuide}
                            footerText={
                                stepIndex < steps.length - 1
                                    ? "Tap here to continue →"
                                    : "Tap to finish!"
                            }
                            position="bottom"
                        />
                    </div>
                )}

                {showBadgeModal && (
                    <BadgeUnlockModal
                        badge={{
                            name: 'Tutorial Complete',
                            description: 'Welcome aboard! Awarded for successfully completing the introductory guide.',
                            icon: 'rocket_launch',
                            slug: 'tutorial-complete',
                        }}
                        show={true}
                        onContinue={() => {
                            setShowBadgeModal(false);
                            localStorage.setItem('hasNewBadge', '1');
                        }}
                    />
                )}

                <div className={`fixed bottom-8 left-0 right-0 z-40 flex justify-center transition-all duration-500 ${guideDone && allPracticeDone && !showBadgeModal ? "" : "opacity-0 pointer-events-none"}`}>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem("practiceDone");
                            sessionStorage.removeItem("practiceSpeakDone");
                            router.post("/student/tutorial/complete");
                        }}
                        className="bg-secondary-container hover:bg-secondary-container/80 text-slate-950 px-10 py-4 rounded-2xl font-black text-lg tracking-widest uppercase transition-all hover:scale-105 active:scale-95 flex items-center gap-3 shadow-[0_6px_0_0_#4c1d95] cursor-pointer"
                    >
                        Continue to Dashboard
                        <span className="material-symbols-outlined text-2xl">home</span>
                    </button>
                </div>
            </main>
        </div>
    );
}
