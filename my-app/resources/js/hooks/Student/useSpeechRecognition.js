import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";

const IRRECOVERABLE_ERRORS = new Set([
    "not-allowed",
    "service-not-allowed",
    "aborted",
]);

function clearAllTimers(timers) {
    Object.values(timers).forEach((ref) => {
        if (ref && ref.current) {
            clearTimeout(ref.current);
            ref.current = null;
        }
    });
}

function normalizeTarget(word) {
    return word?.toLowerCase().trim() ?? "";
}

function normalizeTranscript(text) {
    return (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

function buildFullSentence(transcript, interim) {
    return (transcript + " " + interim)
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

function processSentenceModeResult(
    event,
    target,
    stateRefs,
    timeoutRefs,
    timerRefs,
    propsRef,
) {
    let newFinals = "";
    let newInterim = "";

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const r = event.results[i];
        if (r?.[0]) {
            if (r.isFinal) {
                newFinals += r[0].transcript + " ";
            } else {
                newInterim = r[0].transcript;
            }
        }
    }

    stateRefs.current.transcript += " " + newFinals;
    stateRefs.current.interim = newInterim;
    const full = buildFullSentence(stateRefs.current.transcript, newInterim);

    clearTimeout(timerRefs.current.sentence.current);
    timeoutRefs.current.target = target;

    timerRefs.current.sentence.current = setTimeout(() => {
        if (
            stateRefs.current.isMounted &&
            propsRef.current.isActive &&
            !stateRefs.current.hasMatched &&
            timeoutRefs.current.target === target
        ) {
            propsRef.current.onMispronounced?.(full);
        }
    }, 5000);

    const spokenWordCount = full
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
    const targetWordCount = target
        .split(/\s+/)
        .filter((w) => w.length > 0).length;
    stateRefs.current.stoppedAt = Date.now();

    if (
        !stateRefs.current.hasMatched &&
        isFuzzyMatch(full, target) &&
        spokenWordCount === targetWordCount
    ) {
        stateRefs.current.hasMatched = true;
        propsRef.current.onWordRecognized?.();
    }

    if (stateRefs.current.hasMatched) {
        clearAllTimers(timerRefs.current);
        return;
    }

    if (!full) return;
    if (Date.now() < timeoutRefs.current.graceEnd) return;

    if (
        stateRefs.current.stoppedAt &&
        (spokenWordCount !== targetWordCount || !isFuzzyMatch(full, target))
    ) {
        clearAllTimers(timerRefs.current);
        propsRef.current.onMispronounced?.(full);
        stateRefs.current.hasMatched = false;
        stateRefs.current.mispronouncedInWord = false;
    }
}

function processWordModeResult(
    event,
    target,
    stateRefs,
    timeoutRefs,
    timerRefs,
    propsRef,
) {
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (i <= stateRefs.current.lastProcessed) continue;

        const result = event.results[i];
        if (!result) continue;

        const transcript = normalizeTranscript(result[0]?.transcript);

        if (!transcript) continue;

        stateRefs.current.stoppedAt = Date.now();

        if (stateRefs.current.hasMatched) {
            stateRefs.current.lastProcessed = i;
            continue;
        }

        if (isFuzzyMatch(transcript, target)) {
            stateRefs.current.hasMatched = true;
            stateRefs.current.lastProcessed = i;
            propsRef.current.onWordRecognized?.();
        }

        if (result.isFinal) {
            stateRefs.current.lastProcessed = i;
            if (
                !stateRefs.current.hasMatched &&
                Date.now() >= timeoutRefs.current.graceEnd &&
                !stateRefs.current.mispronouncedInWord
            ) {
                stateRefs.current.mispronouncedInWord = true;
                propsRef.current.onMispronounced?.(transcript);
            }
        }
    }

    if (stateRefs.current.hasMatched) {
        clearAllTimers(timerRefs.current);
        stateRefs.current.mispronouncedInWord = false;
    }
}

function handleRecognitionError(event, timerRefs, propsRef, lastErrorRef) {
    clearAllTimers(timerRefs.current);
    lastErrorRef.current = event.error;

    if (event.error === "aborted") {
        console.warn(
            "Speech Recognition Warning: aborted (expected behavior on stop/navigation)",
        );
    } else if (event.error === "not-allowed") {
        console.error("Speech Recognition Error: not-allowed", event.error);
        propsRef.current.onPermissionDenied?.();
    } else if (
        event.error !== "no-speech" &&
        event.error !== "audio-capture" &&
        event.error !== "network"
    ) {
        console.error("Speech Recognition Error:", event.error);
        propsRef.current.onRecognitionError?.(event.error);
    }
}

function handleRecognitionEnd(
    timerRefs,
    timeoutRefs,
    stateRefs,
    recognitionRef,
    propsRef,
    lastErrorRef,
) {
    clearAllTimers(timerRefs.current);
    stateRefs.current.lastProcessed = -1;
    stateRefs.current.hasMatched = false;
    stateRefs.current.transcript = "";
    stateRefs.current.interim = "";
    stateRefs.current.stoppedAt = 0;
    stateRefs.current.mispronouncedInWord = false;
    timeoutRefs.current.restartCount = 0;

    if (IRRECOVERABLE_ERRORS.has(lastErrorRef.current)) {
        lastErrorRef.current = null;
        stateRefs.current.isListening = false;
        return;
    }

    if (!stateRefs.current.isMounted || !propsRef.current.isActive) return;

    const tryRestart = () => {
        if (!stateRefs.current.isMounted || !propsRef.current.isActive) {
            timeoutRefs.current.restartCount = 0;
            return;
        }

        timeoutRefs.current.restartCount++;
        if (timeoutRefs.current.restartCount > 3) return;

        try {
            stateRefs.current.isListening = true;
            recognitionRef.current?.start();
            timeoutRefs.current.restartCount = 0;
        } catch {
            const delay = Math.min(
                500 * 2 ** timeoutRefs.current.restartCount,
                3000,
            );
            timeoutRefs.current.restartCount += 1;
            timerRefs.current.restart.current = setTimeout(tryRestart, delay);
        }
    };

    timerRefs.current.restart.current = setTimeout(tryRestart, 500);
}

export function useSpeechRecognition({
    isActive,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
    matchMode = "word",
}) {
    const recognitionRef = useRef(null);
    const isWordMode = matchMode === "word";

    const propsRef = useRef({
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
    });
    propsRef.current = {
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
    };

    // State refs - flat object with ref values (Rule of Hooks compliant)
    const stateRefs = useRef({
        hasMatched: false,
        lastProcessed: -1,
        isMounted: false,
        stoppedAt: 0,
        mispronouncedInWord: false,
        transcript: "",
        interim: "",
        isListening: false,
    });

    const timerRefs = useRef({
        mispronounce: useRef(null),
        restart: useRef(null),
        sentence: useRef(null),
    });

    const timeoutRefs = useRef({
        graceEnd: Date.now() + 500,
        restartCount: 0,
        target: null,
    });

    const lastErrorRef = useRef(null);

    useEffect(() => {
        stateRefs.current.isMounted = true;
        return () => {
            stateRefs.current.isMounted = false;
            clearAllTimers(timerRefs.current);
            if (recognitionRef.current) recognitionRef.current.abort();
        };
    }, []);

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
                stateRefs.current.isListening = true;
                if (!propsRef.current.isActive) return;

                const target = normalizeTarget(propsRef.current.targetWord);

                if (propsRef.current.isWordMode) {
                    processWordModeResult(
                        event,
                        target,
                        stateRefs,
                        timeoutRefs,
                        timerRefs,
                        propsRef,
                    );
                } else {
                    processSentenceModeResult(
                        event,
                        target,
                        stateRefs,
                        timeoutRefs,
                        timerRefs,
                        propsRef,
                    );
                }
            };

            recognition.onerror = (event) => {
                handleRecognitionError(
                    event,
                    timerRefs,
                    propsRef,
                    lastErrorRef,
                );
            };

            recognition.onend = () => {
                stateRefs.current.isListening = false;
                handleRecognitionEnd(
                    timerRefs,
                    timeoutRefs,
                    stateRefs,
                    recognitionRef,
                    propsRef,
                    lastErrorRef,
                );
            };

            recognitionRef.current = recognition;
        }

        return () => {
            clearAllTimers(timerRefs.current);
            if (recognitionRef.current) {
                recognitionRef.current.abort();
                recognitionRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const wasMatched = stateRefs.current.hasMatched;
        stateRefs.current.hasMatched = false;
        stateRefs.current.lastProcessed = -1;
        stateRefs.current.transcript = "";
        stateRefs.current.interim = "";
        stateRefs.current.stoppedAt = 0;
        stateRefs.current.mispronouncedInWord = false;
        timeoutRefs.current.target = null;
        clearAllTimers(timerRefs.current);
        timeoutRefs.current.graceEnd = Date.now() + 500;
        if (
            wasMatched &&
            recognitionRef.current &&
            propsRef.current.isActive &&
            propsRef.current.isWordMode
        ) {
            try {
                recognitionRef.current.stop();
            } catch {}
        }
        if (
            propsRef.current.isActive &&
            recognitionRef.current &&
            !stateRefs.current.isListening
        ) {
            try {
                stateRefs.current.isListening = true;
                recognitionRef.current.start();
            } catch {}
        }
    }, [targetWord]);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isActive) {
            try {
                stateRefs.current.hasMatched = false;
                stateRefs.current.lastProcessed = -1;
                clearAllTimers(timerRefs.current);
                stateRefs.current.isListening = true;
                recognition.start();
            } catch {}
        } else {
            try {
                stateRefs.current.isListening = false;
                clearAllTimers(timerRefs.current);
                recognition.stop();
            } catch {}
        }
    }, [isActive]);
}
