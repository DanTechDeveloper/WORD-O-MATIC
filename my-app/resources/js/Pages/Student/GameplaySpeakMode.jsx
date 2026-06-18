import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSentenceSpeechRecognition } from "@/hooks/Student/useSentenceSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    // All state at the top.
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [currentScore, setCurrentScore] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [maxStreak, setMaxStreak] = useState(0);

    // ✅ Gap fix: "COMPLETED" is now a documented, valid state.
    //    IDLE → COUNTDOWN → ACTIVE → GAMEOVER | COMPLETED
    //                              ↘ DENIED
    const [gameState, setGameState] = useState("IDLE");
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    const [scoreEmphasize, setScoreEmphasize] = useState(false);

    // Settings
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

    // Refs
    const hasSaved = useRef(false);
    const isMountedRef = useRef(true);
    const currentWordIndexRef = useRef(0);
    const completionTimerRef = useRef(null);

    useEffect(() => {
        currentWordIndexRef.current = currentWordIndex;
    }, [currentWordIndex]);

    // ✅ New Bug #2 fix: cancel mispronounce delay on time-up / unmount.
    const mispronounceTimerRef = useRef(null);

    // ✅ Cleanup on unmount — prevent post-unmount state updates.
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
        };
    }, []);

    // --- Derived values ---

    const words = useMemo(
        () =>
            module?.content
                ? module.content.trim().split(/\s+/).filter(Boolean)
                : [],
        [module?.content],
    );
    const totalWords = words.length;

    // --- Helpers ---

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/speakModeLevels");
    };

    // ✅ Inherited Bug #2 fix: clamp so rapid recognition can't push
    //    currentWordIndex past the array bounds.
    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    // ✅ Gap fix: extracted so both handleTimeUp and the game-over
    //    useEffect call the same logic instead of duplicating it.
    const persistProgress = useCallback(() => {
        if (!hasSaved.current) {
            hasSaved.current = true;
            router.post(
                "/student/saveParagraphProgress",
                {
                    module_id: module.id,
                    words_smashed: wordsSmashed,
                    streak: maxStreak,
                },
                {
                    preserveScroll: true,
                    onSuccess: () => console.log("Paragraph progress saved!"),
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

            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
            completionTimerRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setGameState(wordsSmashed > 0 ? "COMPLETED" : "GAMEOVER");
                }
            }, 1200);
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
        const points = 1;
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

        // Progress to next word immediately. The 1200ms delay before the
        // GameOverModal appears provides enough time for score feedback.
        moveToNextWord();
    }, [moveToNextWord]);

    //    the timeout was a stale closure — `gameState` was always "ACTIVE" when
    //    captured, so the guard never actually protected against post-game fires.
    //    Proper fix: store the timer and cancel it explicitly in handleTimeUp.
    //    The `gameState` dependency is removed as it was both misleading and unused.
    const handleMispronounce = useCallback(() => {
        setCurrentStreak(0);
        setIsMispronounced(true);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 100); // Reduced for snappier feedback
    }, [moveToNextWord]);

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

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
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

    // --- Time-up ---

    const handleTimeUp = useCallback(() => {
        // ✅ New Bug #2 fix: cancel any pending word-advance timers
        //    so they can't fire after the game has ended.
        clearTimeout(mispronounceTimerRef.current);
        persistProgress();
        setGameState("GAMEOVER");
    }, [persistProgress]);

    // --- Countdown ---

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    // --- Speech Recognition ---

    // Sanitize targetWord by removing punctuation to ensure it matches the
    // speech recognition transcript, which also has punctuation stripped.
    const targetWord = useMemo(() => {
        return (
            words[currentWordIndex]?.replace(/[^\w\s]/g, "").toLowerCase() || ""
        );
    }, [words, currentWordIndex]);

    useSentenceSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: isSettingsOpen,
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
    });

    // --- Play again ---

    // ✅ Inherited Bug #1 fix: reset hasSaved so progress is correctly
    //    persisted on a second (or subsequent) playthrough.
    const handlePlayAgain = useCallback(() => {
        hasSaved.current = false;
        clearTimeout(mispronounceTimerRef.current);
        if (completionTimerRef.current) {
            clearTimeout(completionTimerRef.current);
        }
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
        wordsSmashed: wordsSmashed,
        onOpenSettings: handleOpenSettings,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
    };

    return (
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
