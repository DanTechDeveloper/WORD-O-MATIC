import { isWordMatch, normalizeText } from "@/lib/speechUtils";

// ponytail: opt-in ASR counters — set window.__asrStats = {} in console to
// measure conf histogram + settle-vs-5s-vs-authoritative fire rates. Zero cost
// when absent (single typeof check), no behavior change.
function bump(path, conf) {
    try {
        const w = typeof window !== "undefined" ? window.__asrStats : null;
        if (!w) return;
        const e = (w[path] ??= { n: 0, confSum: 0 });
        e.n++;
        if (typeof conf === "number") e.confSum += conf;
    } catch {
        /* noop */
    }
}

// ponytail: Deepgram message router extracted from useDeepgramRecognition's
// conn.on("message") — pure event -> processor dispatch, unit-testable without
// mounting the hook (node env, no mic/WebSocket). The hook passes its refs
// straight through; behavior is identical to the inline version.
export function routeRecognitionMessage(data, stateRefs, timerRefs, timeoutRefs, propsRef) {
    if (!data || data.type !== "Results") return;
    if (!propsRef.current?.isActive) return;
    if (propsRef.current?.muted) return;
    const isFinal = !!data.is_final;
    const speechFinal = !!data.speechFinal;
    const alt = data.channel?.alternatives?.[0] ?? {};
    const transcript = alt.transcript ?? "";
    const confidence = typeof alt.confidence === "number" ? alt.confidence : 1;
    if (!transcript && !isFinal && !speechFinal) return;
    bump("route", confidence);
    const result = {
        isFinal,
        speechFinal,
        confidence,
        0: { transcript },
    };
    const target = normalizeText(propsRef.current.targetWord);
    if (propsRef.current.isWordMode) {
        processWordModeResult(
            result,
            target,
            stateRefs,
            timerRefs,
            timeoutRefs,
            propsRef,
        );
    } else {
        processSentenceModeResult(
            result,
            target,
            stateRefs,
            timeoutRefs,
            timerRefs,
            propsRef,
        );
    }
}

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

// ponytail: strict-prefix check — full is a non-empty exact head of ref
// ("the cat" vs "the cat sat"). A mid-sentence authoritative final (Deepgram
// endpointing on a pause, not a wrong word) defers to the 5s watchdog
// instead of instant-failing the fluent reader.
function isStrictPrefix(full, ref) {
    const fw = full.split(/\s+/).filter(Boolean);
    const tw = ref.split(/\s+/).filter(Boolean);
    return (
        fw.length > 0 &&
        fw.length < tw.length &&
        fw.every((w, i) => w === tw[i])
    );
}

export function countConsecutiveMatches(full, lookahead) {
    const fw = normalizeText(full)
        .split(/\s+/)
        .filter(Boolean)
        .filter((w, i, arr) => i === 0 || w !== arr[i - 1]);
    const tw = normalizeText(lookahead).split(/\s+/).filter(Boolean);
    if (fw.length === 0 || tw.length === 0) return 0;
    let start = -1;
    for (let i = 0; i < fw.length; i++) {
        if (fw[i] === tw[0] || isWordMatch(fw[i], tw[0])) {
            start = i;
            break;
        }
    }
    if (start === -1) return 0;
    let matched = 0;
    let i = start;
    while (matched < tw.length && i < fw.length) {
        if (fw[i] === tw[matched] || isWordMatch(fw[i], tw[matched])) {
            matched++;
        }
        i++;
    }
    return matched;
}

