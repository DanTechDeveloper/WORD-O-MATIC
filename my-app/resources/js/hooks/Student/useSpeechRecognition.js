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
            recognition.interimResults = false;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                const result = event.results[event.resultIndex];

                if (!result) return;

                const transcript = (result[0]?.transcript || "")
                    .toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();

                const target = (targetWordRef.current || "")
                    .toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();

                if (!target || !transcript) return;

                const isMatch = transcript === target;

                // FINAL RESULT ONLY = source of truth
                if (result.isFinal) {
                    if (isMatch) {
                        onWordRecognizedRef.current?.();
                    } else if (transcript.length > 0) {
                        onMispronouncedRef.current?.();
                    }

                    return;
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
