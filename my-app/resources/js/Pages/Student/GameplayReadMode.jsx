import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import { useState, useCallback, useEffect } from "react";
import GameOverModal from "@/Components/Student/GameOverModal";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplayReadMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [isShaking, setIsShaking] = useState(false); // State for screen shake effect
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED, GAMEOVER
    // countdownValue is now managed by useCountdown

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [musicVolume, setMusicVolume] = useState(50);
    const [sfxVolume, setSfxVolume] = useState(70);

    // Split the content into individual words
    const words = module?.content ? module.content.split(/\s+/) : [];
    const totalWords = words.length;

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/readModeLevels");
    };

    const handleNextWord = useCallback(() => {
        setIsShaking(true); // Trigger screen shake
        setTimeout(() => setIsShaking(false), 300); // Stop shaking after 300ms
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= words.length) {
                setGameState("GAMEOVER");
            }
            return Math.min(next, totalWords);
        });
    }, [words.length, totalWords]);

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

    // 2. Countdown Hook
    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    // 3. Speech Recognition Hook
    useSpeechRecognition(
        gameState === "ACTIVE", // isActive
        isSettingsOpen, // isPaused
        words,
        currentWordIndex,
        handleNextWord, // onWordRecognized
        () => setGameState("DENIED"), // onPermissionDenied (from recognition error)
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

            <style>
                {`
                    @keyframes shake {
                        0% { transform: translateX(0); }
                        25% { transform: translateX(-5px); }
                        50% { transform: translateX(5px); }
                        75% { transform: translateX(-5px); }
                        100% { transform: translateX(0); }
                    }
                `}
            </style>
            <div
                className={`bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden ${isShaking ? "animate-[shake_0.3s_ease-in-out]" : ""}`}
            >
                <GameplayHeader
                    level={`${module.level} - ${module.title}`}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isActive={gameState === "ACTIVE"}
                    isPaused={isSettingsOpen}
                    wordsSmashed={currentWordIndex}
                    onTimeUp={() => setGameState("GAMEOVER")}
                />

                <ReadModeMainContent
                    words={module.words}
                    currentIndex={currentWordIndex}
                    gameState={gameState}
                    countdownValue={countdownValue}
                />

                <div>
                    <Microphone // The Microphone component's onClick should trigger game start
                        onClick={
                            gameState === "IDLE" ? initiateGameStart : null
                        }
                        isListening={gameState === "ACTIVE"}
                        disabled={gameState === "COUNTDOWN"}
                    />
                </div>
            </div>
        </>
    );
}
