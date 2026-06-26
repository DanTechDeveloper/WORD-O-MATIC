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
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const currentStreakRef = useRef(0);
    const [maxStreak, setMaxStreak] = useState(0);

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

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

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

    const mispronounceTimerRef = useRef(null);
    const wordRecognizedTimerRef = useRef(null);

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

    // --- Derived values ---

    const speechRecognitionWords = module?.words
        ? module.words.map((w) => w.word)
        : [];
    const totalWords = speechRecognitionWords.length;

    // --- Helpers ---

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/speakModeLevels");
    };

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    // --- Progress persistence ---

    const persistProgress = useCallback(
        (smashed, streak) => {
            if (!hasSaved.current) {
                hasSaved.current = true;
                router.post(
                    "/student/saveParagraphProgress",
                    {
                        module_id: module.id,
                        words_smashed: smashed,
                        streak: streak,
                    },
                    {
                        preserveScroll: true,
                        onSuccess: () => console.log("Paragraph progress saved!"),
                    },
                );
            }
        },
        [module.id],
    );

    const persistProgressRef = useRef(persistProgress);
    persistProgressRef.current = persistProgress;

    // --- Game-over evaluation ---

    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            persistProgressRef.current(wordsSmashed, maxStreak);

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
                "/student/updateParagraphMastery",
                { paragraph_word_id: wordObj.id, status: "mastered" },
                { preserveScroll: true, preserveState: true },
            );
        }

        const points = 1;
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
                "/student/updateParagraphMastery",
                { paragraph_word_id: wordObj.id, status: "training" },
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
        clearTimeout(wordRecognizedTimerRef.current);
        setIsExploding(false);
        persistProgressRef.current(wordsSmashed, maxStreak);
        if (wordsSmashedRef.current >= totalWords) {
            setGameState("COMPLETED");
        } else {
            setGameState("GAMEOVER");
        }
    }, [totalWords]);

    // --- Countdown ---

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    // --- Speech Recognition ---

    const targetWord = useMemo(() => {
        return (
            speechRecognitionWords[currentWordIndex]
                ?.replace(/[^\w\s]/g, "")
                .toLowerCase() || ""
        );
    }, [speechRecognitionWords, currentWordIndex]);

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

    const handlePlayAgain = useCallback(() => {
        hasSaved.current = false;
        clearTimeout(mispronounceTimerRef.current);
        clearTimeout(wordRecognizedTimerRef.current);
        if (completionTimerRef.current) {
            clearTimeout(completionTimerRef.current);
        }
        currentWordIndexRef.current = 0;
        setCurrentWordIndex(0);
        setWordsSmashed(0);
        currentStreakRef.current = 0;
        setMaxStreak(0);
        setIsMispronounced(false);
        setIsExploding(false);
        setFeedbackType(null);
        setFeedbackMessage("");
        setStreakShake(null);
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
                `}
            </style>
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

            <SpeakModeMainContent
                words={speechRecognitionWords}
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
            />

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
