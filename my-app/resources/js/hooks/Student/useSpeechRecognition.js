import { useEffect, useRef } from "react";

export function useSpeechRecognition(
    isActive,
    isPaused,
    words,
    currentWordIndex,
    onWordRecognized,
    onPermissionDenied,
    onRecognitionError, // New callback for generic errors
) {
    const recognitionRef = useRef(null);
    const gameStateRef = useRef(isActive);
    const isPausedRef = useRef(isPaused);
    const currentWordIndexRef = useRef(currentWordIndex);
    const wordsRef = useRef(words);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    const onRecognitionErrorRef = useRef(onRecognitionError);
    const processingRef = useRef(false);

    // Consolidate ref synchronization into a single effect
    useEffect(() => {
        gameStateRef.current = isActive;
        isPausedRef.current = isPaused;
        currentWordIndexRef.current = currentWordIndex;
        wordsRef.current = words;
        onWordRecognizedRef.current = onWordRecognized;
        onPermissionDeniedRef.current = onPermissionDenied;
        onRecognitionErrorRef.current = onRecognitionError;
    }, [
        isActive,
        isPaused,
        currentWordIndex,
        words,
        onWordRecognized,
        onPermissionDenied,
        onRecognitionError,
    ]);

    useEffect(() => {
        if (!isActive || isPaused) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

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

                const transcript =
                    event.results[
                        event.results.length - 1
                    ][0].transcript.toLowerCase();

                // Remove punctuation from transcript for better matching
                const cleanTranscript = transcript.replace(/[^\w\s]/g, "");

                const currentTarget = wordsRef.current[
                    currentWordIndexRef.current
                ]
                    ?.toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();

                if (currentTarget && cleanTranscript.includes(currentTarget)) {
                    processingRef.current = true;
                    onWordRecognizedRef.current(); // Callback to parent
                    setTimeout(() => {
                        processingRef.current = false;
                    }, 300);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error === "not-allowed") {
                    onPermissionDeniedRef.current(); // Callback to parent
                } else {
                    if (onRecognitionErrorRef.current)
                        onRecognitionErrorRef.current(event.error);
                }
            };

            recognition.onend = () => {
                // Use isPausedRef to avoid stale closure from the instantiation scope
                if (gameStateRef.current && !isPausedRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.error("Recognition restart failed:", e);
                    }
                }
            };

            recognitionRef.current = recognition;
        }

        try {
            recognitionRef.current.start();
        } catch (e) {
            // Instance might already be running, or other error
            console.warn(
                "Attempted to start recognition, but it might already be running or encountered an error:",
                e,
            );
        }

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [isActive, isPaused]);
}
