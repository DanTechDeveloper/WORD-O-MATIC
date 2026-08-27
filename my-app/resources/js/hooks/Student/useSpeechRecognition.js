import { useEffect, useRef } from "react";
import { isFuzzyMatch } from "@/lib/speechUtils";

const IRRECOVERABLE_ERRORS = new Set([
    "not-allowed",
    "service-not-allowed",
    "aborted",
]);

export function clearAllTimers(timers) {
    Object.keys(timers).forEach((key) => {
        if (timers[key]) {
            clearTimeout(timers[key]);
            timers[key] = null;
        }
    });
}

export function normalizeText(text) {
    return (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

function buildFullSentence(transcript, interim) {
    return normalizeText(transcript + " " + interim);
}

export function armSentenceTimeout(
    _target,
    _full,
    stateRefs,
    timerRefs,
    _timeoutRefs,
    propsRef,
) {
    clearTimeout(timerRefs.current.sentence);

    // ponytail: 1s self-rescheduling watchdog measures CONTINUOUS silence via
    // lastSpeechAt (survives engine restarts); fires onMispronounced at >=5s.
    const tick = () => {
        const s = stateRefs.current;
        if (
            !s.isMounted ||
            !propsRef.current.isActive ||
            s.hasMatched ||
            s.mispronouncedSentence
        ) {
            timerRefs.current.sentence = null;
            return;
        }
        if (Date.now() - s.lastSpeechAt >= 3000) {
            s.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(s.transcript);
            timerRefs.current.sentence = null;
            return;
        }
        timerRefs.current.sentence = setTimeout(tick, 1000);
    };

    timerRefs.current.sentence = setTimeout(tick, 1000);
}

export function armWordTimeout(target, stateRefs, timerRefs, timeoutRefs, propsRef) {
    clearTimeout(timerRefs.current.word);
    timeoutRefs.current.target = target;

    timerRefs.current.word = setTimeout(() => {
        if (
            stateRefs.current.isMounted &&
            propsRef.current.isActive &&
            !stateRefs.current.hasMatched &&
            !stateRefs.current.mispronouncedInWord &&
            timeoutRefs.current.target === target
        ) {
            stateRefs.current.mispronouncedInWord = true;
            propsRef.current.onMispronounced?.();
        }
    }, 5000);
}

export function processSentenceModeResult(
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
        if (i <= stateRefs.current.lastProcessedSentence) continue;
        const r = event.results[i];
        if (!r?.[0]) continue;
        if (r.isFinal) {
            newFinals += r[0].transcript + " ";
            stateRefs.current.lastProcessedSentence = i;
        } else {
            newInterim = r[0].transcript;
        }
    }

    if (newFinals) {
        stateRefs.current.transcript += " " + newFinals;
    }
    stateRefs.current.interim = newInterim;

    if (newFinals || newInterim) {
        stateRefs.current.lastSpeechAt = Date.now();
    }

    // Prevent memory leaks: keep only the recent words in memory
    const targetWordCount = target.split(/\s+/).filter(Boolean).length;
    const maxWords = targetWordCount + 5;
    const words = stateRefs.current.transcript.split(/\s+/).filter(Boolean);
    if (words.length > maxWords) {
        stateRefs.current.transcript = words.slice(-maxWords).join(" ");
    }

    const full = buildFullSentence(stateRefs.current.transcript, newInterim);

    armSentenceTimeout(
        target,
        full,
        stateRefs,
        timerRefs,
        timeoutRefs,
        propsRef,
    );

    const spokenWordCount = full.split(/\s+/).filter(Boolean).length;
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
        !newInterim &&
        spokenWordCount >= targetWordCount &&
        isFuzzyMatch(full, target) === false
    ) {
        clearAllTimers(timerRefs.current);
        if (!stateRefs.current.mispronouncedSentence) {
            stateRefs.current.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(full);
        }
    }
}

