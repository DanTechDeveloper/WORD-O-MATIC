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
    const normalizedTargetRef = useRef("");
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    // Removed interim matching
    const onMispronouncedRef = useRef(onMispronounced);
    const onRecognitionErrorRef = useRef(onRecognitionError);
    // Removed processing lock
    const lastProcessedIndexRef = useRef(-1);
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
        normalizedTargetRef.current = (targetWord || "")
            .toLowerCase()
            .replace(/[^\w\s]/g, "")
            .trim();
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
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                const target = normalizedTargetRef.current;

                if (!target) return;

                // Iterate through all new results starting from event.resultIndex
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    // Prevent re-processing the same result index
                    if (i <= lastProcessedIndexRef.current) continue;

                    const result = event.results[i];

                    if (!result) continue;

                    const transcript = (result[0]?.transcript || "")
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) continue;

                    const isMatch = transcript === target;

                    // FINAL RESULT ONLY = source of truth
                    if (result.isFinal) {
                        lastProcessedIndexRef.current = i;
                        
                        if (isMatch) {
                            onWordRecognizedRef.current?.();
                        } else if (transcript.length > 0) {
                            onMispronouncedRef.current?.();
                        }
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
                lastProcessedIndexRef.current = -1; // Reset for new session
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