export function armSentenceTimeout(stateRefs, timerRefs, propsRef) {
    clearTimeout(timerRefs.current.sentence);

    // ponytail: 1s tick — tuloy-tuloy basa, mid-sentence pause 3s lang RED
    // (dati 5s, matagal ma-stuck). First/second tuldok same.
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
            !timerRefs.current.wordSettle &&
            timeoutRefs.current.target === target
        ) {
            bump("word.timeout5s");
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

    // ponytail: verdict confidence — mirrors the word-mode 0.6 Wrong gate.
    // Missing confidence defaults to 1 (Deepgram always sends it; keeps
    // existing callers/tests on the authoritative path).
    const confidence =
        typeof result.confidence === "number" ? result.confidence : 1;

    // ponytail: wordless finals (" " from an empty transcript) are pause
    // artifacts, not speech — they must not re-base the 5s silence watchdog.
    if (normalizeText(newFinals) || normalizeText(newInterim)) {
        stateRefs.current.lastSpeechAt = Date.now();
    }

    // Prevent memory leaks: keep only the recent words in memory
    const rawLookahead = normalizeText(propsRef.current.lookahead);
    const refWordCount = (rawLookahead || target).split(/\s+/).filter(Boolean).length;
    const maxWords = refWordCount + 5;
    const words = stateRefs.current.transcript.split(/\s+/).filter(Boolean);
    if (words.length > maxWords) {
        stateRefs.current.transcript = words.slice(-maxWords).join(" ");
    }

    const full = buildFullSentence(stateRefs.current.transcript, newInterim);

    armSentenceTimeout(stateRefs, timerRefs, propsRef);

    stateRefs.current.stoppedAt = Date.now();
    if (rawLookahead) {
        const advanceCount = countConsecutiveMatches(full, rawLookahead);
        const fullMatch = advanceCount >= refWordCount;
        if (
            !stateRefs.current.hasMatched &&
            advanceCount > 0 &&
            (hasAuthoritative || fullMatch)
        ) {
            bump("sentence.advance");
            stateRefs.current.hasMatched = true;
            stateRefs.current.mispronouncedSentence = false;
            propsRef.current.onWordRecognized?.(advanceCount);
            clearAllTimers(timerRefs.current);
            return;
        }

        if (stateRefs.current.hasMatched) {
            clearAllTimers(timerRefs.current);
            return;
        }

        if (Date.now() < timeoutRefs.current.graceEnd) return;
        if (stateRefs.current.mispronouncedSentence) return;

        if (!hasAuthoritative && propsRef.current.onProgress) {
            if (advanceCount > 0) propsRef.current.onProgress(advanceCount);
        }

        if (hasAuthoritative) {
            if (advanceCount === 0 && confidence >= 0.6) {
                // Pause artifact (endpointed empty final mid-sentence): let
                // the 5s watchdog own the silence instead of failing the
                // reader. Non-empty mismatch is a real wrong word → fail fast.
                // FIX: low-confidence zero-match finals (noise hallucinated as
                // a word) also defer to the watchdog instead of instant-fail.
                if (!full) {
                    bump("sentence.emptyDeferred");
                    return;
                }
                bump("sentence.instantFail");
                stateRefs.current.mispronouncedSentence = true;
                propsRef.current.onMispronounced?.(full);
                clearAllTimers(timerRefs.current);
            } else if (advanceCount === 0) {
                bump("sentence.lowConfDeferred");
            }
            return;
        }
        return;
    }
    const scope = matchScope(full, target);
    if (
        !stateRefs.current.hasMatched &&
        isWordMatch(scope, target)
    ) {
        bump("sentence.advance");
        stateRefs.current.hasMatched = true;
        stateRefs.current.mispronouncedSentence = false;
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
    // FIX: low-confidence mismatch defers to the 5s watchdog (noise, not wrong).
    if (hasAuthoritative) {
        if (!isWordMatch(scope, target)) {
            if (confidence < 0.6) {
                bump("sentence.lowConfDeferred");
                return;
            }
            // Same pause tolerance as the lookahead path: an exact head of a
            // multi-word target is incomplete speech, not a wrong word.
            if (isStrictPrefix(full, target)) {
                bump("sentence.prefixDeferred");
                return;
            }
            bump("sentence.instantFail");
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
    if (!result) return;

    const transcript = normalizeText(result[0]?.transcript);
    if (!transcript) {
        bump("word.emptyDrop", result.confidence);
        return;
    }

    stateRefs.current.stoppedAt = Date.now();

    if (stateRefs.current.hasMatched) return;

    // ponytail: 5s clock arms once per target (hook re-arms on target change) —
    // the !== target check makes this self-healing: the first result for a new
    // target arms it (recording timeoutRefs.target for the settle guard),
    // later interims skip it instead of pushing the no-speech fallback out.
    // The !wordSettle guard in armWordTimeout lets the pending settle deliver
    // the verdict with transcript instead of racing it.
    if (
        !stateRefs.current.mispronouncedInWord &&
        timeoutRefs.current.target !== target
    ) {
        armWordTimeout(target, stateRefs, timerRefs, timeoutRefs, propsRef);
    }
    // ponytail: grace drops Wrong verdicts only — a fast correct at 200ms
    // still wins inside the 50ms re-render tick.
    const matchedTarget = isWordMatch(transcript, target);
    if (Date.now() < timeoutRefs.current.graceEnd && !matchedTarget) return;

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

    const confidence = typeof result.confidence === "number" ? result.confidence : 1;
    const isAuthoritative = !!result.isFinal || !!result.speechFinal;
    // ponytail: exact-match is already strict — confidence gates only the Wrong
    // path, never the accept. Soft-but-correct kids no longer false-negative.
    // FIX: a Correct arriving after a premature Wrong still wins — the early
    // endpointed fragment (stutter "ca" for "cat") must not lock out the true
    // word. The engine cancels the pending mispronounce advance on recognize.
    if (matchedTarget) {
        bump("word.accept", confidence);
        stateRefs.current.hasMatched = true;
        stateRefs.current.mispronouncedInWord = false;
        propsRef.current.onWordRecognized?.();
        clearAllTimers(timerRefs.current);
        return;
    }

    // ponytail: BF29b — authoritative wrong with confidence >=0.6 fires immediately; B guard 1000ms defers so fast correct at 200ms wins
    if (
        isAuthoritative &&
        confidence >= 0.6 &&
        !stateRefs.current.mispronouncedInWord &&
        !matchedTarget &&
        sinceSwitch >= 1000
    ) {
        bump("word.instantWrong", confidence);
        stateRefs.current.mispronouncedInWord = true;
        propsRef.current.onMispronounced?.(transcript);
        clearAllTimers(timerRefs.current);
        return;
    }

    // ponytail: settle tolerates stutter/pauses (1200ms for K-5 slow readers —
    // was 700ms); every new interim re-arms it, so it only fires after real
    // settling. 5s armWordTimeout stays the no-speech fallback.
    // FIX silence-safe: low-confidence noise (background hum, mic transient
    // hallucinated as a word) must not arm the settle at all — without speech
    // evidence the verdict belongs to the 5s no-speech fallback, not to Wrong.
    if (!stateRefs.current.mispronouncedInWord && confidence >= 0.6) {
        const settleTarget = target;
        const settleTranscript = transcript;
        const settleConf = confidence;
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
                bump("word.settleFire", settleConf);
                s.mispronouncedInWord = true;
                propsRef.current.onMispronounced?.(settleTranscript);
            }
        }, 1200);
    }
}
