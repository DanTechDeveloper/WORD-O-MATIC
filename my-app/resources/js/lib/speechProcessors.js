import { isFuzzyMatch, isWordMatch, normalizeText } from "@/lib/speechUtils";

export function clearAllTimers(timers) {
    Object.keys(timers).forEach((key) => {
        if (timers[key]) {
            clearTimeout(timers[key]);
            timers[key] = null;
        }
    });
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
        if (Date.now() - s.lastSpeechAt >= 5000) {
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
    // ponytail: Deepgram pushes one result per message; native batch loop deleted.
    // Keep single-result path — for loop was dead code for Deepgram.
    let newFinals = "";
    let newInterim = "";
    let hasAuthoritative = false;

    const r = event.results?.at(-1);
    if (r?.[0]) {
        const isAuthoritative = !!(r.isFinal || r.speechFinal);
        if (isAuthoritative) hasAuthoritative = true;
        if (r.isFinal) {
            newFinals = r[0].transcript + " ";
            stateRefs.current.lastProcessedSentence = event.results.length - 1;
        } else {
            newInterim = r[0].transcript;
            if (r.speechFinal) stateRefs.current.lastProcessedSentence = event.results.length - 1;
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

    stateRefs.current.stoppedAt = Date.now();
    if (
        !stateRefs.current.hasMatched &&
        !stateRefs.current.mispronouncedSentence &&
        isFuzzyMatch(full, target)
    ) {
        stateRefs.current.hasMatched = true;
        propsRef.current.onWordRecognized?.();
        clearAllTimers(timerRefs.current);
        return;
    }

    if (stateRefs.current.hasMatched) {
        clearAllTimers(timerRefs.current);
        return;
    }

    if (Date.now() < timeoutRefs.current.graceEnd) return;
    if (stateRefs.current.mispronouncedSentence) return;

    // Live progress: emit count of prefix-matched target words for interim
    if (!hasAuthoritative && propsRef.current.onProgress) {
        const targetWords = target.split(/\s+/).filter(Boolean);
        const fullWords = full.split(/\s+/).filter(Boolean);
        let prefixMatched = 0;
        for (let i = 0; i < Math.min(targetWords.length, fullWords.length); i++) {
            const fw = normalizeText(fullWords[i]);
            const tw = normalizeText(targetWords[i]);
            if (fw === tw || isFuzzyMatch(fw, tw)) prefixMatched++;
            else break;
        }
        if (prefixMatched > 0) propsRef.current.onProgress(prefixMatched);
    }

    // Authoritative mismatch → immediate verdict (Deepgram empty/low-conf or speechFinal)
    if (hasAuthoritative) {
        if (!isFuzzyMatch(full, target)) {
            stateRefs.current.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(full);
            clearAllTimers(timerRefs.current);
        }
        return;
    }

    // Interim non-match → settle timer (silence-gated via stoppedAt freshness)
    clearTimeout(timerRefs.current.sentenceSettle);
    timerRefs.current.sentenceSettle = setTimeout(() => {
        const s = stateRefs.current;
        const currentFull = buildFullSentence(s.transcript, s.interim);
        if (
            s.isMounted &&
            propsRef.current.isActive &&
            !s.hasMatched &&
            !s.mispronouncedSentence &&
            timeoutRefs.current.graceEnd <= Date.now()
        ) {
            // Silence-gated: if still speaking (last result <600ms ago) reschedule
            if (Date.now() - s.stoppedAt < 600) {
                timerRefs.current.sentenceSettle = setTimeout(() => {
                    if (s.isMounted && propsRef.current.isActive && !s.hasMatched && !s.mispronouncedSentence) {
                        s.mispronouncedSentence = true;
                        propsRef.current.onMispronounced?.(buildFullSentence(s.transcript, s.interim));
                        clearAllTimers(timerRefs.current);
                    }
                }, 600);
                return;
            }
            if (isFuzzyMatch(currentFull, target)) return;
            s.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(currentFull);
            clearAllTimers(timerRefs.current);
        }
    }, 900);
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
    // ponytail: Deepgram = one result per message; for loop was native batch dead code.
    const result = event.results?.at(-1);
    if (!result) return;

    const transcript = normalizeText(result[0]?.transcript);
    if (!transcript) return;

    stateRefs.current.stoppedAt = Date.now();

    if (stateRefs.current.hasMatched) {
        stateRefs.current.lastProcessed = event.results.length - 1;
        return;
    }

    if (!stateRefs.current.mispronouncedInWord) {
        armWordTimeout(target, stateRefs, timerRefs, timeoutRefs, propsRef);
    }

    if (!stateRefs.current.mispronouncedInWord && isWordMatch(transcript, target)) {
        stateRefs.current.hasMatched = true;
        stateRefs.current.lastProcessed = event.results.length - 1;
        propsRef.current.onWordRecognized?.();
        clearAllTimers(timerRefs.current);
        stateRefs.current.mispronouncedInWord = false;
        return;
    }

    if (!stateRefs.current.mispronouncedInWord) {
        // Speech settled on a non-matching word → mispronounce promptly
        // instead of waiting for (flaky) is_final or the 5s timeout.
        // ponytail: capture target at arm time, recompute staleness at fire.
        const settleTarget = target;
        const settleTranscript = transcript;
        clearTimeout(timerRefs.current.wordSettle);
        timerRefs.current.wordSettle = setTimeout(() => {
            const s = stateRefs.current;
            if (
                s.isMounted &&
                propsRef.current.isActive &&
                !s.hasMatched &&
                !s.mispronouncedInWord &&
                timeoutRefs.current.target === settleTarget
            ) {
                // Silence-gated: if still mid-utterance reschedule
                if (Date.now() - s.stoppedAt < 600) {
                    timerRefs.current.wordSettle = setTimeout(() => {
                        if (s.isMounted && propsRef.current.isActive && !s.hasMatched && !s.mispronouncedInWord && timeoutRefs.current.target === settleTarget) {
                            s.mispronouncedInWord = true;
                            propsRef.current.onMispronounced?.(settleTranscript);
                        }
                    }, 600);
                    return;
                }
                s.mispronouncedInWord = true;
                propsRef.current.onMispronounced?.(settleTranscript);
            }
        }, 900);
    }

    if (result.isFinal) {
        stateRefs.current.lastProcessed = event.results.length - 1;
    }
}
