import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";

function clearTimers(mispronounceTimeoutRef, restartTimerRef) {
    if (mispronounceTimeoutRef.current) {
        clearTimeout(mispronounceTimeoutRef.current);
        mispronounceTimeoutRef.current = null;
    }
    if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
    }
}

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

    const propsRef = useRef({
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
    })
    propsRef.current = {
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
    }

    const hasMatchedCurrentRef = useRef(false);
    const lastProcessedIndexRef = useRef(-1);
    const isMountedRef = useRef(false);
    const mispronounceTimeoutRef = useRef(null);
    const gracePeriodEndRef = useRef(0);
    const restartRetryCountRef = useRef(0);
    const restartTimerRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearTimers(mispronounceTimeoutRef, restartTimerRef);
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
                if (!propsRef.current.isActive) return;
                clearTimeout(mispronounceTimeoutRef.current);
                mispronounceTimeoutRef.current = null;

                const target = propsRef.current.targetWord.toLowerCase().trim();
                if (!target) return;

                let matchedThisEvent = false;
                let latestTranscript = "";
                let innerPathHandled = false;

                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (i <= lastProcessedIndexRef.current) continue;

                    const result = event.results[i];
                    if (!result) continue;

                    const transcript = (result[0]?.transcript ?? "")
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) {
                        if (!propsRef.current.isWordMode) lastProcessedIndexRef.current = i;
                        continue;
                    }

                    latestTranscript = transcript;

                    const isMatch = propsRef.current.isWordMode
                        ? transcript.split(/\s+/).some((w) => isFuzzyMatch(w, target))
                        : isFuzzyMatch(transcript, target) || transcript.includes(target);

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        lastProcessedIndexRef.current = i;
                        propsRef.current.onWordRecognized?.();
                        if (propsRef.current.isWordMode) break;
                        continue;
                    }

                    if (propsRef.current.isWordMode && result.isFinal) {
                        lastProcessedIndexRef.current = i;
                        if (
                            !matchedThisEvent &&
                            !hasMatchedCurrentRef.current &&
                            Date.now() >= gracePeriodEndRef.current
                        ) {
                            clearTimeout(mispronounceTimeoutRef.current);
                            mispronounceTimeoutRef.current = setTimeout(() => {
                                if (
                                    isMountedRef.current &&
                                    propsRef.current.isActive &&
                                    !hasMatchedCurrentRef.current
                                ) {
                                    propsRef.current.onMispronounced?.(latestTranscript);
                                }
                            }, 200);
                        }
                        innerPathHandled = true;
                        break;
                    }

                    if (!propsRef.current.isWordMode) {
                        lastProcessedIndexRef.current = i;
                    }
                }

                if (matchedThisEvent) {
                    if (mispronounceTimeoutRef.current) {
                        clearTimeout(mispronounceTimeoutRef.current);
                        mispronounceTimeoutRef.current = null;
                    }
                    return;
                }

                if (hasMatchedCurrentRef.current) return;

                if (!latestTranscript) return;

                if (propsRef.current.isWordMode) {
                    if (innerPathHandled) return;
                    if (Date.now() < gracePeriodEndRef.current) return;

                    clearTimeout(mispronounceTimeoutRef.current);
                    mispronounceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            propsRef.current.isActive &&
                            !hasMatchedCurrentRef.current
                        ) {
                            propsRef.current.onMispronounced?.(latestTranscript);
                        }
                    }, 500);
                } else {
                    clearTimeout(mispronounceTimeoutRef.current);
                    mispronounceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            propsRef.current.isActive &&
                            !hasMatchedCurrentRef.current
                        ) {
                            propsRef.current.onMispronounced?.(latestTranscript);
                        }
                    }, 900);
                }
            };

            recognition.onerror = (event) => {
                clearTimers(mispronounceTimeoutRef, restartTimerRef);

                if (event.error === "aborted") {
                    console.warn(
                        "Speech Recognition Warning: aborted (expected behavior on stop/navigation)",
                    );
                } else if (event.error === "not-allowed") {
                    console.error(
                        "Speech Recognition Error: not-allowed",
                        event.error,
                    );
                    propsRef.current.onPermissionDenied?.();
                } else {
                    console.error("Speech Recognition Error:", event.error);
                    if (propsRef.current.onRecognitionError)
                        propsRef.current.onRecognitionError(event.error);
                }
            };

            recognition.onend = () => {
                clearTimers(mispronounceTimeoutRef, restartTimerRef);
                lastProcessedIndexRef.current = -1;
                hasMatchedCurrentRef.current = false;
                restartRetryCountRef.current = 0;

                if (!isMountedRef.current || !propsRef.current.isActive) return;

                const tryRestart = () => {
                    if (!isMountedRef.current || !propsRef.current.isActive) {
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

        return () => {
            clearTimers(mispronounceTimeoutRef, restartTimerRef);
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const wasMatched = hasMatchedCurrentRef.current;
        hasMatchedCurrentRef.current = false;
        lastProcessedIndexRef.current = -1;
        clearTimers(mispronounceTimeoutRef, restartTimerRef);
        if (isWordMode) {
            gracePeriodEndRef.current = Date.now() + 900;
        }
        if (wasMatched && recognitionRef.current && propsRef.current.isActive) {
            try { recognitionRef.current.stop(); } catch {}
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
