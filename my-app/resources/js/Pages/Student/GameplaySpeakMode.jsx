import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useSentenceSpeechRecognition } from "@/hooks/Student/useSentenceSpeechRecognition";

export default function GameplaySpeakMode({ module }) {
    // All state at the top.
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const currentStreakRef = useRef(0);
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
        setWordsSmashed((prev) => prev + 1);
        currentStreakRef.current += 1;
        setMaxStreak((m) => Math.max(m, currentStreakRef.current));
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
        currentStreakRef.current = 0;
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

    const handleMicrophoneClick = useCallback(() => {
        if (gameState === "IDLE") {
            setGameState("COUNTDOWN");
        }
    }, [gameState]);

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
        isActive: gameState === "ACTIVE" || gameState === "COUNTDOWN",
        isPaused: isSettingsOpen || gameState === "COUNTDOWN",
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
        setWordsSmashed(0);
        currentStreakRef.current = 0;
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
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
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

            {gameState === "IDLE" && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-end pb-[110px] sm:pb-[140px] md:pb-[160px]">
                    <div className="flex flex-col items-center justify-center animate-bounce scale-90 sm:scale-100">
                        <div className="bg-sky-400 text-slate-950 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-[2rem] shadow-[0_0_30px_rgba(56,189,248,0.4)] sm:shadow-[0_0_40px_rgba(56,189,248,0.4)] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter">
                            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-0 sm:mb-1">touch_app</span>
                            <span className="text-lg sm:text-xl leading-none">Tap Microphone</span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] opacity-70 mt-1">To grant access & play</span>
                        </div>
                        <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-r-[15px] sm:border-r-[20px] border-t-[20px] sm:border-t-[25px] border-l-transparent border-r-transparent border-t-white -mt-1 drop-shadow-2xl"></div>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                />
            </div>
        </div>
    );
}
