import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import { router } from "@inertiajs/react";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";
import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { Joyride, STATUS } from "react-joyride";

import { useCountdown } from "@/hooks/Student/useCountdown";
import { useWordSpeechRecognition } from "@/hooks/Student/useWordSpeechRecognition";

export default function PracticeRead({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
    const currentStreakRef = useRef(0);
    const [maxStreak, setMaxStreak] = useState(0);

    const [gameState, setGameState] = useState("IDLE");
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    const [scoreEmphasize, setScoreEmphasize] = useState(false);

    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [audioSettings, setAudioSettings] = useState({
        music: 50,
        sfx: 70,
    });

    const [joyrideRun, setJoyrideRun] = useState(true);
    const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);
    const advanceTimerRef = useRef(null);

    const isMountedRef = useRef(true);
    const currentWordIndexRef = useRef(0);
    const completionTimerRef = useRef(null);
    const mispronounceTimerRef = useRef(null);

    const handleJoyrideCallback = (data) => {
        const { status, index } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setJoyrideRun(false);
            return;
        }
        if (typeof index === "number") {
            setJoyrideStepIndex(index);
        }
    };

    const joyrideSteps = [
        {
            target: '[data-purpose="gameplay-header"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        YOUR GAME HUD
                    </p>
                    <p className="text-sm opacity-80">
                        This bar shows your current level, score, and lets you
                        open settings or end the game.
                    </p>
                </div>
            ),
            placement: "bottom",
            spotlightPadding: 5,
        },
        {
            target: '[data-purpose="word-display"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        READ THE WORD
                    </p>
                    <p className="text-sm opacity-80">
                        Say each word clearly into your microphone. Read it
                        right to smash it!
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 10,
        },
        {
            target: '[data-purpose="microphone-button"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        TAP TO PLAY!
                    </p>
                    <p className="text-sm opacity-80">
                        Tap here when you are ready. A 3-2-1 countdown will
                        appear, then start reading!
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 10,
        },
    ];

    useEffect(() => {
        if (!joyrideRun) return;
        advanceTimerRef.current = setTimeout(() => {
            if (joyrideStepIndex < joyrideSteps.length - 1) {
                setJoyrideStepIndex(joyrideStepIndex + 1);
            } else {
                setJoyrideRun(false);
            }
        }, 4000);
        return () => clearTimeout(advanceTimerRef.current);
    }, [joyrideStepIndex, joyrideRun, joyrideSteps.length]);

    useEffect(() => {
        currentWordIndexRef.current = currentWordIndex;
    }, [currentWordIndex]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
        };
    }, []);

    const speechRecognitionWords = useMemo(
        () => (module?.words ? module.words.map((w) => w.word) : []),
        [module?.words],
    );
    const totalWords = speechRecognitionWords.length;

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/dashboard");
    };

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
            completionTimerRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    router.visit("/student/tutorial?practiceDone=1");
                }
            }, 2000);
        }
    }, [currentWordIndex, totalWords, gameState]);

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

        clearTimeout(mispronounceTimerRef.current);
        setIsMispronounced(false);

        moveToNextWord();
    }, [moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        currentStreakRef.current = 0;
        setIsMispronounced(true);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            moveToNextWord();
        }, 800);
    }, [moveToNextWord]);

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

    const handleTimeUp = useCallback(() => {
        clearTimeout(mispronounceTimerRef.current);
        router.visit("/student/tutorial?practiceDone=1");
    }, []);

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

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

    const headerProps = {
        level: "Practice Mode",
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
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden relative">
            {joyrideRun && (
                <Joyride
                    run={joyrideRun}
                    stepIndex={joyrideStepIndex}
                    callback={handleJoyrideCallback}
                    steps={joyrideSteps}
                    disableBeacon
                    continuous
                    hideBackButton
                    disableOverlayClose
                    disableCloseOnOutsideClick
                    showProgress
                    styles={{
                        beacon: {
                            position: "fixed",
                            top: "50%",
                            left: "50%",
                            transform: "translate(-50%, -50%)",
                            zIndex: 10001,
                        },
                        beaconInner: {
                            backgroundColor: "#ffffff",
                        },
                        beaconOuter: {
                            backgroundColor: "rgba(255, 255, 255, 0.4)",
                            borderColor: "#ffffff",
                            borderWidth: "2px",
                        },
                        options: {
                            arrowColor: "#1e1b4b",
                                overlayColor: "rgba(0,0,0,0.85)",
                            zIndex: 10000,
                        },
                        tooltip: {
                            backgroundColor: "#1e1b4b",
                            borderRadius: "1.5rem",
                            padding: "2rem",
                            fontSize: "1.125rem",
                            color: "#ffffff",
                        },
                        tooltipContainer: {
                            textAlign: "left",
                        },
                        tooltipContent: {
                            padding: 0,
                            fontSize: "1.125rem",
                            lineHeight: "1.6",
                            color: "#ffffff",
                        },
                        buttonNext: {
                            backgroundColor: "#7c3aed",
                            borderRadius: "0.75rem",
                            fontSize: "1rem",
                            fontWeight: 700,
                            padding: "0.75rem 1.5rem",
                            color: "#fff",
                        },
                        buttonBack: {
                            fontSize: "1rem",
                            fontWeight: 600,
                            color: "#a78bfa",
                        },
                        buttonSkip: {
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "#9ca3af",
                        },
                    }}
                />
            )}

            <DeniedModal gameState={gameState} />
       
            <div data-purpose="gameplay-header">
                <GameplayHeader {...headerProps} />
            </div>

         
            <div data-purpose="word-display" className="flex-1 flex">
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
            </div>

            {gameState === "IDLE" && !joyrideRun && (
                <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-40 pointer-events-none flex flex-col items-center justify-end pb-[110px] sm:pb-[140px] md:pb-[160px]">
                    <div className="flex flex-col items-center justify-center animate-bounce scale-90 sm:scale-100">
                        <div className="bg-lime-400 text-slate-950 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-[2rem] shadow-[0_0_30px_rgba(163,230,53,0.4)] sm:shadow-[0_0_40px_rgba(163,230,53,0.4)] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter">
                            <span className="material-symbols-outlined text-3xl sm:text-4xl mb-0 sm:mb-1">
                                touch_app
                            </span>
                            <span className="text-lg sm:text-xl leading-none">
                                Tap to Practice
                            </span>
                            <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] opacity-70 mt-1">
                                Tap the mic & read the words aloud!
                            </span>
                        </div>
                        <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-r-[15px] sm:border-r-[20px] border-t-[20px] sm:border-t-[25px] border-l-transparent border-r-transparent border-t-white -mt-1 drop-shadow-2xl"></div>
                    </div>
                </div>
            )}

            <div className="flex-shrink-0 relative z-50" data-purpose="microphone-button">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                />
            </div>


        </div>
    );
}
