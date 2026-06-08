import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { useState, useCallback } from "react";
import { router } from "@inertiajs/react";
import GameOverModal from "@/Components/Student/GameOverModal";
import CountDownGameplay from "@/Components/Student/CountdownGameplay";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";

// Import new hooks
import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED
    // countdownValue is now managed by useCountdown

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [musicVolume, setMusicVolume] = useState(50);
    const [sfxVolume, setSfxVolume] = useState(70);

    // Split the content into individual words
    const words = module?.content ? module.content.split(/\s+/) : [];
    const totalWords = words.length;
    // --- Custom Hooks ---

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

    // Original handleRestart and handleExit functions
    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/speakModeLevels");
    };

    const handlePlayAgain = useCallback(() => {
        setCurrentWordIndex(0);
        setGameState("IDLE");
    }, []);

    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameOverModal
                    gameState={gameState}
                    currentWordIndex={currentWordIndex}
                    totalWords={totalWords}
                    onPlayAgain={handlePlayAgain}
                    onExit={handleExit}
                />
                {/* Countdown Overlay */}
                <CountDownGameplay
                    gameState={gameState}
                    countdownValue={countdownValue}
                />

                <DeniedModal
                    gameState={gameState}
                    initiateGameStart={initiateGameStart}
                />

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

                <GameplayHeader
                    level={`${module.level} - ${module.title}`}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                    isActive={gameState === "ACTIVE"}
                    isPaused={isSettingsOpen}
                    wordsSmashed={currentWordIndex}
                    onTimeUp={() => setGameState("GAMEOVER")}
                />

                <SpeakModeMainContent
                    words={words}
                    currentWordIndex={currentWordIndex}
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
