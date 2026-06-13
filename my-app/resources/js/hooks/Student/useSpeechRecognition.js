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

            recognition.onresult = (event) => {
                const target = targetWordRef.current.toLowerCase().trim();

                if (!target ) return;
                console.log(event.results);

                // Iterate through all new results starting from event.resultIndex
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    // Prevent re-processing the same result index
                    if (i <= lastProcessedIndexRef.current) continue;

                    const result = event.results[i];

                    if (!result) continue;

                    const transcript = (result[0]?.transcript)
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) continue;

                    // Mas mabilis na detection: tinitingnan kung nandoon ang target word sa loob ng transcript
                    const wordsInTranscript = transcript.split(/\s+/);
                    const isMatch = wordsInTranscript.includes(target);

                    if (isMatch && !hasMatchedCurrentRef.current) {
                        hasMatchedCurrentRef.current = true;
                        onWordRecognizedRef.current?.();
                        return;
                    }

                    if (result.isFinal) {
                        lastProcessedIndexRef.current = i;
                        if (
                            !hasMatchedCurrentRef.current &&
                            transcript.length > 0
                        ) {
                            onMispronouncedRef.current?.(transcript);
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
                hasMatchedCurrentRef.current = false;
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
