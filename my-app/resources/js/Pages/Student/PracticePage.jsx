import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router, usePage } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import { useState, useCallback, useMemo } from "react";

import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

const GUIDE_STEPS = {
    read: [
        {
            title: "READ THE WORD",
            message: "Say each word aloud into the mic. Read it right to BLAST it!",
            emoji: "📢",
            color: "lime",
        },
        {
            title: "BLAST & SCORE",
            message: "Blast words fast! Watch your score grow and your streak build!",
            emoji: "⚡",
            color: "lime",
        },
        {
            title: "KEEP MOVING",
            message: "Words auto-advance after 5 seconds. Try to read them before they go!",
            emoji: "⏱️",
            color: "lime",
        },
        {
            title: "TAP TO PLAY!",
            message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!",
            emoji: "🎤",
            color: "lime",
        },
    ],
    speak: [
        {
            title: "READ THE SENTENCE",
            message: "Say the whole sentence clearly, not just one word!",
            emoji: "📖",
            color: "lime",
        },
        {
            title: "WATCH IT LIGHT UP",
            message: "Each word highlights as it's recognized. Follow along!",
            emoji: "✨",
            color: "lime",
        },
        {
            title: "NO PRESSURE",
            message: "Take your time — there's no timer here!",
            emoji: "😊",
            color: "lime",
        },
        {
            title: "TAP TO PLAY!",
            message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!",
            emoji: "🎤",
            color: "lime",
        },
    ],
};

const CONTENT_COMPONENT = {
    read: ReadModeMainContent,
    speak: SpeakModeMainContent,
};

const OVERLAY_TEXT = {
    read: {
        title: "Tap to Practice",
        subtitle: "Tap the mic & read the words aloud!",
    },
    speak: {
        title: "Tap to Practice",
        subtitle: "Tap the mic & read the sentence aloud!",
    },
};

export default function PracticePage({ module, mode = "read" }) {
    const [stepIndex, setStepIndex] = useState(0);
    const [guideDone, setGuideDone] = useState(false);

    const { auth } = usePage().props;
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const steps = GUIDE_STEPS[mode];
    const step = guideDone ? null : steps[stepIndex];
    const ContentComponent = CONTENT_COMPONENT[mode];
    const overlay = OVERLAY_TEXT[mode];
    const isReadMode = mode === "read";

    const wordsForContent = useMemo(() => {
        if (mode === "speak") {
            return (module?.words?.map((w) => w.word) ?? []);
        }
        return module?.words;
    }, [module, mode]);

    const advanceGuide = () => {
        if (stepIndex < steps.length - 1) {
            setStepIndex(stepIndex + 1);
        } else {
            setGuideDone(true);
        }
    };

    const navigateAway = useCallback(() => {
        sessionStorage.setItem("practiceDone", "1");
        if (!isReadMode) {
            sessionStorage.setItem("practiceSpeakDone", "1");
        }
        router.visit("/student/tutorial");
    }, [isReadMode]);

    const {
        totalWords,
        gameState,
        setGameState,
        currentWordIndex,
        wordsSmashed,
        currentStreak,
        isMispronounced,
        isExploding,
        showPointsFeedback,
        pointsFeedbackValue,
        scoreEmphasize,
        feedbackType,
        feedbackMessage,
        streakShake,
        countdownValue,
        targetWord,
        isWordReady,
        startGame,
        handleWordRecognized,
        handleMispronounce,
    } = useGameplayEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        getPoints: () => 1,
        onComplete: navigateAway,
        onTimeUp: navigateAway,
    });

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, [setGameState]);

    const handleMicrophoneClick = useCallback(() => {
        if (gameState === "IDLE") startGame();
    }, [gameState, startGame]);

    useSpeechRecognition({
        isActive: gameState === "ACTIVE" || gameState === "COUNTDOWN",
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
        matchMode: isReadMode ? "word" : "sentence",
    });

    const shakeClass = streakShake
        ? `animate-streak-shake-${streakShake}`
        : "";

    const headerProps = {
        level: isReadMode ? "Practice Mode" : "Practice Story Quest",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        onTimeUp: navigateAway,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
    };

    return (
        <div className={`bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden relative ${shakeClass}`}>
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

            <DeniedModal gameState={gameState} />

            <div data-purpose="gameplay-header">
                <GameplayHeader {...headerProps} />
            </div>

            <div data-purpose="word-display" className="flex-1 flex">
                <ContentComponent
                    words={wordsForContent}
                    currentIndex={Math.min(currentWordIndex, totalWords - 1)}
                    gameState={gameState}
                    countdownValue={countdownValue}
                    isExploding={isExploding}
                    isMispronounced={isMispronounced}
                    showPointsFeedback={showPointsFeedback}
                    pointsFeedbackValue={pointsFeedbackValue}
                    streak={currentStreak}
                    feedbackType={feedbackType}
                    feedbackMessage={feedbackMessage}
                    isWordReady={isWordReady}
                />
            </div>

            {gameState === "IDLE" && guideDone && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-end pb-[110px] sm:pb-[140px] md:pb-[160px]">
                    <div className="flex flex-col items-center justify-center animate-bounce scale-90 sm:scale-100">
                        <div className="bg-lime-400 text-slate-950 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-[2rem] shadow-[0_0_30px_rgba(163,230,53,0.4)] sm:shadow-[0_0_40px_rgba(163,230,53,0.4)] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter">
                            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-0 sm:mb-1">
                                touch_app
                            </span>
                            <span className="text-lg sm:text-xl leading-none">
                                {overlay.title}
                            </span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] opacity-70 mt-1">
                                {overlay.subtitle}
                            </span>
                        </div>
                        <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-r-[15px] sm:border-r-[20px] border-t-[20px] sm:border-t-[25px] border-l-transparent border-r-transparent border-t-white -mt-1 drop-shadow-2xl"></div>
                    </div>
                </div>
            )}

            {bodyUrl && !guideDone && step && (
                <div
                    className="fixed z-50 bottom-8 right-6 flex flex-col items-center gap-4"
                    data-purpose="avatar-speech"
                >
                    <button
                        onClick={advanceGuide}
                        className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-5 shadow-2xl border-2 border-lime-400 min-w-[260px] max-w-[360px] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 text-center animate-fade-in"
                    >
                        <p className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center justify-center gap-2">
                            <span className="text-3xl">{step.emoji}</span>
                            {step.title}
                        </p>
                        <p className="text-base font-bold text-zinc-600 mt-2 leading-snug">
                            {step.message}
                        </p>
                        <p className="text-xs font-black uppercase tracking-wider text-lime-600 mt-4">
                            {stepIndex < steps.length - 1
                                ? "Tap here to continue →"
                                : "Tap to finish! ✨"}
                        </p>
                    </button>
                    <img
                        src={bodyUrl}
                        alt="Your Avatar"
                        className="w-48 h-auto md:w-64 lg:w-80 object-contain drop-shadow-[0_0_80px_rgba(163,230,53,0.35)] animate-bounce-slow"
                    />
                </div>
            )}

            <div className="flex-shrink-0 relative z-50" data-purpose="microphone-button">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                />
            </div>
        </div>
    );
}
