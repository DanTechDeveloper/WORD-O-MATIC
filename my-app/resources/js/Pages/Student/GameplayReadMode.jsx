import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useEffect, useCallback, useState } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";

const GUIDE_STEPS = [
    { title: "READ THE WORD", message: "Say each word aloud into the mic. Read it right to BLAST it!", emoji: "campaign", color: "accent" },
    { title: "BLAST & SCORE", message: "Blast words fast! Watch your score grow and your streak build!", emoji: "bolt", color: "accent" },
    { title: "TAP TO PLAY!", message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!", emoji: "mic", color: "accent" },
];

export default function GameplayReadMode({ module, tutorialComplete = true }) {
    const { auth } = usePage().props;
    const isTutorial = !!module?.is_tutorial && !tutorialComplete;

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
            if (wordObj && !isTutorial) {
                axios.post("/student/updateWordMastery", {
                    word_id: wordObj.id,
                    status: "mastered",
                });
            }
        },
        onMispronounce: (wordObj) => {
            if (wordObj && !isTutorial) {
                axios.post("/student/updateWordMastery", {
                    word_id: wordObj.id,
                    status: "training",
                });
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
    const [guideStep, setGuideStep] = useState(0);
    const [guideDone, setGuideDone] = useState(!isTutorial);
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const advanceGuide = () => {
        if (guideStep < GUIDE_STEPS.length - 1) {
            setGuideStep(guideStep + 1);
        } else {
            setGuideDone(true);
        }
    };

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
        mode: "read",
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
            <DeniedModal gameState={gameState} />
            {isTutorial && !guideDone && bodyUrl && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
                    {GUIDE_STEPS.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i === guideStep ? "bg-accent scale-125" : i < guideStep ? "bg-accent/50" : "bg-on-surface/20"}`} />
                    ))}
                </div>
            )}
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
            {isTutorial && !guideDone && bodyUrl && (
                <AvatarSpeechBubble
                    emoji={GUIDE_STEPS[guideStep].emoji}
                    title={GUIDE_STEPS[guideStep].title}
                    message={GUIDE_STEPS[guideStep].message}
                    bodyUrl={bodyUrl}
                    color="accent"
                    onClick={advanceGuide}
                    position="bottom-right"
                    footerText={guideStep < GUIDE_STEPS.length - 1 ? "Tap here to continue →" : "Tap to finish!"}
                />
            )}
            {gameState === "IDLE" && guideDone && (
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
