import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useWordSpeechRecognition } from "@/hooks/Student/useWordSpeechRecognition";

export default function GameplayReadMode({ module }) {
    // All state at the top.
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const currentStreakRef = useRef(0);
    const [maxStreak, setMaxStreak] = useState(0);

    // "COMPLETED" is a valid state.
    // IDLE → COUNTDOWN → ACTIVE → GAMEOVER | COMPLETED
    //                           ↘ DENIED
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

    // Cancel mispronounce delay on time-up / unmount.
    const mispronounceTimerRef = useRef(null);

    // Cleanup on unmount — prevent post-unmount state updates.
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
        };
    }, []);

    // --- Derived values ---

    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    // --- Helpers ---

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/readModeLevels");
    };

    // Clamp so rapid recognition can't push past array bounds.
    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    // --- Progress persistence ---

    const persistProgress = useCallback(() => {
        if (!hasSaved.current) {
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
        const wordObj = module.words[currentWordIndexRef.current];
        if (wordObj) {
            router.post(
                "/student/updateWordMastery",
                { word_id: wordObj.id, status: "mastered" },
                { preserveScroll: true, preserveState: true },
            );
        }

        const points = module.words[currentWordIndexRef.current]?.points || 0;
        setWordsSmashed((prev) => prev + 1);
        currentStreakRef.current += 1;
        setMaxStreak((m) => Math.max(m, currentStreakRef.current));
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        setTimeout(() => setScoreEmphasize(false), 500);

        // Cancel any pending mispronounce transition to avoid double moveToNextWord
        clearTimeout(mispronounceTimerRef.current);
        setIsMispronounced(false);

        moveToNextWord();
    }, [module.words, moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        const wordObj = module.words[currentWordIndexRef.current];
        if (wordObj) {
            router.post(
                "/student/updateWordMastery",
                { word_id: wordObj.id, status: "training" },
                { preserveScroll: true, preserveState: true },
            );
        }

        currentStreakRef.current = 0;
        setIsMispronounced(true);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 800);
    }, [module.words, moveToNextWord]);

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
        clearTimeout(mispronounceTimerRef.current);
        persistProgress();
        setGameState("GAMEOVER");
    }, [persistProgress]);

    // --- Countdown ---

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    // --- Speech Recognition ---

    // Sanitize target word by removing punctuation.
    const targetWord = useMemo(() => {
        return (
            speechRecognitionWords[currentWordIndex]
                ?.replace(/[^\w\s]/g, "")
                .toLowerCase() || ""
        );
    }, [speechRecognitionWords, currentWordIndex]);

    useWordSpeechRecognition({
        isActive: gameState === "ACTIVE" || gameState === "COUNTDOWN",
        isPaused: isSettingsOpen || gameState === "COUNTDOWN",
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
    });

    // --- Play again ---

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

            {gameState === "IDLE" && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-end pb-36 sm:pb-48">
                    <div className="flex flex-col items-center justify-center animate-bounce">
                        <div className="bg-lime-400 text-slate-950 font-black px-8 py-4 rounded-[2rem] shadow-[0_0_40px_rgba(163,230,53,0.4)] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter">
                            <span className="material-symbols-outlined text-4xl mb-1">touch_app</span>
                            <span className="text-xl">Tap Microphone</span>
                            <span className="text-[10px] sm:text-xs tracking-[0.2em] opacity-70">To grant access & play</span>
                        </div>
                        <div className="w-0 h-0 border-l-[20px] border-r-[20px] border-t-[25px] border-l-transparent border-r-transparent border-t-white -mt-1 drop-shadow-2xl"></div>
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
