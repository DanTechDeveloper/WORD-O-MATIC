import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";

export function useSpeechRecognition({
    isActive,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
    matchMode = "word",
}) {
    const recognitionRef = useRef(null);
    const isWordMode = matchMode === "word";

    const gameStateRef = useRef(isActive);
    gameStateRef.current = isActive;

    const targetWordRef = useRef(targetWord);
    targetWordRef.current = targetWord;

    const onWordRecognizedRef = useRef(onWordRecognized);
    onWordRecognizedRef.current = onWordRecognized;

    const onPermissionDeniedRef = useRef(onPermissionDenied);
    onPermissionDeniedRef.current = onPermissionDenied;

    const onMispronouncedRef = useRef(onMispronounced);
    onMispronouncedRef.current = onMispronounced;

    const onRecognitionErrorRef = useRef(onRecognitionError);
    onRecognitionErrorRef.current = onRecognitionError;

    const hasMatchedCurrentRef = useRef(false);
    const lastProcessedIndexRef = useRef(-1);
    const isMountedRef = useRef(false);
    const mispronounceTimeoutRef = useRef(null);
    const gracePeriodEndRef = useRef(0);
    const restartRetryCountRef = useRef(0);
    const restartTimerRef = useRef(null);

    const clearTimers = () => {
        if (mispronounceTimeoutRef.current) {
            clearTimeout(mispronounceTimeoutRef.current);
            mispronounceTimeoutRef.current = null;
        }
        if (restartTimerRef.current) {
            clearTimeout(restartTimerRef.current);
            restartTimerRef.current = null;
        }
    };

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearTimers();
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            recognition.continuous = true;
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                if (!gameStateRef.current) return;
                if (isWordMode) return;

                if (mispronounceTimeoutRef.current)
                    clearTimeout(mispronounceTimeoutRef.current);

                const target = targetWordRef.current.toLowerCase().trim();
                if (!target) return;

                let matchedThisEvent = false;
                let latestTranscript = "";

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (i <= lastProcessedIndexRef.current) continue;

                    const result = event.results[i];
                    if (!result) continue;

                    const transcript = (result[0]?.transcript ?? "")
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) continue;

                    latestTranscript = transcript;

                    const wordsInTranscript = transcript.split(/\s+/);
                    const isMatch = wordsInTranscript.some(
                        (w) => isFuzzyMatch(w, target),
                    );

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        lastProcessedIndexRef.current = i;
                        onWordRecognizedRef.current?.();
                        if (isWordMode) break;
                    }

                    if (isWordMode) {
                        if (result.isFinal) {
                            lastProcessedIndexRef.current = i;
                            if (!matchedThisEvent && !hasMatchedCurrentRef.current) {
                                if (mispronounceTimeoutRef.current)
                                    clearTimeout(mispronounceTimeoutRef.current);
                                mispronounceTimeoutRef.current = setTimeout(() => {
                                    if (
                                        isMountedRef.current &&
                                        gameStateRef.current &&
                                        !hasMatchedCurrentRef.current
                                    ) {
                                        onMispronouncedRef.current?.(latestTranscript);
                                    }
                                }, 200);
                            }
                        }
                    } else {
                        lastProcessedIndexRef.current = i;
                    }
                }

                if (isWordMode) {
                    if (
                        !matchedThisEvent &&
                        !hasMatchedCurrentRef.current &&
                        latestTranscript &&
                        Date.now() >= gracePeriodEndRef.current
                    ) {
                        if (!mispronounceTimeoutRef.current) {
                            mispronounceTimeoutRef.current = setTimeout(() => {
                                if (
                                    isMountedRef.current &&
                                    gameStateRef.current &&
                                    !hasMatchedCurrentRef.current
                                ) {
                                    onMispronouncedRef.current?.(latestTranscript);
                                }
                            }, 500);
                        }
                    }
                } else if (
                    !matchedThisEvent &&
                    !hasMatchedCurrentRef.current &&
                    latestTranscript
                ) {
                    mispronounceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            gameStateRef.current &&
                            !hasMatchedCurrentRef.current
                        ) {
                            onMispronouncedRef.current?.(latestTranscript);
                        }
                    }, 900);
                }
            };

            recognition.onerror = (event) => {
                clearTimers();

                if (event.error === "aborted") {
                    console.warn(
                        "Speech Recognition Warning: aborted (expected behavior on stop/navigation)",
                    );
                } else if (event.error === "not-allowed") {
                    console.error(
                        "Speech Recognition Error: not-allowed",
                        event.error,
                    );
                    onPermissionDeniedRef.current?.();
                } else {
                    console.error("Speech Recognition Error:", event.error);
                    if (onRecognitionErrorRef.current)
                        onRecognitionErrorRef.current(event.error);
                }
            };

            recognition.onend = () => {
                lastProcessedIndexRef.current = -1;
                hasMatchedCurrentRef.current = false;
                restartRetryCountRef.current = 0;

                if (
                    !isMountedRef.current ||
                    !gameStateRef.current ||
                    (isWordMode)
                )
                    return;

                const tryRestart = () => {
                    if (
                        !isMountedRef.current ||
                        !gameStateRef.current ||
                        (isWordMode)
                    ) {
                        restartRetryCountRef.current = 0;
                        return;
                    }

                    try {
                        recognitionRef.current?.start();
                        restartRetryCountRef.current = 0;
                    } catch (e) {
                        restartRetryCountRef.current += 1;
                        if (restartRetryCountRef.current <= 2) {
                            const delays = [0, 500, 1000];
                            restartTimerRef.current = setTimeout(
                                tryRestart,
                                delays[restartRetryCountRef.current],
                            );
                        } else {
                            console.warn(
                                "Speech recognition restart failed after 3 attempts",
                            );
                            restartRetryCountRef.current = 0;
                        }
                    }
                };

                restartTimerRef.current = setTimeout(tryRestart, 300);
            };

            recognitionRef.current = recognition;
        }
    }, []);

    useEffect(() => {
        hasMatchedCurrentRef.current = false;
        lastProcessedIndexRef.current = -1;
        clearTimers();
        if (isWordMode) {
            gracePeriodEndRef.current = Date.now() + 900;
        }
    }, [targetWord]);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isActive) {
            try {
                recognition.start();
            } catch {
                // already running
            }
        } else {
            try {
                recognition.stop();
            } catch {
                // already stopped
            }
        }
    }, [isActive]);
}
