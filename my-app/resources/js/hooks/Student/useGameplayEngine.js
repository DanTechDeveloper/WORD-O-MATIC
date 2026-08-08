import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCountdown } from "./useCountdown";
import { router } from "@inertiajs/react";
import { playSuccessSound, playFeedbackSound, playMispronounceSound } from "@/utils/sounds";
import { readResumeSession, clearResumeSession } from "@/utils/resumeStorage";

function normalizeWord(word) {
    return (word ?? "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

function getStreakFeedbackMessage(streak) {
    if (streak >= 6) return "Excellent!";
    if (streak >= 4) return "Great Job!";
    if (streak >= 2) return "Great!";
    return "Good!";
}

function getStreakShakeIntensity(streak) {
    if (streak >= 8) return "intense";
    if (streak >= 5) return "medium";
    return "subtle";
}

function clearAllTimers(timers) {
    Object.values(timers).forEach((timer) => {
        if (timer) clearTimeout(timer);
    });
}

export function useGameplayEngine({
    words = [],
    totalWords = 0,
    moduleId,
    saveEndpoint,
    onWordRecognized,
    onMispronounce,
    resumeData,
}) {
    const resume = useMemo(() => {
        if (typeof window === "undefined") return null;
        return resumeData ? resumeData : (moduleId ? readResumeSession(moduleId) : null);
    }, [resumeData, moduleId]);

    const [currentWordIndex, setCurrentWordIndex] = useState(() => resume?.currentWordIndex ?? 0);
    const [wordsSmashed, setWordsSmashed] = useState(() => resume?.wordsSmashed ?? 0);
    const [gameState, setGameState] = useState(() => resume ? "ACTIVE" : "IDLE");
    const [isMispronounced, setIsMispronounced] = useState(false);
    const [isExploding, setIsExploding] = useState(false);
    const [showPointsFeedback, setShowPointsFeedback] = useState(false);
    const [pointsFeedbackValue, setPointsFeedbackValue] = useState(0);
    const [scoreEmphasize, setScoreEmphasize] = useState(false);
    const [currentStreak, setCurrentStreak] = useState(() => resume?.currentStreak ?? 0);
    const [feedbackType, setFeedbackType] = useState(null);
    const [feedbackMessage, setFeedbackMessage] = useState("");
    const [isWordReady, setIsWordReady] = useState(true);
    const [streakShake, setStreakShake] = useState(null);
    const [maxStreak, setMaxStreak] = useState(() => resume?.maxStreak ?? 0);
    const [timeLeft, setTimeLeft] = useState(() => resume?.timeLeft ?? 60);

    const currentStreakRef = useRef(currentStreak);
    const hasSaved = useRef(false);
    const wordTimeoutRef = useRef(null);
    const feedbackTimerRef = useRef(null);
    const currentWordIndexRef = useRef(currentWordIndex);
    const wordEntryTimerRef = useRef(null);
    const streakShakeTimerRef = useRef(null);
    const wordsSmashedRef = useRef(wordsSmashed);
    const mispronounceTimerRef = useRef(null);
    const mispronounceGuardRef = useRef(false);
    const wordRecognizedTimerRef = useRef(null);
    const pointsFeedbackTimerRef = useRef(null);
    const scoreEmphasizeTimerRef = useRef(null);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onMispronounceRef = useRef(onMispronounce);
    const onMispronounceFnRef = useRef(null);
    const wordsRef = useRef(words);
    const wordRecognizedGuardRef = useRef(false);
    const maxStreakRef = useRef(maxStreak);

    useEffect(() => {
        onWordRecognizedRef.current = onWordRecognized;
        onMispronounceRef.current = onMispronounce;
        currentWordIndexRef.current = currentWordIndex;
        wordsSmashedRef.current = wordsSmashed;
        maxStreakRef.current = maxStreak;
        wordsRef.current = words;
        currentStreakRef.current = currentStreak;
    }, [onWordRecognized, onMispronounce, currentWordIndex, wordsSmashed, maxStreak, words, currentStreak]);

    useEffect(() => {
        if (typeof window === "undefined" || !moduleId || gameState !== "ACTIVE") {
            return;
        }
        sessionStorage.setItem(
            `wordomaticResume:${moduleId}`,
            JSON.stringify({
                moduleId,
                currentWordIndex,
                wordsSmashed,
                currentStreak,
                maxStreak,
                timeLeft,
            })
        );
    }, [
        gameState,
        currentWordIndex,
        wordsSmashed,
        currentStreak,
        maxStreak,
        timeLeft,
        moduleId,
    ]);

    useEffect(() => {
        if (gameState === "ACTIVE") {
            setIsWordReady(false);
            clearTimeout(wordEntryTimerRef.current);
            wordEntryTimerRef.current = setTimeout(() => {
                setIsWordReady(true);
            }, 500);
        }
        return () => clearTimeout(wordEntryTimerRef.current);
    }, [currentWordIndex, gameState]);

    useEffect(() => {
        return () => {
            clearTimeout(mispronounceTimerRef.current);
            clearTimeout(wordRecognizedTimerRef.current);
            clearTimeout(feedbackTimerRef.current);
            clearTimeout(streakShakeTimerRef.current);
            clearTimeout(wordTimeoutRef.current);
            clearTimeout(pointsFeedbackTimerRef.current);
            clearTimeout(scoreEmphasizeTimerRef.current);
            clearTimeout(wordEntryTimerRef.current);
        };
    }, []);

    const clearResume = useCallback(() => {
        clearResumeSession(moduleId);
    }, [moduleId]);

    useEffect(() => {
        if (gameState === "COMPLETED" || gameState === "GAMEOVER") {
            clearResume();
            hasSaved.current = false;
        }
    }, [gameState, clearResume]);

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => Math.min(prev + 1, totalWords));
    }, [totalWords]);

    const targetWord = useMemo(() => {
        return normalizeWord(words[currentWordIndex]?.word);
    }, [currentWordIndex, words]);

    const persistProgress = useCallback(() => {
        if (!hasSaved.current) {
            hasSaved.current = true;
            router.post(
                saveEndpoint,
                {
                    module_id: moduleId,
                    words_smashed: wordsSmashedRef.current,
                    words_processed: currentWordIndexRef.current,
                    streak: maxStreakRef.current,
                },
                { preserveState: true }
            );
        }
    }, [moduleId, saveEndpoint]);

    const persistProgressRef = useRef(persistProgress);
    persistProgressRef.current = persistProgress;

    useEffect(() => {
        if (gameState === "ACTIVE" && currentWordIndex >= totalWords && totalWords > 0) {
            persistProgressRef.current();
            setGameState("COMPLETED");
        }
    }, [currentWordIndex, totalWords, gameState]);

    const handleWordRecognized = useCallback(() => {
        if (wordRecognizedGuardRef.current) return;
        wordRecognizedGuardRef.current = true;

        clearTimeout(wordTimeoutRef.current);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceGuardRef.current = false;
        playSuccessSound();

        const wordObj = wordsRef.current[currentWordIndexRef.current];
        if (!wordObj) {
            wordRecognizedGuardRef.current = false;
            return;
        }
        onWordRecognizedRef.current?.(wordObj);

        const points = 1;
        setWordsSmashed((prev) => prev + points);
        currentStreakRef.current += 1;
        setCurrentStreak(currentStreakRef.current);
        setMaxStreak((m) => Math.max(m, currentStreakRef.current));
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        pointsFeedbackTimerRef.current = setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        scoreEmphasizeTimerRef.current = setTimeout(() => setScoreEmphasize(false), 500);

        const streak = currentStreakRef.current;
        const fbMsg = getStreakFeedbackMessage(streak);
        setFeedbackMessage(fbMsg);
        setFeedbackType("correct");
        playFeedbackSound(fbMsg);
        feedbackTimerRef.current = setTimeout(() => {
            setFeedbackType(null);
        }, 600);

        if (streak >= 2) {
            const intensity = getStreakShakeIntensity(streak);
            setStreakShake(intensity);
            streakShakeTimerRef.current = setTimeout(() => {
                setStreakShake(null);
            }, intensity === "intense" ? 500 : 400);
        }

        setIsMispronounced(false);
        setIsExploding(true);
        wordRecognizedTimerRef.current = setTimeout(() => {
            setIsExploding(false);
            moveToNextWord();
            wordRecognizedGuardRef.current = false;
        }, 500);
    }, [moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        if (mispronounceGuardRef.current) return;
        mispronounceGuardRef.current = true;

        clearTimeout(wordTimeoutRef.current);
        clearTimeout(wordRecognizedTimerRef.current);
        wordRecognizedGuardRef.current = false;
        const wordObj = wordsRef.current[currentWordIndexRef.current];
        if (!wordObj) {
            mispronounceGuardRef.current = false;
            return;
        }
        onMispronounceRef.current?.(wordObj);

        currentStreakRef.current = 0;
        setCurrentStreak(0);
        const mispMsgs = ["Almost!", "Try Again!", "So Close!", "Keep Going!", "Nice Try!"];
        const mispMsg = mispMsgs[Math.floor(Math.random() * mispMsgs.length)];
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(mispMsg);
        setFeedbackType("mispronounce");
        playMispronounceSound();
        playFeedbackSound(mispMsg);
        feedbackTimerRef.current = setTimeout(() => {
            setFeedbackType(null);
        }, 700);

        setIsMispronounced(true);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceTimerRef.current = setTimeout(() => {
            setIsMispronounced(false);
            mispronounceGuardRef.current = false;
            moveToNextWord();
        }, 800);
    }, [moveToNextWord]);

    // FIX: Moved ref assignment into useEffect for React 18 safety
    useEffect(() => {
        onMispronounceFnRef.current = handleMispronounce;
    }, [handleMispronounce]);

    useEffect(() => {
        if (gameState === "ACTIVE" && isWordReady) {
            clearTimeout(wordTimeoutRef.current);
            wordTimeoutRef.current = setTimeout(
                () => onMispronounceFnRef.current(),
                5000
            );
        }
        return () => clearTimeout(wordTimeoutRef.current);
    }, [currentWordIndex, gameState, isWordReady]);

    const handleTimeUp = useCallback(() => {
        clearAllTimers({
            mispronounceTimer: mispronounceTimerRef.current,
            wordRecognizedTimer: wordRecognizedTimerRef.current,
            wordTimeout: wordTimeoutRef.current,
            feedbackTimer: feedbackTimerRef.current,
            pointsFeedbackTimer: pointsFeedbackTimerRef.current,
            scoreEmphasizeTimer: scoreEmphasizeTimerRef.current,
            streakShakeTimer: streakShakeTimerRef.current,
            wordEntryTimer: wordEntryTimerRef.current,
        });
        setIsExploding(false);
        persistProgress();
        clearResume();
        
        if (currentWordIndexRef.current >= totalWords) {
            setGameState("COMPLETED");
        } else {
            setGameState("GAMEOVER");
        }
    }, [persistProgress, totalWords, clearResume]);

    useEffect(() => {
        if (gameState !== "ACTIVE") return;
        const id = setInterval(() => {
            setTimeLeft((prev) => {
                if (prev <= 1) {
                    clearInterval(id);
                    handleTimeUp();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(id);
    }, [gameState, handleTimeUp]);

    const countdownValue = useCountdown(gameState, () => setGameState("ACTIVE"));

    const startGame = useCallback(() => {
        setGameState((prev) => (prev === "IDLE" ? "COUNTDOWN" : prev));
    }, []);

    return {
        totalWords,
        gameState,
        setGameState,
        currentWordIndex,
        wordsSmashed,
        maxStreak,
        currentStreak,
        isMispronounced,
        isExploding,
        showPointsFeedback,
        pointsFeedbackValue,
        scoreEmphasize,
        feedbackType,
        feedbackMessage,
        isWordReady,
        streakShake,
        countdownValue,
        targetWord,
        timeLeft,
        isResume: !!resume,
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
    };
}