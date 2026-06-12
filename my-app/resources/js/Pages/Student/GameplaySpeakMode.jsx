import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import GameplayShell from "@/Components/Student/GameplayShell";
import { useState, useCallback, useEffect, useMemo } from "react";
import { router } from "@inertiajs/react";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED
    const [interimMatch, setInterimMatch] = useState(false);
    // countdownValue is now managed by useCountdown

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [musicVolume, setMusicVolume] = useState(50);
    const [sfxVolume, setSfxVolume] = useState(70);

    // Split the content into individual words
    const words = useMemo(
        () => (module?.content ? module.content.split(/\s+/) : []),
        [module?.content],
    );
    const totalWords = words.length;
    // --- Custom Hooks ---

    // Calculate derived score (Defaulting to 1 point per word for string content)
    const currentScore = useMemo(() => {
        // Note: ParagraphModule does not provide per-word points in the current DB response
        return currentWordIndex;
    }, [currentWordIndex]);

    const handleNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= words.length) {
                setGameState("GAMEOVER");
            }
            return Math.min(next, totalWords);
        });
    }, [words.length]);

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
        setGameState("GAMEOVER");
    }, []);
    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);
    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
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
        words,
        currentWordIndex,
        handleNextWord, // onWordRecognized
        handlePermissionDenied, // onPermissionDenied (from recognition error)
        handleInterimMatch, // onInterimMatch (dual-layer feedback)
    );

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
        setGameState("COUNTDOWN");
    }, []);

    return (
        <GameplayShell
            module={module}
            gameState={gameState}
            currentWordIndex={currentWordIndex}
            totalWords={totalWords}
            currentScore={currentScore}
            onPlayAgain={handlePlayAgain}
            backToMapUrl="/student/speakModeLevels"
            isSettingsOpen={isSettingsOpen}
            onOpenSettings={handleOpenSettings}
            onCloseSettings={handleCloseSettings}
            musicVolume={musicVolume}
            setMusicVolume={setMusicVolume}
            sfxVolume={sfxVolume}
            setSfxVolume={setSfxVolume}
            onRestart={handleRestart}
            onExit={handleExit}
            onTimeUp={handleTimeUp}
        >
            <SpeakModeMainContent
                words={words}
                currentWordIndex={currentWordIndex}
                gameState={gameState}
                countdownValue={countdownValue}
                interimMatch={interimMatch}
            />
        </GameplayShell>
    );
}
