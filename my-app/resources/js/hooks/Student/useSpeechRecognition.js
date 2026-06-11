import { useEffect, useRef } from "react";

/**
 * Calculates Levenshtein distance to determine word similarity
 */
const getLevenshteinDistance = (a, b) => {
    const matrix = [];
    for (let i = 0; i <= b.length; i++) matrix[i] = [i];
    for (let j = 0; j <= a.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= b.length; i++) {
        for (let j = 1; j <= a.length; j++) {
            if (b.charAt(i - 1) === a.charAt(j - 1)) {
                matrix[i][j] = matrix[i - 1][j - 1];
            } else {
                matrix[i][j] = Math.min(
                    matrix[i - 1][j - 1] + 1,
                    matrix[i][j - 1] + 1,
                    matrix[i - 1][j] + 1,
                );
            }
        }
    }
    return matrix[b.length][a.length];
};

const getSimilarity = (s1, s2) => {
    const longer = s1.length > s2.length ? s1 : s2;
    if (longer.length === 0) return 1.0;
    return (longer.length - getLevenshteinDistance(s1, s2)) / longer.length;
};

/**
 * Checks if the transcript matches the target word.
 * Returns true for exact (word boundary) or fuzzy match.
 */
const checkMatch = (cleanTranscript, currentTarget) => {
    // Word Boundary Matching (prevents substring matches)
    const wordBoundaryRegex = new RegExp(
        `\\b${currentTarget}\\b`,
        "i",
    );
    const isExactMatch = wordBoundaryRegex.test(cleanTranscript);

    // Fuzzy Matching (for mispronunciations or engine errors)
    // Only apply fuzzy matching if the word is long enough to avoid ambiguity
    let isFuzzyMatch = false;
    if (!isExactMatch && currentTarget.length > 3) {
        const wordsInTranscript = cleanTranscript.split(/\s+/);
        isFuzzyMatch = wordsInTranscript.some(
            (word) => getSimilarity(word, currentTarget) >= 0.85,
        );
    }

    return isExactMatch || isFuzzyMatch;
};

export function useSpeechRecognition(
    isActive,
    isPaused,
    words,
    currentWordIndex,
    onWordRecognized,
    onPermissionDenied,
    onInterimMatch, // New: callback(bool) — true = possible match, false = clear
    onRecognitionError,
) {
    const recognitionRef = useRef(null);
    const gameStateRef = useRef(isActive);
    const isPausedRef = useRef(isPaused);
    const currentWordIndexRef = useRef(currentWordIndex);
    const wordsRef = useRef(words);
    const onWordRecognizedRef = useRef(onWordRecognized);
    const onPermissionDeniedRef = useRef(onPermissionDenied);
    const onInterimMatchRef = useRef(onInterimMatch);
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
        onInterimMatchRef.current = onInterimMatch;
        onRecognitionErrorRef.current = onRecognitionError;
    }, [
        isActive,
        isPaused,
        currentWordIndex,
        words,
        onWordRecognized,
        onPermissionDenied,
        onInterimMatch,
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

                const lastResultIndex = event.results.length - 1;
                const lastResult = event.results[lastResultIndex];
                const result = lastResult[0];
                const transcript = result.transcript.toLowerCase();
                const confidence = result.confidence;

                const cleanTranscript = transcript
                    .replace(/[^\w\s]/g, "")
                    .trim();

                const currentTarget = wordsRef.current[
                    currentWordIndexRef.current
                ]
                    ?.toLowerCase()
                    .replace(/[^\w\s]/g, "")
                    .trim();

                if (!currentTarget) return;

                const isMatch = checkMatch(cleanTranscript, currentTarget);

                if (lastResult.isFinal) {
                    // --- FINAL RESULT: confirm or reject ---
                    if (isMatch && confidence > 0.7) {
                        processingRef.current = true;
                        // Clear interim state, then confirm
                        if (onInterimMatchRef.current) onInterimMatchRef.current(false);
                        onWordRecognizedRef.current();
                        setTimeout(() => {
                            processingRef.current = false;
                        }, 500);
                    } else {
                        // Final result did not match — clear any interim highlight
                        if (onInterimMatchRef.current) onInterimMatchRef.current(false);
                    }
                } else {
                    // --- INTERIM RESULT: show/clear preview ---
                    if (isMatch) {
                        if (onInterimMatchRef.current) onInterimMatchRef.current(true);
                    } else {
                        if (onInterimMatchRef.current) onInterimMatchRef.current(false);
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
                if (gameStateRef.current && !isPausedRef.current) {
                    try {
                        recognitionRef.current.start();
                    } catch (e) {
                        console.warn("Recognition restart failed:", e);
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
