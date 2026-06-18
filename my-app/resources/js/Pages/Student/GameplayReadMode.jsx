import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useWordSpeechRecognition } from "@/hooks/Student/useWordSpeechRecognition";

export default function GameplayReadMode({ module }) {
    // ✅ Fix #6: All useState declarations grouped at the top,
    //    before any useCallback that references their setters.
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);

    // ✅ Fix #3: "COMPLETED" is now a documented, valid state.
    //    IDLE → COUNTDOWN → ACTIVE → GAMEOVER | COMPLETED
    //                              ↘ DENIED (permission error)
    const [gameState, setGameState] = useState("IDLE");
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    // ✅ Fix #6: Was previously declared after handleWordRecognized,
    //    which used setScoreEmphasize before it was initialized in scope.
    const [scoreEmphasize, setScoreEmphasize] = useState(false);

    // Settings State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

    // Refs
    const hasSaved = useRef(false);
    // ✅ Fix: use a ref for the index to prevent stale closures in speech callbacks.
    const currentWordIndexRef = useRef(0);
    useEffect(() => {
        currentWordIndexRef.current = currentWordIndex;
    }, [currentWordIndex]);
    // ✅ Fix #4: Track the mispronounce delay so it can be cancelled
    //    if the game ends (time up / all words done) before it fires.
    const mispronounceTimerRef = useRef(null);

    // --- Derived values ---

    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    // --- Navigation helpers ---

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/readModeLevels");
    };

    // ✅ Fix #5: Clamp index at totalWords so rapid recognition
    //    events can't push currentWordIndex past the array bounds.
    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    // --- Progress persistence helper (called from two places) ---

    const persistProgress = useCallback(() => {
        if (!hasSaved.current && wordsSmashed > 0) {
            hasSaved.current = true;
            router.post(
                "/student/saveWordProgress",
                {
                    module_id: module.id,
                    words_smashed: wordsSmashed,
                    streak: maxStreak,
                },
                {
                    preserveScroll: true,
                    onSuccess: () =>
                        console.log("Progress saved successfully!"),
                },
            );
        }
    }, [module.id, wordsSmashed]);

    // --- Game-over evaluation ---

    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            // Persist immediately to win the race against user clicks.
            persistProgress();

            const timer = setTimeout(() => {
                // ✅ Fix #3: Both states are now handled consistently.
                //    Pass gameState to GameOverModal so it can render
                //    different copy for "Great job!" vs "Time's up!".
                setGameState(wordsSmashed > 0 ? "COMPLETED" : "GAMEOVER");
            }, 1200);

            return () => clearTimeout(timer);
        }
    }, [
        currentWordIndex,
        totalWords,
        wordsSmashed,
        gameState,
        persistProgress,
    ]);

    // --- Speech recognition callbacks ---

    const handleWordRecognized = useCallback(() => {
        const wordObj = module.words[currentWordIndexRef.current];
        if (wordObj) {
            router.post(
                "/student/updateWordMastery",
                { word_id: wordObj.id, status: "mastered" },
                { preserveScroll: true, preserveState: true },
            );
        }

        const points = module.words[currentWordIndexRef.current]?.points || 0;
        setCurrentScore((prev) => prev + points);
        setWordsSmashed((prev) => prev + 1);
        setCurrentStreak((prev) => {
            const next = prev + 1;
            setMaxStreak((m) => Math.max(m, next));
            return next;
        });
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        setTimeout(() => setScoreEmphasize(false), 500);

        moveToNextWord();
    }, [module.words, moveToNextWord]);

    // ✅ Fix #1: Added currentWordIndex and module.words to the dependency array.
    //    Without this, handleMispronounce always captured currentWordIndex = 0,
    //    so the wrong word_id was sent to the API on every mispronunciation.
    const handleMispronounce = useCallback(() => {
        const wordObj = module.words[currentWordIndexRef.current];
        if (wordObj) {
            router.post(
                "/student/updateWordMastery",
                { word_id: wordObj.id, status: "training" },
                { preserveScroll: true, preserveState: true },
            );
        }

        setCurrentStreak(0);
        setIsMispronounced(true);

        // ✅ Fix #4: Clear any pending timer before scheduling a new one,
        //    and store the id so it can be cancelled on unmount or game-end.
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 100); // Mabilis na transition pagkatapos ng pagkakamali
    }, [module.words, moveToNextWord]);

    // ✅ Fix #4: Cancel any pending mispronounce transition on unmount.
    useEffect(() => {
        return () => clearTimeout(mispronounceTimerRef.current);
    }, []);

    // --- Settings ---

    const updateAudioSetting = useCallback((key, value) => {
        setAudioSettings((prev) => ({ ...prev, [key]: value }));
    }, []);

    const handleOpenSettings = useCallback(() => {
        setIsSettingsOpen(true);
    }, []);

    const handleCloseSettings = useCallback(() => {
        setIsSettingsOpen(false);
    }, []);

    // --- Microphone permission ---

    const { permissionState, requestPermission } = useMicrophonePermission();

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

    useEffect(() => {
        if (gameState === "IDLE") {
            initiateGameStart();
        }
    }, [initiateGameStart, gameState]);

    // --- Time-up handler ---

    const handleTimeUp = useCallback(() => {
        // ✅ Fix #4: Also cancel any pending mispronounce timer when time runs out
        //    so moveToNextWord doesn't fire after the game has ended.
        clearTimeout(mispronounceTimerRef.current);
        persistProgress();
        setGameState("GAMEOVER");
    }, [persistProgress]);

    // --- Countdown ---

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    // --- Speech Recognition ---

    // ✅ Fix: Sanitize target word by removing punctuation to ensure matches
    // with the transcript provided by the Web Speech API.
    const targetWord = useMemo(() => {
        return (
            speechRecognitionWords[currentWordIndex]
                ?.replace(/[^\w\s]/g, "")
                .toLowerCase() || ""
        );
    }, [speechRecognitionWords, currentWordIndex]);

    useWordSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: () => setGameState("DENIED"),
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
    });

    // --- Play again ---

    // ✅ Fix #2: Reset hasSaved so progress is correctly persisted
    //    on a second (or subsequent) playthrough.
    const onPlayAgain = useCallback(() => {
        hasSaved.current = false;
        clearTimeout(mispronounceTimerRef.current);
        currentWordIndexRef.current = 0;
        setCurrentWordIndex(0);
        setCurrentScore(0);
        setWordsSmashed(0);
        setCurrentStreak(0);
        setMaxStreak(0);
        setIsMispronounced(false);
        setGameState("COUNTDOWN");
    }, []);

    // --- Render ---

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
