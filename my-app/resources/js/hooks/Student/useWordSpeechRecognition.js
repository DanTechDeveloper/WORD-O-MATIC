import { useEffect, useRef } from "react";

export function useWordSpeechRecognition({
    isActive,
    isPaused,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    // Removed interim matching
    onMispronounced,
    onRecognitionError,
}) {
    const recognitionRef = useRef(null);

    // Point 1: Sync refs synchronously in the hook body to avoid Effect delay
    const gameStateRef = useRef(isActive);
    gameStateRef.current = isActive;

    const isPausedRef = useRef(isPaused);
    isPausedRef.current = isPaused;

    const targetWordRef = useRef(targetWord);
    targetWordRef.current = targetWord;

    const onWordRecognizedRef = useRef(onWordRecognized);
    onWordRecognizedRef.current = onWordRecognized;

    const onPermissionDeniedRef = useRef(onPermissionDenied);
    onPermissionDeniedRef.current = onPermissionDenied;

    // Removed interim matching
    const onMispronouncedRef = useRef(onMispronounced);
    onMispronouncedRef.current = onMispronounced;

    const onRecognitionErrorRef = useRef(onRecognitionError);
    onRecognitionErrorRef.current = onRecognitionError;

    const hasMatchedCurrentRef = useRef(false);

    // Removed processing lock
    const lastProcessedIndexRef = useRef(-1);
    const isMountedRef = useRef(false);
    const mispronounceTimeoutRef = useRef(null);
    const gracePeriodEndRef = useRef(0);
    const restartRetryCountRef = useRef(0);
    const restartTimerRef = useRef(null);

    // Track hook mount/unmount lifecycle
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (mispronounceTimeoutRef.current)
                clearTimeout(mispronounceTimeoutRef.current);
            if (restartTimerRef.current)
                clearTimeout(restartTimerRef.current);
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    // Approach 2: Persistent Engine Instance initialized once on mount
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

            // In the persistent instance useEffect:
            recognition.onresult = (event) => {
                // Bug #1 fix: guard against buffered results after stop/pause
                if (!gameStateRef.current || isPausedRef.current) return;

                // Clear timer on new voice input
                if (mispronounceTimeoutRef.current)
                    clearTimeout(mispronounceTimeoutRef.current);

                const target = targetWordRef.current.toLowerCase().trim();
                if (!target) return;
                // Fix for onMispronounced firing on partial transcripts:
                // Track whether we matched across all results in this event
                let matchedThisEvent = false;
                let latestTranscript = "";
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    if (i <= lastProcessedIndexRef.current) continue;

                    const result = event.results[i];
                    if (!result) continue;

                    // Bug #2 fix: null-coalesce before chaining
                    const transcript = (result[0]?.transcript ?? "")
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) continue;

                    // Get latest transcript (even interim)
                    latestTranscript = transcript;

                    const wordsInTranscript = transcript.split(/\s+/);
                    const isMatch = wordsInTranscript.includes(target);

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        lastProcessedIndexRef.current = i;
                        onWordRecognizedRef.current?.();
                        break;
                    }

                    if (result.isFinal) {
                        lastProcessedIndexRef.current = i;
                    }
                }

                // Trigger after short silence instead of waiting for isFinal
                if (
                    !matchedThisEvent &&
                    !hasMatchedCurrentRef.current &&
                    latestTranscript &&
                    Date.now() >= gracePeriodEndRef.current
                ) {
                    mispronounceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            gameStateRef.current &&
                            !isPausedRef.current &&
                            !hasMatchedCurrentRef.current
                        ) {
                            onMispronouncedRef.current?.(latestTranscript);
                        }
                    }, 900); // 900ms silence = fail.
                }
            };

            recognition.onerror = (event) => {
                if (event.error === "aborted") {
                    console.warn(
                        "Speech Recognition Warning: aborted (expected behavior on stop/navigation)",
                    );
                } else if (event.error === "not-allowed") {
                    console.error(
                        "Speech Recognition Error: not-allowed",
                        event.error,
                    );
                    onPermissionDeniedRef.current?.(); // Callback to parent
                } else {
                    console.error("Speech Recognition Error:", event.error);
                    if (onRecognitionErrorRef.current)
                        onRecognitionErrorRef.current(event.error);
                }
            };

            recognition.onend = () => {
                restartRetryCountRef.current = 0;

                if (
                    !isMountedRef.current ||
                    !gameStateRef.current ||
                    isPausedRef.current
                )
                    return;

                const tryRestart = () => {
                    if (
                        !isMountedRef.current ||
                        !gameStateRef.current ||
                        isPausedRef.current
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

                // Desktop: continuous mode keeps recognition alive.
                // Mobile: continuous is ignored, so onend fires per utterance.
                // The 300ms delay + retries gives mobile Chrome time to clean up.
                restartTimerRef.current = setTimeout(tryRestart, 300);
            };

            recognitionRef.current = recognition;
        }
    }, []); // Empty dependency array ensures persistent instance

    // Reset match flag when target word changes, with a grace period
    // to prevent stale onresult data from triggering false mispronounces.
    useEffect(() => {
        hasMatchedCurrentRef.current = false;
        if (mispronounceTimeoutRef.current)
            clearTimeout(mispronounceTimeoutRef.current);
        gracePeriodEndRef.current = Date.now() + 1000;
    }, [targetWord]);

    // Start recognition as soon as the game becomes active (including COUNTDOWN)
    // so that on mobile Chrome the user gesture context is still live.
    // The onresult handler ignores results while paused.
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