export function processWordModeResult(
    event,
    target,
    stateRefs,
    timerRefs,
    timeoutRefs,
    propsRef,
) {
    if (Date.now() < timeoutRefs.current.graceEnd) return;
    for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (i <= stateRefs.current.lastProcessed) continue;

        const result = event.results[i];
        if (!result) continue;

        const transcript = normalizeText(result[0]?.transcript);
        if (!transcript) continue;

        stateRefs.current.stoppedAt = Date.now();

        if (stateRefs.current.hasMatched) {
            stateRefs.current.lastProcessed = i;
            continue;
        }

        if (!stateRefs.current.mispronouncedInWord) {
            armWordTimeout(target, stateRefs, timerRefs, timeoutRefs, propsRef);
        }

        if (isFuzzyMatch(transcript, target)) {
            stateRefs.current.hasMatched = true;
            stateRefs.current.lastProcessed = i;
            propsRef.current.onWordRecognized?.();
        } else if (!stateRefs.current.mispronouncedInWord) {
            // Speech settled on a non-matching word → mispronounce promptly
            // instead of waiting for (flaky) is_final or the 5s timeout.
            clearTimeout(timerRefs.current.wordSettle);
            timerRefs.current.wordSettle = setTimeout(() => {
                if (
                    stateRefs.current.isMounted &&
                    propsRef.current.isActive &&
                    !stateRefs.current.hasMatched &&
                    !stateRefs.current.mispronouncedInWord
                ) {
                    stateRefs.current.mispronouncedInWord = true;
                    propsRef.current.onMispronounced?.(transcript);
                }
            }, 900);
        }

        if (result.isFinal) {
            stateRefs.current.lastProcessed = i;
            if (
                !stateRefs.current.hasMatched &&
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
    stateRefs.current.lastProcessedSentence = -1;
    stateRefs.current.hasMatched = false;
    stateRefs.current.transcript = "";
    stateRefs.current.interim = "";
    stateRefs.current.stoppedAt = 0;
    stateRefs.current.mispronouncedInWord = false;
    stateRefs.current.mispronouncedSentence = false;
    stateRefs.current.isListening = false;
    timeoutRefs.current.restartCount = 0;

    if (IRRECOVERABLE_ERRORS.has(lastErrorRef.current)) {
        lastErrorRef.current = null;
        return;
    }

    if (!stateRefs.current.isMounted || !propsRef.current.isActive) return;

    const tryRestart = () => {
        if (!stateRefs.current.isMounted || !propsRef.current.isActive) {
            timeoutRefs.current.restartCount = 0;
            return;
        }

        timeoutRefs.current.restartCount++;
        if (timeoutRefs.current.restartCount > 3) {
            propsRef.current.onRestartFailed?.();
            return;
        }

        try {
            stateRefs.current.isListening = true;
            recognitionRef.current?.start();

            // Re-arm timeouts upon successful restart
            const activeTarget = normalizeText(propsRef.current.targetWord);
            if (propsRef.current.isWordMode) {
                armWordTimeout(
                    activeTarget,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            } else {
                armSentenceTimeout(
                    activeTarget,
                    stateRefs.current.transcript,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            }
        } catch {
            const delay = Math.min(
                500 * 2 ** timeoutRefs.current.restartCount,
                3000,
            );
            timerRefs.current.restart = setTimeout(tryRestart, delay);
        }
    };

    timerRefs.current.restart = setTimeout(tryRestart, 500);
}

export function useSpeechRecognition({
    isActive,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
    onRestartFailed,
    matchMode = "word",
}) {
    const recognitionRef = useRef(null);
    const isWordMode = matchMode === "word";

    const propsRef = useRef(null);

    useEffect(() => {
        propsRef.current = {
            isActive,
            isWordMode,
            targetWord,
            onWordRecognized,
            onPermissionDenied,
            onMispronounced,
            onRecognitionError,
            onRestartFailed,
        };
    }, [
        isActive,
        isWordMode,
        targetWord,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
        onRestartFailed,
    ]);

    // State refs - flat object with primitive values (Rules of Hooks compliant)
    const stateRefs = useRef({
        hasMatched: false,
        lastProcessed: -1,
        lastProcessedSentence: -1,
        isMounted: false,
        stoppedAt: 0,
        mispronouncedInWord: false,
        mispronouncedSentence: false,
        transcript: "",
        interim: "",
        isListening: false,
        lastSpeechAt: Date.now(),
    });

    // Timers stored as plain values (not refs) to avoid nested hook violation
    const timerRefs = useRef({
        restart: null,
        sentence: null,
        word: null,
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
                if (!propsRef.current.isActive) return;

                const target = normalizeText(propsRef.current.targetWord);

                if (propsRef.current.isWordMode) {
                    processWordModeResult(
                        event,
                        target,
                        stateRefs,
                        timerRefs,
                        timeoutRefs,
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
                handleRecognitionEnd(
                    timerRefs,
                    timeoutRefs,
                    stateRefs,
                    recognitionRef,
                    propsRef,
                    lastErrorRef,
                );
            };

            recognition.onstart = () => {
                stateRefs.current.isListening = true;
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

    // Handle target word changes without restarting the engine
    useEffect(() => {
        stateRefs.current.hasMatched = false;
        stateRefs.current.mispronouncedInWord = false;
        stateRefs.current.mispronouncedSentence = false;
        stateRefs.current.lastProcessed = -1;
        stateRefs.current.lastProcessedSentence = -1;
        stateRefs.current.transcript = "";
        stateRefs.current.interim = "";
        stateRefs.current.stoppedAt = 0;
        stateRefs.current.lastSpeechAt = Date.now();
        timeoutRefs.current.target = null;
        timeoutRefs.current.graceEnd = Date.now() + 500;
        timeoutRefs.current.restartCount = 0;

        clearAllTimers(timerRefs.current);

        if (propsRef.current.isActive) {
            const activeTarget = normalizeText(propsRef.current.targetWord);
            if (propsRef.current.isWordMode) {
                armWordTimeout(
                    activeTarget,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            } else {
                armSentenceTimeout(
                    activeTarget,
                    stateRefs.current.transcript,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            }
        }
    }, [targetWord]);

    useEffect(() => {
        timeoutRefs.current.graceEnd = Date.now() + 500;
        timeoutRefs.current.restartCount = 0;
    }, []);

    useEffect(() => {
        const recognition = recognitionRef.current;
        if (!recognition) return;

        if (isActive) {
            try {
                stateRefs.current.hasMatched = false;
                stateRefs.current.lastProcessed = -1;
                stateRefs.current.lastProcessedSentence = -1;
                clearAllTimers(timerRefs.current);

                if (!stateRefs.current.isListening) {
                    stateRefs.current.isListening = true;
                    recognition.start();
                }
                stateRefs.current.lastSpeechAt = Date.now();
            } catch (e) {
                console.debug("Speech recognition start failed:", e);
            }

            const activeTarget = normalizeText(propsRef.current.targetWord);
            if (propsRef.current.isWordMode) {
                armWordTimeout(
                    activeTarget,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            } else {
                armSentenceTimeout(
                    activeTarget,
                    stateRefs.current.transcript,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            }
        } else {
            try {
                stateRefs.current.isListening = false;
                clearAllTimers(timerRefs.current);
                recognition.stop();
            } catch (e) {
                console.debug("Speech recognition stop failed:", e);
            }
        }
    }, [isActive]);
}
