import { useEffect, useRef } from "react";

export function useWordSpeechRecognition({
    isActive,
    isPaused,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
}) {
    const recognitionRef = useRef(null);

    // Sync refs synchronously in the hook body
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
    const isMountedRef = useRef(false);
    const mispronounceTimeoutRef = useRef(null);

    // Utility function para malinis nang sagad ang timeout
    const clearMispronounceTimer = () => {
        if (mispronounceTimeoutRef.current) {
            clearTimeout(mispronounceTimeoutRef.current);
            mispronounceTimeoutRef.current = null;
        }
    };

    // Track hook mount/unmount lifecycle
    useEffect(() => {
        isMountedRef.current = true;
        return () => {
            isMountedRef.current = false;
            clearMispronounceTimer();
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

    // Persistent Engine Instance
    useEffect(() => {
        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) {
            console.error("Speech Recognition not supported in this browser.");
            return;
        }

        if (!recognitionRef.current) {
            const recognition = new SpeechRecognition();
            // Ginawa nating false ang continuous para kusa siyang mag-reset bawat salita
            // Mas swabe ito sa mga "single-word" games gaya ng Word-o-matic
            recognition.continuous = false; 
            recognition.interimResults = true;
            recognition.lang = "en-US";

            recognition.onresult = (event) => {
                if (!gameStateRef.current || isPausedRef.current || hasMatchedCurrentRef.current) return;

                // Agad na burahin ang lumang timer sa bawat kibot ng boses
                clearMispronounceTimer();

                const target = targetWordRef.current.toLowerCase().trim();
                if (!target) return;

                let latestTranscript = "";
                
                // Dahil continuous = false, madalas index 0 lang ang tinitingnan natin, mas tipid sa loop!
                for (let i = event.resultIndex; i < event.results.length; ++i) {
                    const result = event.results[i];
                    if (!result) continue;

                    const transcript = (result[0]?.transcript ?? "")
                        .toLowerCase()
                        .replace(/[^\w\s]/g, "")
                        .trim();

                    if (!transcript) continue;
                    latestTranscript = transcript;

                    const wordsInTranscript = transcript.split(/\s+/);
                    // Kunin lang ang pinakahuling salita na binanggit para sa mispronounce data
                    const lastWordSpoken = wordsInTranscript[wordsInTranscript.length - 1];

                    if (wordsInTranscript.includes(target)) {
                        hasMatchedCurrentRef.current = true;
                        clearMispronounceTimer(); // Patayin ang timer dahil panalo na
                        onWordRecognizedRef.current?.();
                        return; // Labas agad, tapos na ang laban
                    }
                }

                // Kung nagsalita ang bata pero hindi tumugma sa target word
                if (!hasMatchedCurrentRef.current && latestTranscript) {
                    mispronounceTimeoutRef.current = setTimeout(() => {
                        if (
                            isMountedRef.current &&
                            gameStateRef.current &&
                            !isPausedRef.current &&
                            !hasMatchedCurrentRef.current
                        ) {
                            // Ipasá ang pinakahuling salita na mali, hindi ang buong parirala
                            const words = latestTranscript.split(/\s+/);
                            onMispronouncedRef.current?.(words[words.length - 1]);
                        }
                    }, 900);
                }
            };

            recognition.onerror = (event) => {
                if (event.error === "aborted") return;
                
                if (event.error === "not-allowed") {
                    onPermissionDeniedRef.current?.();
                } else {
                    onRecognitionErrorRef.current?.(event.error);
                }
            };

            recognition.onend = () => {
                // Pagkatapos ng pagsasalita, auto-restart kung active pa ang laro
                if (
                    isMountedRef.current &&
                    gameStateRef.current &&
                    !isPausedRef.current &&
                    !hasMatchedCurrentRef.current
                ) {
                    try {
                        recognitionRef.current?.start();
                    } catch (e) {
                        // nauna nang tumakbo
                    }
                }
            };

            recognitionRef.current = recognition;
        }
    }, []);

    // Reset kapag nagbago ang salita sa screen
    useEffect(() => {
        hasMatchedCurrentRef.current = false;
        clearMispronounceTimer();
        
        // I-force restart ang engine para malinis ang buffer para sa bagong salita
        if (isActive && !isPaused && recognitionRef.current) {
            try {
                recognitionRef.current.stop(); // Ang onend ang bahalang mag-restart nito nang malinis
            } catch (e) {}
        }
    }, [targetWord]);

    // Manage start/stop flow
    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isActive && !isPaused) {
            hasMatchedCurrentRef.current = false;
            try {
                recognition.start();
            } catch (e) {}
        } else {
            clearMispronounceTimer();
            try {
                recognition.stop();
            } catch (e) {}
        }
    }, [isActive, isPaused]);
}