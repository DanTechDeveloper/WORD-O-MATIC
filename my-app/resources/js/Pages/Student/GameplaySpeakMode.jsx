import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import GameOverModal from "@/Components/Student/GameOverModal";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED, GAMEOVER
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    const [scoreEmphasize, setScoreEmphasize] = useState(false);

    const hasSaved = useRef(false);

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

    const updateAudioSetting = useCallback((key, value) => {
        setAudioSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    // Split the content into individual words
    const words = useMemo(
        () => (module?.content ? module.content.split(/\s+/) : []),
        [module?.content],
    );
    const totalWords = words.length;

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => prev + 1);
    }, []);

    const handleWordRecognized = useCallback(() => {
        const points = 1; // Standard point for speak mode words
        setCurrentScore((prev) => prev + points);
        setWordsSmashed((prev) => prev + 1);

        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        setTimeout(() => setScoreEmphasize(false), 500);

        moveToNextWord();
    }, [moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        // Note: Paragraph mode does not have individual word mastery tracking
        // in the current DB schema, so we skip the updateWordMastery call.

        setIsMispronounced(true);
        // Give the user time to see the "shake" animation
        setTimeout(() => {
            if (gameState === "ACTIVE") {
                setIsMispronounced(false);
                moveToNextWord();
            }
        }, 500);
    }, [moveToNextWord, gameState]);

    // Evaluate game state when all words are processed
    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            if (!hasSaved.current && wordsSmashed > 0) {
                hasSaved.current = true;
                router.post(
                    "/student/saveParagraphProgress",
                    {
                        module_id: module.id,
                        words_smashed: wordsSmashed,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () =>
                            console.log("Paragraph progress saved!"),
                    },
                );
            }

            const timer = setTimeout(() => {
                const finalState = wordsSmashed > 0 ? "COMPLETED" : "GAMEOVER";
                setGameState(finalState);
            }, 1200);
            return () => clearTimeout(timer);
        }
    }, [currentWordIndex, totalWords, wordsSmashed, gameState, module.id]);

    // 1. Microphone Permission Hook
    const { permissionState, requestPermission } = useMicrophonePermission();

    // Function to initiate game start, now using the permission hook
    const initiateGameStart = useCallback(async () => {
        if (permissionState === "granted") {
            setGameState("COUNTDOWN");
        } else {
            const granted = await requestPermission();
            if (granted) {
                setGameState("COUNTDOWN");
            } else {
                setGameState("DENIED");
            }
        }
    }, [permissionState, requestPermission]);

    // Permission check on mount: If already granted, start countdown.word
    // Otherwise, handle initial permission prompt.
    useEffect(() => {
        if (gameState === "IDLE") {
            initiateGameStart();
        }
    }, [initiateGameStart, gameState]);

    const handleOpenSettings = useCallback(() => {
        setIsSettingsOpen(true);
    }, []);

    const handleTimeUp = useCallback(() => {
        if (!hasSaved.current && wordsSmashed > 0) {
            hasSaved.current = true;
            router.post(
                "/student/saveParagraphProgress",
                {
                    module_id: module.id,
                    words_smashed: wordsSmashed,
                },
                { preserveScroll: true },
            );
        }
        setGameState("GAMEOVER");
    }, [module.id, wordsSmashed]);

    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);
    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, []);

    // 2. Countdown Hook
    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    ); // This callback is already stable

    const targetWord = words[currentWordIndex];

    // 3. Speech Recognition Hook
    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
    });

    // --- End Custom Hooks ---

    // Original handleRestart and handleExit functions
    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/speakModeLevels");
    };

    const handlePlayAgain = useCallback(() => {
        setCurrentWordIndex(0);
        setCurrentScore(0);
        setWordsSmashed(0);
        setGameState("COUNTDOWN");
    }, []);

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        wordsSmashed: currentScore,
        onOpenSettings: handleOpenSettings,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
            <GameOverModal
                gameState={gameState}
                wordsSmashed={wordsSmashed}
                totalWords={totalWords}
                onPlayAgain={handlePlayAgain}
                backToMapUrl="/student/speakModeLevels"
            />
            <DeniedModal gameState={gameState} />
            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={handleCloseSettings}
                audio={audioSettings}
                onUpdateAudio={updateAudioSetting}
                onRestart={handleRestart}
                onExit={handleExit}
            />

            <GameplayHeader {...headerProps} />

            <SpeakModeMainContent
                words={words}
                currentWordIndex={Math.min(currentWordIndex, totalWords - 1)}
                gameState={gameState}
                countdownValue={countdownValue}
                isMispronounced={isMispronounced}
                showPointsFeedback={showPointsFeedback}
                pointsFeedbackValue={pointsFeedbackValue}
            />

            <Microphone
                isListening={gameState === "ACTIVE"}
                disabled={gameState === "COUNTDOWN"}
            />
        </div>
    );
}
