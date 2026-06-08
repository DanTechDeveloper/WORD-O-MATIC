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
    const gameStateRef = useRef(isActive); // Use isActive directly
    const currentWordIndexRef = useRef(currentWordIndex);
    const processingRef = useRef(false);

    useEffect(() => {
        gameStateRef.current = isActive;
    }, [isActive]);

    useEffect(() => {
        currentWordIndexRef.current = currentWordIndex;
    }, [currentWordIndex]);

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

                const transcriptWords = transcript
                    .replace(/[^\w\s]/g, "")
                    .split(/\s+/);

                const currentTarget = words[currentWordIndexRef.current]
                    ?.toLowerCase()
                    .replace(/[^\w]/g, "");

                if (currentTarget && transcriptWords.includes(currentTarget)) {
                    processingRef.current = true;
                    onWordRecognized(); // Callback to parent
                    setTimeout(() => {
                        processingRef.current = false;
                    }, 300);
                }
            };

            recognition.onerror = (event) => {
                console.error("Speech Recognition Error:", event.error);
                if (event.error === "not-allowed") {
                    onPermissionDenied(); // Callback to parent
                } else {
                    if (onRecognitionError) onRecognitionError(event.error);
                }
            };

            recognition.onend = () => {
                if (gameStateRef.current && !isPaused) {
                    // Check isActive and not paused
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
    }, [
        isActive,
        isPaused,
        words,
        onWordRecognized,
        onPermissionDenied,
        onRecognitionError,
    ]);
}
