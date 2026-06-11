import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import { useState, useCallback, useEffect, useMemo } from "react";
import GameOverModal from "@/Components/Student/GameOverModal";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplayReadMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED, GAMEOVER
    const [interimMatch, setInterimMatch] = useState(false);
    // countdownValue is now managed by useCountdown

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [musicVolume, setMusicVolume] = useState(50);
    const [sfxVolume, setSfxVolume] = useState(70);

    // Split the content into individual words
    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    // Calculate derived score based on database points
    const currentScore = useMemo(() => {
        return module.words
            .slice(0, currentWordIndex)
            .reduce((sum, w) => sum + (w.points || 0), 0);
    }, [module.words, currentWordIndex]);

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/readModeLevels");
    };

    const handleNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= totalWords) {
                setGameState("GAMEOVER");
            }
            return Math.min(next, totalWords);
        }); // totalWords is now derived from speechRecognitionWords
    }, [totalWords]);

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
    useSpeechRecognition(
        gameState === "ACTIVE", // isActive
        isSettingsOpen, // isPaused
        speechRecognitionWords, // Use the correctly derived array of strings
        currentWordIndex,
        handleNextWord, // onWordRecognized
        () => setGameState("DENIED"), // onPermissionDenied (from recognition error)
        handleInterimMatch, // onInterimMatch (dual-layer feedback)
    );

    // --- End Custom Hooks ---

    const handlePlayAgain = useCallback(() => {
        setCurrentWordIndex(0);
        setGameState("COUNTDOWN");
    }, []);

    return (
        <>
            <GameOverModal
                gameState={gameState}
                currentWordIndex={currentWordIndex}
                score={currentScore}
                totalWords={totalWords}
                onPlayAgain={handlePlayAgain}
            />
            <DeniedModal gameState={gameState} />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={() => setIsSettingsOpen(false)}
                musicVolume={musicVolume}
                setMusicVolume={setMusicVolume}
                sfxVolume={sfxVolume}
                setSfxVolume={setSfxVolume}
                onRestart={handleRestart}
                onExit={handleExit}
            />
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameplayHeader
                    level={`${module.level} - ${module.title}`}
                    onOpenSettings={handleOpenSettings}
                    isActive={gameState === "ACTIVE"}
                    isPaused={isSettingsOpen}
                    wordsSmashed={currentScore}
                    onTimeUp={handleTimeUp}
                />

                <ReadModeMainContent
                    words={module.words} // This is correct for ReadModeMainContent (array of objects)
                    currentIndex={currentWordIndex}
                    gameState={gameState}
                    countdownValue={countdownValue}
                    isExploding={false}
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
