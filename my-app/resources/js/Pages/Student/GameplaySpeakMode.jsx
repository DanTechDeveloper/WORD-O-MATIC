import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useCallback } from "react";

import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    const speechRecognitionWords = module?.words?.map((w) => w.word) ?? [];

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

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, [setGameState]);

    const handleMicrophoneClick = useCallback(() => {
        if (gameState === "IDLE") {
            startGame();
        }
    }, [gameState, startGame]);

    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
        matchMode: "sentence",
    });

    const shakeClass = streakShake
        ? `animate-streak-shake-${streakShake}`
        : "";

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
        <div className={`bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden ${shakeClass}`}>
            <DeniedModal gameState={gameState} />
            <GameplayHeader {...headerProps} />
            {gameState === "IDLE" && (
                <TapToStartOverlay color="sky" />
            )}
            <SpeakModeMainContent
                words={speechRecognitionWords}
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
            />
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                />
            </div>
        </div>
    );
}
