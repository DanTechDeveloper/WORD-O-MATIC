import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";

function clearTimers(
    mispronounceTimeoutRef,
    restartTimerRef,
    sentenceTimeoutRef,
) {
    if (mispronounceTimeoutRef.current) {
        clearTimeout(mispronounceTimeoutRef.current);
        mispronounceTimeoutRef.current = null;
    }
    if (restartTimerRef.current) {
        clearTimeout(restartTimerRef.current);
        restartTimerRef.current = null;
    }
    if (sentenceTimeoutRef.current) {
        clearTimeout(sentenceTimeoutRef.current);
        sentenceTimeoutRef.current = null;
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
    });
    propsRef.current = {
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
    };

    const hasMatchedCurrentRef = useRef(false);
    const lastProcessedIndexRef = useRef(-1);
    const isMountedRef = useRef(false);
    const mispronounceTimeoutRef = useRef(null);
    const gracePeriodEndRef = useRef(0);
    const restartRetryCountRef = useRef(0);
    const restartTimerRef = useRef(null);
    const sentenceTranscriptRef = useRef("");
    const sentenceInterimRef = useRef("");
    const speechStoppedAtRef = useRef(0);
    const mispronouncedInThisWordRef = useRef(false);
    const sentenceTimeoutRef = useRef(null);
    const sentenceTimeoutTargetRef = useRef(null);

    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearTimers(
                mispronounceTimeoutRef,
                restartTimerRef,
                sentenceTimeoutRef,
            );
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

                const target = propsRef.current.targetWord.toLowerCase().trim();
                if (!target) return;

                if (!propsRef.current.isWordMode) {
                    let newFinals = "";
                    let newInterim = "";
                    for (
                        let i = event.resultIndex;
                        i < event.results.length;
                        i++
                    ) {
                        const r = event.results[i];
                        if (r && r[0]) {
                            if (r.isFinal) {
                                newFinals += r[0].transcript + " ";
                            } else {
                                newInterim = r[0].transcript;
                            }
                        }
                    }
                    sentenceInterimRef.current = newInterim;
                    sentenceTranscriptRef.current += " " + newFinals;
                    const withInterim =
                        sentenceTranscriptRef.current + " " + newInterim;
                    const full = withInterim
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();
                    clearTimeout(sentenceTimeoutRef.current);
                    sentenceTimeoutTargetRef.current = target;
                    sentenceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            propsRef.current.isActive &&
                            !hasMatchedCurrentRef.current &&
                            sentenceTimeoutTargetRef.current ===
                                propsRef.current.targetWord
                                    ?.toLowerCase()
                                    .trim()
                        ) {
                            propsRef.current.onMispronounced?.(full);
                        }
                    }, 5000);
                    const spokenWordCount = full
                        .split(/\s+/)
                        .filter((w) => w.length > 0).length;
                    const targetWordCount = target
                        .split(/\s+/)
                        .filter((w) => w.length > 0).length;
                    speechStoppedAtRef.current = Date.now();
                    let matchedThisEvent = false;
                    if (
                        !hasMatchedCurrentRef.current &&
                        isFuzzyMatch(full, target) &&
                        spokenWordCount === targetWordCount
                    ) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        propsRef.current.onWordRecognized?.();
                    }
                    lastProcessedIndexRef.current = event.results.length - 1;
                    if (matchedThisEvent) {
                        clearTimeout(mispronounceTimeoutRef.current);
                        clearTimers(
                            mispronounceTimeoutRef,
                            restartTimerRef,
                            sentenceTimeoutRef,
                        );
                        return;
                    }
                    if (hasMatchedCurrentRef.current) return;
                    if (!full) return;
                    if (Date.now() < gracePeriodEndRef.current) return;
                    if (
                        speechStoppedAtRef.current &&
                        (spokenWordCount !== targetWordCount ||
                            !isFuzzyMatch(full, target))
                    ) {
                        clearTimeout(mispronounceTimeoutRef.current);
                        clearTimers(
                            mispronounceTimeoutRef,
                            restartTimerRef,
                            sentenceTimeoutRef,
                        );
                        propsRef.current.onMispronounced?.(full);
                        hasMatchedCurrentRef.current = false;
                        mispronouncedInThisWordRef.current = false;
                        return;
                    }
                }

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
                        continue;
                    }

                    speechStoppedAtRef.current = Date.now();
                    latestTranscript = transcript;

                    const wordsInTranscript = transcript.split(/\s+/);
                    const isMatch = wordsInTranscript.some((w) =>
                        isFuzzyMatch(w, target),
                    );

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        lastProcessedIndexRef.current = i;
                        propsRef.current.onWordRecognized?.();
                        if (result.isFinal) {
                            innerPathHandled = true;
                        }
                        break;
                    }

                    if (result.isFinal) {
                        lastProcessedIndexRef.current = i;
                        if (
                            !matchedThisEvent &&
                            !hasMatchedCurrentRef.current &&
                            Date.now() >= gracePeriodEndRef.current &&
                            !mispronouncedInThisWordRef.current
                        ) {
                            mispronouncedInThisWordRef.current = true;
                            propsRef.current.onMispronounced?.(
                                latestTranscript,
                            );
                        }
                        innerPathHandled = true;
                        break;
                    }
                }

                if (matchedThisEvent) {
                    clearTimeout(mispronounceTimeoutRef.current);
                    clearTimers(
                        mispronounceTimeoutRef,
                        restartTimerRef,
                        sentenceTimeoutRef,
                    );
                    mispronouncedInThisWordRef.current = false;
                    return;
                }

                if (hasMatchedCurrentRef.current) return;

                if (!latestTranscript) return;

                if (innerPathHandled) return;
                if (Date.now() < gracePeriodEndRef.current) return;
            };

            recognition.onerror = (event) => {
                clearTimers(
                    mispronounceTimeoutRef,
                    restartTimerRef,
                    sentenceTimeoutRef,
                );

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
                    if (
                        event.error !== "no-speech" &&
                        event.error !== "audio-capture" &&
                        event.error !== "network"
                    ) {
                        console.error("Speech Recognition Error:", event.error);
                        propsRef.current.onRecognitionError?.(event.error);
                    }
                }
            };

            recognition.onend = () => {
                clearTimers(
                    mispronounceTimeoutRef,
                    restartTimerRef,
                    sentenceTimeoutRef,
                );
                lastProcessedIndexRef.current = -1;
                hasMatchedCurrentRef.current = false;
                sentenceTranscriptRef.current = "";
                sentenceInterimRef.current = "";
                speechStoppedAtRef.current = 0;
                mispronouncedInThisWordRef.current = false;
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
                    } catch {
                        const delay = Math.min(
                            500 * 2 ** restartRetryCountRef.current,
                            3000,
                        );
                        restartRetryCountRef.current += 1;
                        restartTimerRef.current = setTimeout(tryRestart, delay);
                    }
                };

                restartTimerRef.current = setTimeout(tryRestart, 500);
            };

            recognitionRef.current = recognition;
        }

        return () => {
            clearTimers(
                mispronounceTimeoutRef,
                restartTimerRef,
                sentenceTimeoutRef,
            );
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
        sentenceTranscriptRef.current = "";
        sentenceInterimRef.current = "";
        speechStoppedAtRef.current = 0;
        mispronouncedInThisWordRef.current = false;
        sentenceTimeoutTargetRef.current = null;
        clearTimers(
            mispronounceTimeoutRef,
            restartTimerRef,
            sentenceTimeoutRef,
        );
        gracePeriodEndRef.current = Date.now() + 500;
        if (
            wasMatched &&
            recognitionRef.current &&
            propsRef.current.isActive &&
            propsRef.current.isWordMode
        ) {
            try {
                recognitionRef.current.stop();
            } catch {}
        }
        if (
            propsRef.current.isActive &&
            recognitionRef.current &&
            !recognitionRef.current.isListening
        ) {
            try {
                recognitionRef.current.start();
            } catch {}
        }
    }, [targetWord]);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isActive) {
            try {
                hasMatchedCurrentRef.current = false;
                lastProcessedIndexRef.current = -1;
                clearTimers(
                    mispronounceTimeoutRef,
                    restartTimerRef,
                    sentenceTimeoutRef,
                );
                recognition.start();
            } catch {}
        } else {
            try {
                clearTimers(
                    mispronounceTimeoutRef,
                    restartTimerRef,
                    sentenceTimeoutRef,
                );
                recognition.stop();
            } catch {}
        }
    }, [isActive]);
}
