import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useWordSpeechRecognition } from "@/hooks/Student/useWordSpeechRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";

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
    const [isExploding, setIsExploding] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    const [scoreEmphasize, setScoreEmphasize] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(0);
    const [feedbackType, setFeedbackType] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [isWordReady, setIsWordReady] = useState(true);
    const [streakShake, setStreakShake] = useState(null);

    // Refs
    const hasSaved = useRef(false);
    const feedbackTimerRef = useRef(null);
    const isMountedRef = useRef(true);
    const currentWordIndexRef = useRef(0);
    const completionTimerRef = useRef(null);
    const wordEntryTimerRef = useRef(null);
    const streakShakeTimerRef = useRef(null);

    useEffect(() => {
        currentWordIndexRef.current = currentWordIndex;
    }, [currentWordIndex]);

    // Word entry delay: word must be halfway through fall animation before recognition
    useEffect(() => {
        if (gameState === "ACTIVE") {
            setIsWordReady(false);
            clearTimeout(wordEntryTimerRef.current);
            wordEntryTimerRef.current = setTimeout(() => {
                setIsWordReady(true);
            }, 1000);
        }
        return () => {
            clearTimeout(wordEntryTimerRef.current);
        };
    }, [currentWordIndex, gameState]);

    const wordsSmashedRef = useRef(wordsSmashed);
    useEffect(() => {
        wordsSmashedRef.current = wordsSmashed;
    }, [wordsSmashed]);

    // Cancel mispronounce delay on time-up / unmount.
    const mispronounceTimerRef = useRef(null);
    const wordRecognizedTimerRef = useRef(null);

    // Cleanup on unmount — prevent post-unmount state updates.
    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            clearTimeout(wordRecognizedTimerRef.current);
            clearTimeout(feedbackTimerRef.current);
            clearTimeout(streakShakeTimerRef.current);
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
        };
    }, []);

    const { permissionState, requestPermission } = useMicrophonePermission();

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState]);

    // --- Derived values ---

    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    // --- Helpers ---

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

    const persistProgressRef = useRef(persistProgress);
    persistProgressRef.current = persistProgress;

    // --- Game-over evaluation ---

    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            persistProgressRef.current();

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
        setWordsSmashed((prev) => {
            const next = prev + 1;
            wordsSmashedRef.current = next;
            return next;
        });
        currentStreakRef.current += 1;
        setCurrentStreak(currentStreakRef.current);
        setMaxStreak((m) => Math.max(m, currentStreakRef.current));
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        setTimeout(() => setScoreEmphasize(false), 500);

        const streak = currentStreakRef.current;
        let fbMsg;
        if (streak >= 5) fbMsg = "Excellent!";
        else if (streak >= 3) fbMsg = "Great Job!";
        else if (streak >= 2) fbMsg = "Great!";
        else fbMsg = "Good!";
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(fbMsg);
        setFeedbackType("correct");
        feedbackTimerRef.current = setTimeout(() => {
            setFeedbackType(null);
        }, 600);

        if (streak >= 3) {
            clearTimeout(streakShakeTimerRef.current);
            const intensity = streak >= 10 ? "intense" : streak >= 5 ? "medium" : "subtle";
            setStreakShake(intensity);
            streakShakeTimerRef.current = setTimeout(() => {
                setStreakShake(null);
            }, intensity === "intense" ? 500 : 400);
        }

        clearTimeout(mispronounceTimerRef.current);
        setIsMispronounced(false);

        clearTimeout(wordRecognizedTimerRef.current);
        setIsExploding(true);
        wordRecognizedTimerRef.current = setTimeout(() => {
            setIsExploding(false);
            moveToNextWord();
        }, 500);
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
        setCurrentStreak(0);
        const mispMsgs = ["Almost!", "Try Again!", "So Close!", "Keep Going!", "Nice Try!"];
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(mispMsgs[Math.floor(Math.random() * mispMsgs.length)]);
        setFeedbackType("mispronounce");
        feedbackTimerRef.current = setTimeout(() => {
            setFeedbackType(null);
        }, 700);

        setIsMispronounced(true);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 800);
    }, [module.words, moveToNextWord]);

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, []);

    const handleMicrophoneClick = useCallback(async () => {
        if (gameState === "IDLE") {
            if (permissionState === "prompt") {
                const granted = await requestPermission();
                if (!granted) return;
            }
            setGameState("COUNTDOWN");
        }
    }, [gameState, permissionState, requestPermission]);

    // --- Time-up ---

    const handleTimeUp = useCallback(() => {
        clearTimeout(mispronounceTimerRef.current);
        clearTimeout(wordRecognizedTimerRef.current);
        setIsExploding(false);
        persistProgress();
        if (wordsSmashedRef.current >= totalWords) {
            setGameState("COMPLETED");
        } else {
            setGameState("GAMEOVER");
        }
    }, [persistProgress, totalWords]);

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
        isPaused: gameState === "COUNTDOWN",
        targetWord: targetWord,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: (err) => console.error("Recognition error:", err),
        isWordReady: isWordReady,
    });

    // --- Render ---

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
    };

    const shakeClass = streakShake ? `animate-streak-shake-${streakShake}` : "";

    return (
        <div className={`bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden ${shakeClass}`}>
            <style>
                {`
                    @keyframes streak-shake-subtle {
                        0%, 100% { transform: translateX(0); }
                        20% { transform: translateX(-3px); }
                        40% { transform: translateX(3px); }
                        60% { transform: translateX(-2px); }
                        80% { transform: translateX(2px); }
                    }
                    .animate-streak-shake-subtle {
                        animation: streak-shake-subtle 0.3s ease-in-out;
                    }

                    @keyframes streak-shake-medium {
                        0%, 100% { transform: translateX(0); }
                        15% { transform: translateX(-6px) rotate(-0.5deg); }
                        30% { transform: translateX(6px) rotate(0.5deg); }
                        45% { transform: translateX(-5px) rotate(-0.3deg); }
                        60% { transform: translateX(5px) rotate(0.3deg); }
                        75% { transform: translateX(-3px); }
                        90% { transform: translateX(3px); }
                    }
                    .animate-streak-shake-medium {
                        animation: streak-shake-medium 0.4s ease-in-out;
                    }

                    @keyframes streak-shake-intense {
                        0%, 100% { transform: translateX(0) rotate(0deg); }
                        10% { transform: translateX(-8px) rotate(-1deg); }
                        25% { transform: translateX(8px) rotate(1deg); }
                        40% { transform: translateX(-6px) rotate(-0.5deg); }
                        55% { transform: translateX(6px) rotate(0.5deg); }
                        70% { transform: translateX(-4px); }
                        85% { transform: translateX(4px); }
                    }
                    .animate-streak-shake-intense {
                        animation: streak-shake-intense 0.5s ease-in-out;
                    }

                    @keyframes streak-number-shake {
                        0%, 100% { transform: translateX(0) rotate(0deg); }
                        15% { transform: translateX(-2px) rotate(-2deg); }
                        30% { transform: translateX(2px) rotate(2deg); }
                        45% { transform: translateX(-1px) rotate(-1deg); }
                        60% { transform: translateX(1px) rotate(1deg); }
                        75% { transform: translateX(-1px); }
                        90% { transform: translateX(1px); }
                    }
                    .animate-streak-number-shake {
                        animation: streak-number-shake 0.4s ease-in-out;
                    }
                `}
            </style>
            <DeniedModal gameState={gameState} />
            <GameplayHeader {...headerProps} />

            <ReadModeMainContent
                words={module.words}
                currentIndex={Math.min(currentWordIndex, totalWords - 1)}
                gameState={gameState}
                countdownValue={countdownValue}
                isExploding={isExploding}
                isMispronounced={isMispronounced}
                showPointsFeedback={showPointsFeedback}
                pointsFeedbackValue={pointsFeedbackValue}
                streak={currentStreak}
                feedbackType={feedbackType}
                feedbackMessage={feedbackMessage}
                isWordReady={isWordReady}
            />

            {gameState === "IDLE" && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-end pb-[110px] sm:pb-[140px] md:pb-[160px]">
                    <div className="flex flex-col items-center justify-center animate-bounce scale-90 sm:scale-100">
                        <div className="bg-lime-400 text-slate-950 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-[2rem] shadow-[0_0_30px_rgba(163,230,53,0.4)] sm:shadow-[0_0_40px_rgba(163,230,53,0.4)] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter">
                            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-0 sm:mb-1">touch_app</span>
                            <span className="text-lg sm:text-xl leading-none">Tap Microphone</span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] opacity-70 mt-1">{
                                permissionState === "granted"
                                    ? "Tap to play!"
                                    : permissionState === "denied"
                                      ? "Permission denied"
                                      : "To grant access & play"
                            }</span>
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
