import { useEffect, useRef } from "react";

export function useSpeechRecognition({
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

    // Track hook mount/unmount lifecycle
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
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

                const target = targetWordRef.current.toLowerCase().trim();
                if (!target) return;

                // Fix for onMispronounced firing on partial transcripts:
                // Track whether we matched across all results in this event
                let matchedThisEvent = false;
                let lastFinalTranscript = "";

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

                    // Store the last final transcript for potential mispronounce
                    if (result.isFinal) {
                        lastFinalTranscript = transcript;
                    }

                    // HYBRID APPROACH: Exact word match for single words, substring for phrases
                    const isSingleWord = target.split(/\s+/).length === 1;
                    const wordsInTranscript = transcript.split(/\s+/);
                    const isMatch = isSingleWord 
                        ? wordsInTranscript.includes(target)  // Exact word for single letters/words
                        : transcript.includes(target);         // Substring for phrases

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        matchedThisEvent = true;
                        onWordRecognizedRef.current?.();
                        break;
                    }

                    if (result.isFinal) {
                        lastProcessedIndexRef.current = i;
                    }
                }

                // Only call onMispronounced if we processed all results without matching
                if (
                    !matchedThisEvent &&
                    !hasMatchedCurrentRef.current &&
                    lastFinalTranscript
                ) {
                    onMispronouncedRef.current?.(lastFinalTranscript);
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
                    onPermissionDeniedRef.current(); // Callback to parent
                } else {
                    console.error("Speech Recognition Error:", event.error);
                    if (onRecognitionErrorRef.current)
                        onRecognitionErrorRef.current(event.error);
                }
            };

            recognition.onend = () => {
                lastProcessedIndexRef.current = -1;
                hasMatchedCurrentRef.current = false;

                // Double-check current state before restart
                if (
                    isMountedRef.current &&
                    gameStateRef.current &&
                    !isPausedRef.current
                ) {
                    // Use setTimeout to avoid potential call stack issues
                    setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            gameStateRef.current &&
                            !isPausedRef.current
                        ) {
                            try {
                                recognitionRef.current?.start();
                            } catch (e) {
                                console.warn("Recognition restart failed:", e);
                            }
                        }
                    }, 0);
                }
            };

            recognitionRef.current = recognition;
        }
    }, []); // Empty dependency array ensures persistent instance

    useEffect(() => {
        hasMatchedCurrentRef.current = false;
    }, [targetWord]);

    // Approach 2: Strictly manage start/stop without re-binding listeners
    useEffect(() => {
        const recognition = recognitionRef.current;

        if (!recognition) return;

        if (isActive && !isPaused) {
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
    }, [isActive, isPaused]);
}