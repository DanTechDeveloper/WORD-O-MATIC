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
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED, GAMEOVER
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

    // Point 4: Missing boundary guard
    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= totalWords) {
                // Huwag agad tapusin ang laro.
                // Bigyan ng 1.2 seconds ang UI para ipakita ang huling points.
                setTimeout(() => {
                    setGameState("GAMEOVER");
                }, 1200);
                return next; // Allow index to reach totalWords for correct score counting
            }
            return next;
        }); // totalWords is now derived from speechRecognitionWords
    }, [totalWords]);

    // Point 1 & 2: Stale currentWordIndex & advancing word in two places
    const handleWordRecognized = useCallback(() => {
        // Removed `index` parameter
        const points = module.words[currentWordIndex]?.points || 0; // Use currentWordIndex from state
        setCurrentScore((prev) => prev + points);
        setWordsSmashed((prev) => prev + 1);
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        setTimeout(() => setScoreEmphasize(false), 500);
        moveToNextWord(); // Parent controls progression
    }, [currentWordIndex, module.words, moveToNextWord]); // Added currentWordIndex to dependencies

    // Point 3: setTimeout mispronounce is unnecessary latency
    const handleMispronounce = useCallback(() => {
        setIsMispronounced(true);
        moveToNextWord(); // Move to next word immediately
        // Clear mispronounced state after a short delay for visual feedback
            setIsMispronounced(false);
        
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

    // 2. Countdown Hook
    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    ); // This callback is already stable

    // 3. Speech Recognition Hook
    // Point 5: Speech hook is now correct but slightly over-injected
    const targetWord = speechRecognitionWords[currentWordIndex];
    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        targetWord: targetWord, // Changed from words, currentWordIndex
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: () => setGameState("DENIED"),
        onMispronounced: handleMispronounce, // Removed interim matching
        onRecognitionError: undefined, // Removed interim matching
    });

    // --- End Custom Hooks ---

    const onPlayAgain = useCallback(() => {
        setCurrentWordIndex(0);
        setCurrentScore(0);
        setWordsSmashed(0);
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
                    currentWordIndex={wordsSmashed}
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
                    // Siguraduhin na ang UI ay laging nasa huling valid word habang naghihintay ng Game Over
                    currentIndex={Math.min(currentWordIndex, totalWords - 1)}
                    gameState={gameState}
                    countdownValue={countdownValue}
                    isExploding={false}
                    isMispronounced={isMispronounced}
                    showPointsFeedback={showPointsFeedback}
                    pointsFeedbackValue={pointsFeedbackValue}
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
