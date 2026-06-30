import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useState } from "react";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import BadgeUnlockModal from "@/Components/Student/BadgeUnlockModal";

const BEFORE_STEPS = [
    {
        target: '[data-purpose="avatar-speech"]',
        title: "Hi there!",
        message: "I'm your robot buddy! I'll help you learn new words!",
        emoji: "🤖",
        color: "lime",
    },
    {
        target: '[data-purpose="read-mode-selection"]',
        title: "WORD BLAST MODE!",
        message: "Tap the purple card to start your first game!",
        emoji: "⚡",
        color: "purple",
    },
    {
        target: '[data-purpose="story-mode-locked"]',
        title: "STORY QUEST",
        message: "This is locked for now. Finish Word Blast first!",
        emoji: "🔒",
        color: "lime",
    },
];

const AFTER_STEPS = (allDone) => [
    {
        target: '[data-purpose="avatar-speech"]',
        title: "AMAZING!",
        message: allDone
            ? "You completed both practices! You're ready!"
            : "You did it! Story Quest is waiting for you!",
        emoji: "🎉",
        color: "lime",
    },
    ...(allDone ? [] : [
        {
            target: '[data-purpose="story-mode-unlocked"]',
            title: "STORY QUEST",
            message: "Tap here to start your reading adventure!",
            emoji: "📖",
            color: "lime",
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
            step.color === "purple"
                ? "ring-4 ring-purple-400 ring-offset-4 ring-offset-zinc-950 scale-[1.03]"
                : "ring-4 ring-lime-400 ring-offset-4 ring-offset-zinc-950 scale-[1.03]";
        return `${c} z-10 rounded-2xl transition-all duration-500 animate-pulse`;
    };

    return (
        <div className="m-0 p-0 overflow-hidden select-none min-h-screen w-full relative bg-zinc-950">
            {/* PROGRESS DOTS */}
            {!guideDone && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
                    {steps.map((_, i) => (
                        <div
                            key={i}
                            className={`w-3 h-3 rounded-full transition-all duration-500 ${
                                i === stepIndex
                                    ? "bg-lime-400 scale-125"
                                    : i < stepIndex
                                      ? "bg-lime-400/50"
                                      : "bg-white/20"
                            }`}
                        />
                    ))}
                </div>
            )}

            <main className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-zinc-950">
                {/* WORD BLAST MODE */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={
                            wordBlastUnlocked
                                ? "/student/practice/read"
                                : undefined
                        }
                        as={wordBlastUnlocked ? "a" : "div"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 border-b-4 md:border-b-0 md:border-r-4 border-zinc-900 relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-zinc-950 ${wordBlastUnlocked && !practiceDone ? "" : "cursor-not-allowed"} ${ringClass(practiceDone ? "read-mode-locked" : "read-mode-selection")}`}
                        data-purpose={
                            practiceDone
                                ? "read-mode-locked"
                                : "read-mode-selection"
                        }
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        <div className="z-20 text-center flex flex-col items-center">
                            <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center transition-all duration-500 relative">
                                <span className="absolute -top-4 -right-4 text-4xl">
                                    📖
                                </span>
                                <svg
                                    className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                                WORD BLAST{" "}
                                <span className="text-purple-500">MODE</span>
                            </h2>
                            <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Practice complete!"
                                    : "Power up your visual recognition!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                            <div
                                className={`h-full bg-purple-600 transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[65%] group-hover:w-full"}`}
                                data-purpose="read-mode-progress"
                            />
                        </div>
                    </Link>

                    {practiceDone && (
                        <div
                            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="read-mode-locked"
                        >
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Complete ✅
                            </span>
                        </div>
                    )}

                    {guideLocked && (
                        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center pointer-events-auto transition-all duration-500">
                            <span className="text-white/50 text-xs font-black tracking-widest uppercase bg-zinc-900/80 px-4 py-2 rounded-full border border-white/10">
                                Wait for the guide 👀
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
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 bg-gradient-to-br from-lime-900/20 to-zinc-950 ${storyQuestUnlocked ? "" : "cursor-not-allowed"} ${ringClass(storyQuestUnlocked ? "story-mode-unlocked" : "story-mode-locked")}`}
                        data-purpose={
                            storyQuestUnlocked
                                ? "story-mode-unlocked"
                                : "story-mode-locked"
                        }
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        <div className="z-20 text-center flex flex-col items-center">
                            <div
                                className={`mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center transition-all duration-500 relative ${practiceDone ? "group-hover:scale-110" : ""}`}
                            >
                                <span className="absolute -top-4 -right-4 text-4xl">
                                    🎭
                                </span>
                                <svg
                                    className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                                STORY QUEST{" "}
                                <span className="text-lime-400">MODE</span>
                            </h2>
                            <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Unlocked! Start your adventure!"
                                    : "Enter the Word-O-Matic adventure!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                            <div
                                className={`h-full bg-lime-400 transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[40%] group-hover:w-full"}`}
                            />
                        </div>
                    </Link>

                    {practiceSpeakDone ? (
                        <div
                            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="story-mode-done"
                        >
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Complete ✅
                            </span>
                        </div>
                    ) : !practiceDone ? (
                        <div
                            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="story-mode-locked"
                        >
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Locked During Tutorial 🔒
                            </span>
                        </div>
                    ) : !storyQuestUnlocked ? (
                        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[4px] flex flex-col items-center justify-center pointer-events-auto transition-all duration-500">
                            <span className="text-white/50 text-xs font-black tracking-widest uppercase bg-zinc-900/80 px-4 py-2 rounded-full border border-white/10">
                                Wait for the guide 👀
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
                            onClick={advanceGuide}
                            footerText={
                                stepIndex < steps.length - 1
                                    ? "Tap here to continue →"
                                    : "Tap to finish! ✨"
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
                            icon: '🚀',
                            slug: 'tutorial-complete',
                        }}
                        show={true}
                        onContinue={() => router.post("/student/tutorial/complete")}
                    />
                )}
            </main>
        </div>
    );
}
