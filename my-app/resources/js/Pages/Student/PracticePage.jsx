import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import { router, usePage } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useState, useCallback, useMemo, useEffect } from "react";

import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";

const GUIDE_STEPS = {
    read: [
        {
            title: "READ THE WORD",
            message: "Say each word aloud into the mic. Read it right to BLAST it!",
            emoji: "campaign",
            color: "accent",
        },
        {
            title: "BLAST & SCORE",
            message: "Blast words fast! Watch your score grow and your streak build!",
            emoji: "bolt",
            color: "accent",
        },
        {
            title: "KEEP MOVING",
            message: "Words auto-advance after 5 seconds. Try to read them before they go!",
            emoji: "timer",
            color: "accent",
        },
        {
            title: "TAP TO PLAY!",
            message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!",
            emoji: "mic",
            color: "accent",
        },
    ],
    speak: [
        {
            title: "READ THE SENTENCE",
            message: "Say the whole sentence clearly, not just one word!",
            emoji: "menu_book",
            color: "quest",
        },
        {
            title: "WATCH IT LIGHT UP",
            message: "Each word highlights as it's recognized. Follow along!",
            emoji: "auto_awesome",
            color: "quest",
        },
        {
            title: "NO PRESSURE",
            message: "Take your time — there's no timer here!",
            emoji: "mood",
            color: "quest",
        },
        {
            title: "TAP TO PLAY!",
            message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!",
            emoji: "mic",
            color: "quest",
        },
    ],
};

const CONTENT_COMPONENT = {
    read: ReadModeMainContent,
    speak: SpeakModeMainContent,
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

    const { permissionState, requestPermission } = useMicrophonePermission();

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState, setGameState]);

    const handleMicrophoneClick = useCallback(async () => {
        if (gameState === "IDLE") {
            if (permissionState === "prompt") {
                const granted = await requestPermission();
                if (!granted) return;
            }
            startGame();
        }
    }, [gameState, permissionState, requestPermission, startGame]);

    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: () => setGameState("DENIED"),
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
                                ? (isReadMode ? "bg-accent scale-125" : "bg-quest scale-125")
                                : i < stepIndex
                                  ? (isReadMode ? "bg-accent/50" : "bg-quest/50")
                                  : "bg-on-surface/20"
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
                    currentIndex={Math.max(0, Math.min(currentWordIndex, totalWords - 1))}
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
                <TapToStartOverlay
                    color={isReadMode ? "accent" : "quest"}
                    permissionState={permissionState}
                />
            )}

            {bodyUrl && !guideDone && step && (
                <div data-purpose="avatar-speech">
                    <AvatarSpeechBubble
                        emoji={step.emoji}
                        title={step.title}
                        message={step.message}
                        bodyUrl={bodyUrl}
                        color={step.color}
                        onClick={advanceGuide}
                        position="bottom-right"
                        footerText={
                            stepIndex < steps.length - 1
                                ? "Tap here to continue →"
                                : "Tap to finish!"
                        }
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
