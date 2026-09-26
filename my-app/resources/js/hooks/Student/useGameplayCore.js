import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useCountdown } from "./useCountdown";
import { router } from "@inertiajs/react";
import { playSuccessSound, playFeedbackSound, playMispronounceFeedback } from "@/utils/sounds";
import { readResumeSession, clearResumeSession, readPendingSession, writePendingSession, clearPendingSession } from "@/utils/resumeStorage";
import { normalizeText as normalizeWord } from "@/lib/speechUtils";
import { clearAllTimers } from "@/lib/speechProcessors";

function getStreakFeedbackMessage(streak) {
    if (streak >= 6) return "Excellent!";
    if (streak >= 4) return "Nailed It!";
    if (streak >= 2) return "Great!";
    return "Awesome!";
}

function getStreakShakeIntensity(streak) {
    if (streak >= 8) return "intense";
    if (streak >= 5) return "medium";
    return "subtle";
}

export function useGameplayCore({
    words = [],
    totalWords = 0,
    moduleId,
    saveEndpoint,
    onWordRecognized,
    onMispronounce,
    resumeData,
    persistExtra,
    deferPersist = false,
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
    const [streakShake, setStreakShake] = useState(null);
    const [maxStreak, setMaxStreak] = useState(() => resume?.maxStreak ?? 0);
    const [timeLeft, setTimeLeft] = useState(() => {
        const raw = resume?.timeLeft ?? 60;
        return Math.max(0, Math.min(60, Math.floor(raw)));
    });
    const [isSaving, setIsSaving] = useState(false);
    // ponytail: the only re-render source for connectivity. Lives here because
    // BOTH pages reach this hook (Story Quest via useStoryQuestEngine's
    // `...core` spread), so one subscription covers Word Blast + Story Quest
    // and no new hook file exists. RENDER-ONLY — the click-time gate reads
    // navigator.onLine directly, because state can lag the event by a render.
    // !== false, not navigator.onLine: undefined under Node/SSR must read
    // as online, matching the gate's fail-open.
    const [online, setOnline] = useState(() => navigator.onLine !== false);

    useEffect(() => {
        const sync = () => setOnline(navigator.onLine !== false);
        window.addEventListener("online", sync);
        window.addEventListener("offline", sync);
        return () => {
            window.removeEventListener("online", sync);
            window.removeEventListener("offline", sync);
        };
    }, []);

    const currentStreakRef = useRef(currentStreak);
    const hasSaved = useRef(false);
    const feedbackTimerRef = useRef(null);
    const currentWordIndexRef = useRef(currentWordIndex);
    const streakShakeTimerRef = useRef(null);
    const wordsSmashedRef = useRef(wordsSmashed);
    const mispronounceTimerRef = useRef(null);
    const mispronounceGuardRef = useRef(false);
    const wordRecognizedTimerRef = useRef(null);
    const pointsFeedbackTimerRef = useRef(null);
    const scoreEmphasizeTimerRef = useRef(null);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onMispronounceRef = useRef(onMispronounce);
    const wordsRef = useRef(words);
    const wordRecognizedGuardRef = useRef(false);
    const maxStreakRef = useRef(maxStreak);
    const gameStateRef = useRef(gameState);

    useEffect(() => {
        onWordRecognizedRef.current = onWordRecognized;
        onMispronounceRef.current = onMispronounce;
        currentWordIndexRef.current = currentWordIndex;
        wordsSmashedRef.current = wordsSmashed;
        maxStreakRef.current = maxStreak;
        wordsRef.current = words;
        currentStreakRef.current = currentStreak;
        gameStateRef.current = gameState;
    }, [onWordRecognized, onMispronounce, currentWordIndex, wordsSmashed, maxStreak, words, currentStreak, gameState]);

    // ponytail: clamp resume indices after words load (initial totalWords may be 0)
    useEffect(() => {
        if (totalWords > 0) {
            setCurrentWordIndex((prev) => (prev > totalWords ? totalWords : prev));
            setWordsSmashed((prev) => (prev > totalWords ? totalWords : prev));
        }
    }, [totalWords]);

    // Reset one-shot save guard when module changes (SPA navigation may reuse hook)
    useEffect(() => {
        hasSaved.current = false;
    }, [moduleId]);

    // ponytail: replay pending commit after an F5 while finishRound was in flight.
    // Sync-checked on mount — if the POST was aborted by a refresh, the payload
    // is still in sessionStorage and we re-POST it now. Tab-close clears it.
    // Tutorial (deferPersist) never writes pending, so this is no-op there.
    useEffect(() => {
        if (typeof window === "undefined" || !moduleId) return;
        if (deferPersist) {
            // ponytail: if an old pending somehow exists for a tutorial module,
            // clear it — tutorial is read-only, no replay.
            clearPendingSession(moduleId);
            return;
        }
        const pending = readPendingSession(moduleId);
        if (!pending) return;
        if (hasSaved.current) return;
        hasSaved.current = true;
        setIsSaving(true);
        const { saveEndpoint: pendingEndpoint, createdAt: _ca, moduleId: _mid, ...pendingPayload } = pending;
        // ponytail: saveEndpoint is client-controlled — whitelist to prevent tampered replay to arbitrary URL
        const ALLOWED = ["/student/saveWordProgress", "/student/saveParagraphProgress"];
        const endpoint = pendingEndpoint && ALLOWED.includes(pendingEndpoint) ? pendingEndpoint : saveEndpoint;
        router.post(endpoint, pendingPayload, {
            preserveState: true,
            onSuccess: () => {
                clearPendingSession(moduleId);
                clearResumeSession(moduleId);
            },
            onError: (errors) => {
                const hasValidationErrors = errors && Object.keys(errors).length > 0;
                if (hasValidationErrors) clearPendingSession(moduleId);
                hasSaved.current = false;
            },
            onFinish: () => setIsSaving(false),
        });
    }, [moduleId, saveEndpoint, deferPersist]);

    useEffect(() => {
        if (typeof window === "undefined" || !moduleId || gameState !== "ACTIVE") {
            return;
        }
        // ponytail: clamp timeLeft 0-60 and stamp savedAt for wall-clock correction on resume (prevents 60s reset exploit)
        const tl = Math.max(0, Math.min(60, Math.floor(timeLeft)));
        sessionStorage.setItem(
            `wordomaticResume:${moduleId}`,
            JSON.stringify({
                moduleId,
                currentWordIndex,
                wordsSmashed,
                currentStreak,
                maxStreak,
                timeLeft: tl,
                savedAt: Date.now(),
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
        return () => {
            clearTimeout(mispronounceTimerRef.current);
            clearTimeout(wordRecognizedTimerRef.current);
            clearTimeout(feedbackTimerRef.current);
            clearTimeout(streakShakeTimerRef.current);
            clearTimeout(pointsFeedbackTimerRef.current);
            clearTimeout(scoreEmphasizeTimerRef.current);
        };
    }, []);

    const clearResume = useCallback(() => {
        clearResumeSession(moduleId);
    }, [moduleId]);

    // ponytail: post-fatal-ASR recovery. Refill the clock instead of "pausing"
    // it — the 60s interval is ACTIVE-gated so it already froze, and a dropout at
    // t=58s would leave 2 playable seconds. Return to IDLE so TapToStartOverlay
    // comes back (it only renders at IDLE, never COUNTDOWN).
    // Position is deliberately KEPT (startGame() resets no counters, so wiping it
    // would hand back word 7-of-10 with 2s left). Keeping the Story Quest
    // verdicts matters too: useStoryQuestEngine early-returns on
    // `verdicts[idx] !== undefined`, so clearing them makes every already-read
    // sentence a silent dead input. resumeStorage.js needs no change — both
    // resume writers are ACTIVE-gated, so the key reappears on its own.
    // The four visual clears are mandatory: clearAllTimers just orphaned their
    // timers, so nothing else would ever reset them.
    const refillRoundClock = useCallback(() => {
        setTimeLeft(60);
        setIsMispronounced(false);
        setIsExploding(false);
        setFeedbackType(null);
        setFeedbackMessage("");
        // Microphone is disabled on isSaving — clear it so the retry is playable.
        setIsSaving(false);
        // handleFatalError consumed the one-shot save guard; the retry must persist.
        hasSaved.current = false;
        setGameState("IDLE");
    }, []);

    useEffect(() => {
        if (gameState === "COMPLETED" || gameState === "GAMEOVER") {
            // Note: hasSaved stays true here — the save is still in flight and
            // the page unmounts on the results redirect. Resetting it now would
            // let a stray second persistProgress double-post the round.
            clearResume();
        }
    }, [gameState, clearResume]);

    const moveToNextWord = useCallback((step = 1) => {
        const n = Math.max(1, step | 0 || 1);
        setCurrentWordIndex((prev) => Math.min(prev + n, totalWords));
    }, [totalWords]);

    // ponytail: additive SQ escape hatch — lets the Story Quest wrapper add
    // points without touching the per-word feedback machine. Word Blast
    // never calls this; default behavior unchanged.
    const addScore = useCallback((n) => {
        const pts = Math.max(0, n | 0 || 0);
        if (pts > 0) setWordsSmashed((prev) => prev + pts);
    }, []);

    const targetWord = useMemo(() => {
        return normalizeWord(words[currentWordIndex]?.word);
    }, [currentWordIndex, words]);

    const persistProgress = useCallback(() => {
        if (!hasSaved.current) {
            hasSaved.current = true;
            // ponytail: persistExtra rides along for mode-specific detail
            // (SQ sentence_scores); read via ref so inline arrows never churn
            // persistProgress identity (would reset the 60s timer effect).
            const extra = typeof persistExtraRef.current === "function"
                ? persistExtraRef.current()
                : (persistExtraRef.current || {});
            const clientToken = `${Date.now()}-${Math.random().toString(36).slice(2,7)}`;
            const payload = {
                module_id: moduleId,
                words_smashed: wordsSmashedRef.current,
                words_processed: currentWordIndexRef.current,
                streak: maxStreakRef.current,
                ...extra,
                client_token: clientToken,
            };
            // ponytail: tutorial is read-only (deferPersist=true) — no durable
            // pending, no replay. Keeps level 0 onboarding isolated even if
            // finishRound is slow; post-onboarding level 0 replay goes durable
            // but server still gates it via !module.is_tutorial (BF24).
            if (deferPersist) {
                // strip idempotency token for tutorial (read-only, no dedup needed)
                const { client_token: _ct, ...payloadNoToken } = payload;
                router.post(saveEndpoint, payloadNoToken, { preserveState: true });
                return;
            }
            // ponytail: durable commit — sync write before POST so an F5
            // while finishRound is slow still has the payload to replay.
            // client_token makes the replay idempotent server-side (no duplicate row).
            writePendingSession(moduleId, {
                saveEndpoint,
                ...payload,
                createdAt: Date.now(),
            });
            setIsSaving(true);
            router.post(saveEndpoint, payload, {
                preserveState: true,
                onSuccess: () => {
                    clearPendingSession(moduleId);
                    clearResumeSession(moduleId);
                },
                onError: (errors) => {
                    // ponytail: validation errors (e.g. words_processed > total)
                    // are not retryable — drop the pending so we don't loop.
                    const hasValidationErrors = errors && Object.keys(errors).length > 0;
                    if (hasValidationErrors) {
                        clearPendingSession(moduleId);
                    }
                    hasSaved.current = false;
                },
                onFinish: () => setIsSaving(false),
            });
        }
    }, [moduleId, saveEndpoint, deferPersist]);

    const persistProgressRef = useRef(persistProgress);
    persistProgressRef.current = persistProgress;

    const persistExtraRef = useRef(persistExtra);
    persistExtraRef.current = persistExtra;

    useEffect(() => {
        if (gameState === "ACTIVE" && currentWordIndex >= totalWords && totalWords > 0) {
            if (!deferPersist) persistProgressRef.current();
            setGameState("COMPLETED");
        }
    }, [currentWordIndex, totalWords, gameState, deferPersist]);

    const handleWordRecognized = useCallback((count = 1) => {
        if (gameStateRef.current !== "ACTIVE") return;
        if (wordRecognizedGuardRef.current) return;
        wordRecognizedGuardRef.current = true;

        if (mispronounceGuardRef.current) {
            mispronounceGuardRef.current = false;
            clearTimeout(mispronounceTimerRef.current);
            setIsMispronounced(false);
        }

        clearTimeout(mispronounceTimerRef.current);
        mispronounceGuardRef.current = false;

        const wordObj = wordsRef.current[currentWordIndexRef.current];
        if (!wordObj) {
            wordRecognizedGuardRef.current = false;
            return;
        }
        const remaining = totalWords - currentWordIndexRef.current;
        const advance = Math.max(1, Math.min(count | 0 || 1, Math.max(remaining, 1)));

        setIsExploding(true);
        playSuccessSound();
        for (let k = 0; k < advance; k++) {
            const w = wordsRef.current[currentWordIndexRef.current + k];
            if (w) onWordRecognizedRef.current?.(w);
        }

        const points = advance;
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
        wordRecognizedTimerRef.current = setTimeout(() => {
            setIsExploding(false);
            moveToNextWord(advance);
            wordRecognizedGuardRef.current = false;
        }, 500);
    }, [moveToNextWord]);

    const handleMispronounce = useCallback(() => {
        if (gameStateRef.current !== "ACTIVE") return;
        if (mispronounceGuardRef.current) return;
        mispronounceGuardRef.current = true;

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
        const mispMsgs = ["Keep Trying!", "Not Quite!", "Nope!", "Try Again", "Again!"];
        const mispMsg = mispMsgs[Math.floor(Math.random() * mispMsgs.length)];
        clearTimeout(feedbackTimerRef.current);
        setFeedbackMessage(mispMsg);
        setFeedbackType("mispronounce");
        playMispronounceFeedback();
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

    const handleTimeUp = useCallback(() => {
        clearAllTimers({
            mispronounceTimer: mispronounceTimerRef.current,
            wordRecognizedTimer: wordRecognizedTimerRef.current,
            feedbackTimer: feedbackTimerRef.current,
            pointsFeedbackTimer: pointsFeedbackTimerRef.current,
            scoreEmphasizeTimer: scoreEmphasizeTimerRef.current,
            streakShakeTimer: streakShakeTimerRef.current,
        });
        setIsExploding(false);
        if (!deferPersist) persistProgress();
        clearResume();
        
        if (currentWordIndexRef.current >= totalWords) {
            setGameState("COMPLETED");
        } else {
            setGameState("GAMEOVER");
        }
    }, [persistProgress, totalWords, clearResume, deferPersist]);

    const handleFatalError = useCallback(() => {
        clearAllTimers({
            mispronounceTimer: mispronounceTimerRef.current,
            wordRecognizedTimer: wordRecognizedTimerRef.current,
            feedbackTimer: feedbackTimerRef.current,
            pointsFeedbackTimer: pointsFeedbackTimerRef.current,
            scoreEmphasizeTimer: scoreEmphasizeTimerRef.current,
            streakShakeTimer: streakShakeTimerRef.current,
        });
        if (!deferPersist) persistProgress();
        clearResume();
        setGameState("GAMEOVER");
    }, [persistProgress, clearResume, deferPersist]);

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
        // Fresh round: re-arm the one-shot save guard (fresh mounts start false;
        // this covers any reuse of the hook without a remount).
        hasSaved.current = false;
        setIsSaving(false);
        wordRecognizedGuardRef.current = false;
        mispronounceGuardRef.current = false;
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
        streakShake,
        countdownValue,
        targetWord,
        timeLeft,
        isResume: !!resume,
        isSaving,
        online,
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
        handleFatalError,
        moveToNextWord,
        addScore,
        persistProgress,
        refillRoundClock,
        targetWordFalsy: !targetWord,
    };
}