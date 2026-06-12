import { useEffect, useRef } from "react";

export function useSpeechRecognition({
    isActive,
    isPaused,
    words,
    currentWordIndex,
    onWordRecognized,
    onPermissionDenied,
    onInterimMatch,
    onMispronounced,
    onRecognitionError,
}) {
    const recognitionRef = useRef(null);
    const gameStateRef = useRef(isActive);
    const isPausedRef = useRef(isPaused);
    const currentWordIndexRef = useRef(currentWordIndex);
    const wordsRef = useRef(words);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    const onInterimMatchRef = useRef(onInterimMatch);
    const onMispronouncedRef = useRef(onMispronounced);
    const onRecognitionErrorRef = useRef(onRecognitionError);
    const processingRef = useRef(false);
    const lastProcessedIndexRef = useRef(-1); // Prevents duplicate processing of segments
    const isMountedRef = useRef(false);

    // Track hook mount/unmount lifecycle
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    // Consolidate ref synchronization into a single effect
    useEffect(() => {
        gameStateRef.current = isActive;
        isPausedRef.current = isPaused;
        currentWordIndexRef.current = currentWordIndex;
        wordsRef.current = words;
        onWordRecognizedRef.current = onWordRecognized;
        onPermissionDeniedRef.current = onPermissionDenied;
        onInterimMatchRef.current = onInterimMatch;
        onMispronouncedRef.current = onMispronounced;
        onRecognitionErrorRef.current = onRecognitionError;
    }, [
        isActive,
        isPaused,
        currentWordIndex,
        words,
        onWordRecognized,
        onPermissionDenied,
        onInterimMatch,
        onMispronounced,
        onRecognitionError,
    ]);

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

            recognition.onresult = (event) => {
                if (processingRef.current) return;

                const resultIndex = event.resultIndex;
                const lastResult = event.results[resultIndex];
                const result = lastResult[0];
                const transcript = result.transcript.toLowerCase();
                const confidence = result.confidence;

                const cleanTranscript = transcript
                    .replace(/[^\w\s]/g, "")
                    .trim();
                const targetWord =
                    wordsRef.current[currentWordIndexRef.current];
                if (!targetWord) return;

                const cleanTarget = targetWord
                    .toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();
                const regex = new RegExp(`\\b${cleanTarget}\\b`, "i");
                const isMatch = regex.test(cleanTranscript);

                // SUCCESS PATH: Match found (Interim or Final)
                // We allow interim success if confidence is high to avoid "No Response" lag
                if (isMatch && (lastResult.isFinal || confidence > 0.1)) {
                    if (lastProcessedIndexRef.current !== resultIndex) {
                        processingRef.current = true;
                        lastProcessedIndexRef.current = resultIndex;

                        if (onInterimMatchRef.current)
                            onInterimMatchRef.current(false);
                        if (onWordRecognizedRef.current)
                            onWordRecognizedRef.current();

                        setTimeout(() => {
                            processingRef.current = false;
                        }, 200);
                    }
                    return;
                }

                // FAILURE PATH: Only trigger mispronunciation on Final result
                if (lastResult.isFinal) {
                    if (onInterimMatchRef.current)
                        onInterimMatchRef.current(false);

                    // Only trigger mispronounce if the user actually said something substantial
                    if (cleanTranscript.length > 0 && !isMatch) {
                        if (onMispronouncedRef.current)
                            onMispronouncedRef.current();
                    }
                } else {
                    // INTERIM FEEDBACK: Signal match state only if user is speaking
                    if (onInterimMatchRef.current) {
                        onInterimMatchRef.current(
                            cleanTranscript.length > 0 ? isMatch : null,
                        );
                    }
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
                // Use isPausedRef to avoid stale closure from the instantiation scope
                if (
                    isMountedRef.current &&
                    gameStateRef.current &&
                    !isPausedRef.current
                ) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.warn("Recognition restart failed:", e);
                    }
                }
            };

            recognitionRef.current = recognition;
        }
    }, []); // Empty dependency array ensures persistent instance

    // Approach 2: Strictly manage start/stop without re-binding listeners
    useEffect(() => {
        if (!recognitionRef.current) return;

        if (isActive && !isPaused) {
            try {
                recognitionRef.current.start();
            } catch (e) {
                // Instance might already be running
            }
        } else {
            try {
                recognitionRef.current.stop();
            } catch (e) {
                // Instance might already be stopped
            }
        }

        return () => {
            if (recognitionRef.current) {
                try {
                    recognitionRef.current.stop();
                } catch (e) {
                    // Ignore errors on unmount
                }
            }
        };
    }, [isActive, isPaused]);
}
