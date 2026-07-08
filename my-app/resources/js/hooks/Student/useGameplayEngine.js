import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCountdown } from "./useCountdown";
import { router } from "@inertiajs/react";
import { playSuccessSound, playFeedbackSound, playMispronounceSound } from "@/utils/sounds";

export function useGameplayEngine({
    words = [],
    totalWords = 0,
    moduleId,
    saveEndpoint,
    onWordRecognized,
    onMispronounce,
    getPoints,
    onComplete,
    onTimeUp: onTimeUpOverride,
}) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [wordsSmashed, setWordsSmashed] = useState(0);
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

    const currentStreakRef = useRef(0);
    const hasSaved = useRef(false);
    const wordTimeoutRef = useRef(null);
    const feedbackTimerRef = useRef(null);
    const isMountedRef = useRef(true);
    const currentWordIndexRef = useRef(0);
    const completionTimerRef = useRef(null);
    const wordEntryTimerRef = useRef(null);
    const streakShakeTimerRef = useRef(null);
    const showPointsFeedbackTimerRef = useRef(null);
    const scoreEmphasizeTimerRef = useRef(null);
    const wordsSmashedRef = useRef(0);
    const wordCountRef = useRef(0);
    const mispronounceTimerRef = useRef(null);
    const mispronounceGuardRef = useRef(false);
    const wordRecognizedTimerRef = useRef(null);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onMispronounceRef = useRef(onMispronounce);
    const onMispronounceFnRef = useRef(null);

    onWordRecognizedRef.current = onWordRecognized;
    onMispronounceRef.current = onMispronounce;

    useEffect(() => {
        if (gameState === "ACTIVE") {
            setIsWordReady(false);
            clearTimeout(wordEntryTimerRef.current);
            wordEntryTimerRef.current = setTimeout(() => {
                setIsWordReady(true);
                clearTimeout(wordTimeoutRef.current);
                wordTimeoutRef.current = setTimeout(
                    () => onMispronounceFnRef.current(),
                    5000,
                );
            }, 1000);
        }
        return () => {
            clearTimeout(wordEntryTimerRef.current);
            clearTimeout(wordTimeoutRef.current);
        };
    }, [currentWordIndex, gameState]);

    useEffect(() => {
        return () => {
            isMountedRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            clearTimeout(wordRecognizedTimerRef.current);
            clearTimeout(feedbackTimerRef.current);
            clearTimeout(streakShakeTimerRef.current);
            clearTimeout(wordTimeoutRef.current);
            clearTimeout(showPointsFeedbackTimerRef.current);
            clearTimeout(scoreEmphasizeTimerRef.current);
            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
        };
    }, []);

    const moveToNextWord = useCallback(() => {
        setCurrentWordIndex((prev) => {
            const next = Math.min(prev + 1, totalWords);
            currentWordIndexRef.current = next;
            return next;
        });
    }, [totalWords]);

    const targetWord = useMemo(() => {
        const allWords = words.map((w) => w.word);
        return (
            allWords[currentWordIndex]
                ?.replace(/[^\w\s]/g, "")
                .toLowerCase() || ""
        );
    }, [words, currentWordIndex]);

    const persistProgress = useCallback(() => {
        if (!hasSaved.current) {
            hasSaved.current = true;
            router.post(
                saveEndpoint,
                {
                    module_id: moduleId,
                    words_smashed: wordsSmashedRef.current,
                    words_count: wordCountRef.current,
                    streak: currentStreakRef.current,
                },
                {
                    preserveScroll: true,
                },
            );
        }
    }, [moduleId, saveEndpoint]);

    const persistProgressRef = useRef(persistProgress);
    persistProgressRef.current = persistProgress;

    useEffect(() => {
        if (
            gameState === "ACTIVE" &&
            currentWordIndex >= totalWords &&
            totalWords > 0
        ) {
            if (onComplete) {
                onComplete();
                return;
            }
            persistProgressRef.current();

            if (completionTimerRef.current)
                clearTimeout(completionTimerRef.current);
            completionTimerRef.current = setTimeout(() => {
                if (isMountedRef.current) {
                    setGameState(wordCountRef.current > 0 ? "COMPLETED" : "GAMEOVER");
                }
            }, 1200);
        }
    }, [currentWordIndex, totalWords, wordsSmashed, gameState, onComplete]);

    const handleWordRecognized = useCallback(() => {
        playSuccessSound()
        const wordObj = words[currentWordIndexRef.current];
        onWordRecognizedRef.current?.(wordObj);

        const points = typeof getPoints === "function" ? getPoints(wordObj) : wordObj?.points ?? 1;
        setWordsSmashed((prev) => {
            const next = prev + points;
            wordsSmashedRef.current = next;
            return next;
        });
        wordCountRef.current += 1;
        currentStreakRef.current += 1;
        setCurrentStreak(currentStreakRef.current);
        setPointsFeedbackValue(points);
        setShowPointsFeedback(true);
        clearTimeout(showPointsFeedbackTimerRef.current);
        showPointsFeedbackTimerRef.current = setTimeout(() => setShowPointsFeedback(false), 500);
        setScoreEmphasize(true);
        clearTimeout(scoreEmphasizeTimerRef.current);
        scoreEmphasizeTimerRef.current = setTimeout(() => setScoreEmphasize(false), 500);

        const streak = currentStreakRef.current;
        let fbMsg;
        if (streak >= 6) fbMsg = "Excellent!";
        else if (streak >= 4) fbMsg = "Great Job!";
        else if (streak >= 2) fbMsg = "Great!";
        else fbMsg = "Good!";
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(fbMsg);
        setFeedbackType("correct");
        playFeedbackSound(fbMsg)
        feedbackTimerRef.current = setTimeout(() => {
            setFeedbackType(null);
        }, 600);

        if (streak >= 2) {
            clearTimeout(streakShakeTimerRef.current);
            const intensity = streak >= 8 ? "intense" : streak >= 5 ? "medium" : "subtle";
            setStreakShake(intensity);
            streakShakeTimerRef.current = setTimeout(() => {
                setStreakShake(null);
            }, intensity === "intense" ? 500 : 400);
        }

        clearTimeout(wordTimeoutRef.current);
        clearTimeout(mispronounceTimerRef.current);
        mispronounceGuardRef.current = false;
        setIsMispronounced(false);

        clearTimeout(wordRecognizedTimerRef.current);
        setIsExploding(true);
        wordRecognizedTimerRef.current = setTimeout(() => {
            setIsExploding(false);
            moveToNextWord();
        }, 500);
    }, [moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        if (mispronounceGuardRef.current) return
        mispronounceGuardRef.current = true

        clearTimeout(wordTimeoutRef.current);
        const wordObj = words[currentWordIndexRef.current];
        onMispronounceRef.current?.(wordObj);

        currentStreakRef.current = 0;
        setCurrentStreak(0);
        const mispMsgs = ["Almost!", "Try Again!", "So Close!", "Keep Going!", "Nice Try!"];
        const mispMsg = mispMsgs[Math.floor(Math.random() * mispMsgs.length)]
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(mispMsg);
        setFeedbackType("mispronounce");
        playMispronounceSound()
        playFeedbackSound(mispMsg)
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

    onMispronounceFnRef.current = handleMispronounce;

    const handleTimeUp = useCallback(() => {
        clearTimeout(mispronounceTimerRef.current);
        clearTimeout(wordRecognizedTimerRef.current);
        clearTimeout(wordTimeoutRef.current);
        setIsExploding(false);
        if (onTimeUpOverride) {
            onTimeUpOverride();
            return;
        }
        persistProgress();
        if (wordCountRef.current > 0) {
            setGameState("COMPLETED");
        } else {
            setGameState("GAMEOVER");
        }
    }, [persistProgress, totalWords, onTimeUpOverride]);

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    const startGame = useCallback(() => {
        setGameState((prev) => (prev === "IDLE" ? "COUNTDOWN" : prev));
    }, []);

    return {
        totalWords,
        gameState,
        setGameState,
        currentWordIndex,
        wordsSmashed,
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
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
    };
}
