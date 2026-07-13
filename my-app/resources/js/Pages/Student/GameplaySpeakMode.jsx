import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useCallback, useEffect, useMemo } from "react";

import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";

export default function GameplaySpeakMode({ module }) {
    const speechRecognitionWords = useMemo(() => module?.words?.map((w) => w.word) ?? [], [module?.words]);

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
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
    } = useGameplayEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        moduleId: module?.id,
        saveEndpoint: "/student/saveParagraphProgress",
        getPoints: () => 1,
        onWordRecognized: (wordObj) => {
            if (wordObj) {
                router.post(
                    "/student/updateParagraphMastery",
                    { paragraph_word_id: wordObj.id, status: "mastered" },
                    { preserveScroll: true, preserveState: true },
                );
            }
        },
        onMispronounce: (wordObj) => {
            if (wordObj) {
                router.post(
                    "/student/updateParagraphMastery",
                    { paragraph_word_id: wordObj.id, status: "training" },
                    { preserveScroll: true, preserveState: true },
                );
            }
        },
    });

    const { permissionState, requestPermission } = useMicrophonePermission();

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState, setGameState]);

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, [setGameState]);

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
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
        matchMode: "sentence",
    });

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
            <DeniedModal gameState={gameState} />
            <GameplayHeader {...headerProps} />
            {gameState === "IDLE" && (
                <TapToStartOverlay color="quest" permissionState={permissionState} />
            )}
            <SpeakModeMainContent
                words={speechRecognitionWords}
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
                streakShake={streakShake}
            />
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                    color="quest"
                />
            </div>
        </div>
    );
}
