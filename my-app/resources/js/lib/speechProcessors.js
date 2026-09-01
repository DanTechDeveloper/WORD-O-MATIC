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

// ponytail: single-word targets (Story Quest one-by-one) match only against the
// most recent speech (tail window), so a word spoken long ago / out of order does
// not satisfy the current word. W=4 tolerates fillers; tunable. Multi-word targets
// (the designed sentence contract) keep matching the whole buffer.
const TAIL_WINDOW = 4;
function matchScope(full, target) {
    const isSingleWord = target.split(/\s+/).filter(Boolean).length === 1;
    if (!isSingleWord) return full;
    const words = full.split(/\s+/).filter(Boolean);
    return words.slice(-TAIL_WINDOW).join(" ");
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

export function armWordTimeout(
    target,
    stateRefs,
    timerRefs,
    timeoutRefs,
    propsRef,
) {
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
    result,
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

    if (result?.[0]) {
        const isAuthoritative = !!(result.isFinal || result.speechFinal);
        if (isAuthoritative) hasAuthoritative = true;
        if (result.isFinal) {
            newFinals = result[0].transcript + " ";
        } else {
            newInterim = result[0].transcript;
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
    const scope = matchScope(full, target);
    if (
        !stateRefs.current.hasMatched &&
        !stateRefs.current.mispronouncedSentence &&
        isFuzzyMatch(scope, target)
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
        for (
            let i = 0;
            i < Math.min(targetWords.length, fullWords.length);
            i++
        ) {
            const fw = normalizeText(fullWords[i]);
            const tw = normalizeText(targetWords[i]);
            if (fw === tw || isFuzzyMatch(fw, tw)) prefixMatched++;
            else break;
        }
        if (prefixMatched > 0) propsRef.current.onProgress(prefixMatched);
    }

    // Authoritative mismatch → immediate verdict (Deepgram empty/low-conf or speechFinal)
    if (hasAuthoritative) {
        if (!isFuzzyMatch(scope, target)) {
            stateRefs.current.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(full);
            clearAllTimers(timerRefs.current);
        }
        return;
    }

    // ponytail: no settle timer — rely on Deepgram isFinal/speechFinal for a wrong
    // verdict and the 5s armSentenceTimeout for total silence. Removes the 900ms
    // false-kill of slow-but-correct readers (Story Quest only; Word Blast untouched).
}

export function processWordModeResult(
    result,
    target,
    stateRefs,
    timerRefs,
    timeoutRefs,
    propsRef,
) {
    if (Date.now() < timeoutRefs.current.graceEnd) return;
    if (!result) return;

    const transcript = normalizeText(result[0]?.transcript);
    if (!transcript) return;

    stateRefs.current.stoppedAt = Date.now();

    if (stateRefs.current.hasMatched) return;

    if (!stateRefs.current.mispronouncedInWord) {
        armWordTimeout(target, stateRefs, timerRefs, timeoutRefs, propsRef);
    }

    if (
        !stateRefs.current.mispronouncedInWord &&
        isWordMatch(transcript, target)
    ) {
        stateRefs.current.hasMatched = true;
        propsRef.current.onWordRecognized?.();
        clearAllTimers(timerRefs.current);
        return;
    }

    // ponytail: authoritative final on a non-matching word → immediate mispronounce.
    // Without this, a correct word spoken after a wrong interim can be pre-empted
    // by the 900ms wordSettle firing on the stale interim — causing false mispronounce.
    if (!stateRefs.current.mispronouncedInWord && result.isFinal) {
        stateRefs.current.mispronouncedInWord = true;
        clearAllTimers(timerRefs.current);
        propsRef.current.onMispronounced?.(transcript);
        return;
    }

    if (!stateRefs.current.mispronouncedInWord) {
        // Ponytail: captured at arm time, rechecked at fire.
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
                s.mispronouncedInWord = true;
                propsRef.current.onMispronounced?.(settleTranscript);
            }
        }, 850);
    }
}
