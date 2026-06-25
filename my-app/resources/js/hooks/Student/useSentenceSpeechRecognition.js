import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";
export function useSentenceSpeechRecognition({
    isActive,
    isPaused,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
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

const onMispronouncedRef = useRef(onMispronounced);
onMispronouncedRef.current = onMispronounced;

const onRecognitionErrorRef = useRef(onRecognitionError);
onRecognitionErrorRef.current = onRecognitionError;

const hasMatchedCurrentRef = useRef(false);

// Removed processing lock
const lastProcessedIndexRef = useRef(-1);
const isMountedRef = useRef(false);
const mispronounceTimeoutRef = useRef(null);
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

            // Clear timer on any new voice activity
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

                // Keep the latest transcript (interim or final)
                latestTranscript = transcript;

                const wordsInTranscript = transcript.split(/\s+/);
                const isMatch = wordsInTranscript.some(
                    (w) => isFuzzyMatch(w, target),
                );

                if (isMatch && !hasMatchedCurrentRef.current) {
                    hasMatchedCurrentRef.current = true;
                    matchedThisEvent = true;
                    onWordRecognizedRef.current?.();
                }

                // Update lastProcessedIndex for ALL results to prevent reprocessing
                lastProcessedIndexRef.current = i;
            }

            // Trigger mispronounce callback after silence if no match
            if (
                !matchedThisEvent &&
                !hasMatchedCurrentRef.current &&
                latestTranscript
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
                }, 900);
            }
        };

        recognition.onerror = (event) => {
            // Clear any pending mispronounce timeout on error
            if (mispronounceTimeoutRef.current) {
                clearTimeout(mispronounceTimeoutRef.current);
                mispronounceTimeoutRef.current = null;
            }

            if (event.error === "aborted") {
                console.warn(
                    "Speech Recognition Warning: aborted (expected behavior on stop/navigation)"
                );
            } else if (event.error === "not-allowed") {
                console.error(
                    "Speech Recognition Error: not-allowed",
                    event.error
                );
                onPermissionDeniedRef.current();
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
                            delays[restartRetryCountRef.current]
                        );
                    } else {
                        console.warn(
                            "Speech recognition restart failed after 3 attempts"
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

useEffect(() => {
    // Reset both flags when target word changes to ensure clean state for new word
    hasMatchedCurrentRef.current = false;
    lastProcessedIndexRef.current = -1;
    if (mispronounceTimeoutRef.current)
        clearTimeout(mispronounceTimeoutRef.current);
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