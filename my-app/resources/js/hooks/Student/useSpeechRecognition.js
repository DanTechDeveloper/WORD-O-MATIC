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
    const gameStateRef = useRef(isActive);
    const isPausedRef = useRef(isPaused);
    const targetWordRef = useRef(targetWord);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    // Removed interim matching
    const onMispronouncedRef = useRef(onMispronounced);
    const onRecognitionErrorRef = useRef(onRecognitionError);
    // Removed processing lock
    // Removed resultIndex tracking
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
        targetWordRef.current = targetWord; // Update targetWordRef
        onWordRecognizedRef.current = onWordRecognized;
        onPermissionDeniedRef.current = onPermissionDenied;
        onMispronouncedRef.current = onMispronounced;
        onRecognitionErrorRef.current = onRecognitionError;
    }, [
        isActive,
        isPaused,
        targetWord, // Dependency changed
        onWordRecognized,
        onPermissionDenied,
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
                // Removed processing lock

                const resultIndex = event.resultIndex;
                const lastResult = event.results[resultIndex];
                const result = lastResult[0];
                const transcript = result.transcript.toLowerCase();
                // Removed confidence checks

                const cleanTranscript = transcript
                    .replace(/[^\w\s]/g, "")
                    .trim();
                const currentTarget = targetWordRef.current;
                if (!currentTarget) return;

                const cleanTarget = currentTarget
                    .toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();
                // Removed regex
                const isMatch = cleanTranscript === cleanTarget; // Exact comparison

                // SUCCESS PATH: Match found (Interim or Final)
                // Removed confidence checks
                if (isMatch && lastResult.isFinal) {
                    // Modified to only consider final results
                    // Removed resultIndex tracking
                    // Removed processing lock
                    // Removed resultIndex tracking

                    // Removed interim matching
                    // Removed interim matching
                    if (onWordRecognizedRef.current)
                        onWordRecognizedRef.current();

                    // Removed processing lock
                    // Removed processing lock
                    // Removed processing lock
                    // Removed resultIndex tracking
                    return;
                }

                // FAILURE PATH: Only trigger mispronunciation on Final result
                if (lastResult.isFinal) {
                    // Removed interim matching
                    // Removed interim matching

                    // Only trigger mispronounce if the user actually said something substantial
                    if (cleanTranscript.length > 0 && !isMatch) {
                        if (onMispronouncedRef.current)
                            onMispronouncedRef.current();
                    }
                } // Removed interim feedback block
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
