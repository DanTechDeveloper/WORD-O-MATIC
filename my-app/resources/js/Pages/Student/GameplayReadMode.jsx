import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import GameOverModal from "@/Components/Student/GameOverModal";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo } from "react";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplayReadMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED, GAMEOVER
    const [interimMatch, setInterimMatch] = useState(false);
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    // countdownValue is now managed by useCountdown

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

    const updateAudioSetting = useCallback((key, value) => {
        setAudioSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/readModeLevels");
    };

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= totalWords) {
                setGameState("GAMEOVER");
            }
            return Math.min(next, totalWords);
        }); // totalWords is now derived from speechRecognitionWords
    }, [totalWords]);

    const handleWordRecognized = useCallback(() => {
        const points = module.words[currentWordIndex]?.points || 0; // Get points from module.words
        setCurrentScore((prev) => prev + points); // Increment score
        setPointsFeedbackValue(points); // Set points for feedback
        setShowPointsFeedback(true); // Show feedback
        setTimeout(() => setShowPointsFeedback(false), 500); // Hide feedback after 500ms
        setScoreEmphasize(true); // Emphasize score in header
        setTimeout(() => setScoreEmphasize(false), 500); // Stop emphasizing after 500ms
        moveToNextWord(); // Move to next word
    }, [currentWordIndex, module.words, moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        setIsMispronounced(true);
        setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 200);
    }, [moveToNextWord]); // Removed scoreEmphasize from dependencies as it's not directly used here.

    // State for score emphasis in GameplayHeader
    const [scoreEmphasize, setScoreEmphasize] = useState(false);

    // --- Custom Hooks ---

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

    // Permission check on mount: If already granted, start countdown.
    // Otherwise, handle initial permission prompt.
    useEffect(() => {
        if (gameState === "IDLE") {
            initiateGameStart();
        }
    }, [initiateGameStart, gameState]);

    const handleOpenSettings = useCallback(() => {
        setIsSettingsOpen(true);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);

    const handleTimeUp = useCallback(() => {
        setGameState("GAMEOVER");
    }, []);

    const handleInterimMatch = useCallback((isMatch) => {
        setInterimMatch(isMatch);
    }, []);

    // 2. Countdown Hook
    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    ); // This callback is already stable

    // 3. Speech Recognition Hook
    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        words: speechRecognitionWords,
        currentWordIndex: currentWordIndex,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: () => setGameState("DENIED"),
        onInterimMatch: handleInterimMatch,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
    });

    // --- End Custom Hooks ---

    const onPlayAgain = useCallback(() => {
        setCurrentWordIndex(0);
        setCurrentScore(0);
        setGameState("COUNTDOWN");
    }, []);

    // Grouped props to clean up the return block
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
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameOverModal
                    gameState={gameState}
                    currentWordIndex={currentWordIndex}
                    totalWords={totalWords}
                    onPlayAgain={onPlayAgain}
                    backToMapUrl={"/student/readModeLevels"}
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

                <ReadModeMainContent
                    words={module.words}
                    currentIndex={currentWordIndex}
                    gameState={gameState}
                    countdownValue={countdownValue}
                    isExploding={false}
                    isMispronounced={isMispronounced}
                    showPointsFeedback={showPointsFeedback}
                    pointsFeedbackValue={pointsFeedbackValue}
                    interimMatch={interimMatch}
                />

                <div>
                    <Microphone
                        isListening={gameState === "ACTIVE"}
                        disabled={gameState === "COUNTDOWN"}
                    />
                </div>
            </div>
        </>
    );
}
