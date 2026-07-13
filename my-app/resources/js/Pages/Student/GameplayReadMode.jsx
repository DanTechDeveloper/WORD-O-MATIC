import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useEffect, useCallback } from "react";
import { router } from "@inertiajs/react";
import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";

export default function GameplayReadMode({ module }) {
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
        isWordReady,
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
        saveEndpoint: "/student/saveWordProgress",
        onWordRecognized: (wordObj) => {
            if (wordObj) {
                router.post(
                    "/student/updateWordMastery",
                    { word_id: wordObj.id, status: "mastered" },
                    { preserveScroll: true, preserveState: true },
                );
            }
        },
        onMispronounce: (wordObj) => {
            if (wordObj) {
                router.post(
                    "/student/updateWordMastery",
                    { word_id: wordObj.id, status: "training" },
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
        onRecognitionError: (err) => console.error("Recognition error:", err),
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
            <ReadModeMainContent
                words={module?.words}
                currentIndex={Math.max(
                    0,
                    Math.min(currentWordIndex, totalWords - 1),
                )}
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
                streakShake={streakShake}
            />
            {gameState === "IDLE" && (
                <TapToStartOverlay
                    color="accent"
                    permissionState={permissionState}
                />
            )}
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                    color="accent"
                />
            </div>
        </div>
    );
}
