import { isWordMatch, normalizeText } from "@/lib/speechUtils";

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
    clearTimeout(timerRefs.current.wordSettle);
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
        isWordMatch(scope, target)
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
        const fullWords = full
            .split(/\s+/)
            .filter(Boolean)
            // ponytail: dedupe adjacent repeats so a stumble ("The... The dog runs")
            // doesn't reset prefixMatched to 0 mid-sentence.
            .filter((w, i, arr) => i === 0 || w !== arr[i - 1]);
        let prefixMatched = 0;
        for (
            let i = 0;
            i < Math.min(targetWords.length, fullWords.length);
            i++
        ) {
            const fw = normalizeText(fullWords[i]);
            const tw = normalizeText(targetWords[i]);
            if (fw === tw || isWordMatch(fw, tw)) prefixMatched++;
            else break;
        }
        if (prefixMatched > 0) propsRef.current.onProgress(prefixMatched);
    }

    // Authoritative mismatch → immediate verdict (Deepgram empty/low-conf or speechFinal)
    if (hasAuthoritative) {
        if (!isWordMatch(scope, target)) {
            stateRefs.current.mispronouncedSentence = true;
            propsRef.current.onMispronounced?.(full);
            clearAllTimers(timerRefs.current);
        }
        return;
    }
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

    // ponytail: A+B stale-tail guard — a late final for the PREVIOUS word
    // ("cat" tail arriving at t+80ms after switch to "dog") must not
    // instantly mispronounce the NEW word, nor falsely match it.
    const sinceSwitch = timeoutRefs.current.targetChangedAt
        ? Date.now() - timeoutRefs.current.targetChangedAt
        : Infinity;
    if (
        timeoutRefs.current.prevTarget &&
        sinceSwitch < 500 &&
        isWordMatch(transcript, timeoutRefs.current.prevTarget)
    ) {
        return;
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

    // ponytail: BF29b — Deepgram isFinal/speechFinal on a non-matching transcript
    // is the authoritative wrong-word verdict. Fire immediately instead of waiting
    // 1500ms for the interim settle (the user's "the moment DO leaves the mouth"
    // case). B guard: within 1000ms of a target switch, defer to the settle so a
    // fast correct ("dog" at 200ms) can cancel the stale wrong settle. 350ms was
    // too short — kids need ~800ms to read new word, so random noise at 400ms
    // was hatol kaagad.
    const isAuthoritative = !!result.isFinal || !!result.speechFinal;
    if (
        isAuthoritative &&
        !stateRefs.current.mispronouncedInWord &&
        !isWordMatch(transcript, target) &&
        sinceSwitch >= 1000
    ) {
        stateRefs.current.mispronouncedInWord = true;
        propsRef.current.onMispronounced?.(transcript);
        clearAllTimers(timerRefs.current);
        return;
    }

    // ponytail: handle non-authoritative interim updates. Settle timer tolerates 
    // stutter or pauses, ensuring we don't drop out too fast on incomplete phrases.
    if (!stateRefs.current.mispronouncedInWord) {
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
        }, 1500);
    }
}
