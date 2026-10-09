import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useGameplayCore } from "./useGameplayCore";
import { playFeedbackSound, playSuccessSound } from "@/utils/sounds";
import { readResumeSession, writeResumeSession } from "@/utils/resumeStorage";

// Story Quest engine — one continuous read of the whole paragraph. Word level
// = highlight verdicts only, game level = accumulated score + ONE feedback at
// the last word. There are NO sentence boundaries in the flow: nothing stops,
// nothing resets, and no period anywhere gets its own checkpoint. Core owns
// gameState/countdown/timer/resume/persist; this wrapper owns verdicts, the
// end-of-round celebration, and tiered feedback. Core's per-word feedback
// machine (streak/explosion/points popups) is never invoked here, so Word
// Blast behavior is untouched.

// ponytail: SCORING ONLY, never flow. Buckets the finished per-word verdicts
// into per-sentence counts for the `sentence_scores` payload — the Sentence
// Star badge (BadgeService::calculateBestSentence) is its only consumer, and
// the server cannot derive it (it never learns WHICH words were correct).
// Nothing here stops the read or resets the recognizer; the whole array is
// computed once, at the end. Boundaries come from the word tokens themselves
// (ParagraphWord rows are whitespace-split case-as-entered, so a sentence ends
// at a token with trailing [.!?]) — mirrors the server split
// (ParagraphModule::sentencesFromContent).
function rangesFromWords(words) {
    const ranges = [];
    let start = 0;
    (words || []).forEach((w, i) => {
        if (/[.!?][”"']?$/.test(String(w?.word || "").trim())) {
            ranges.push({ start, end: i + 1 });
            start = i + 1;
        }
    });
    if (start < (words || []).length) {
        ranges.push({ start, end: (words || []).length });
    }
    return ranges.length > 0 ? ranges : [{ start: 0, end: (words || []).length }];
}

// ponytail: review window — verdicts (GREEN/RED) show 1000ms before the
// modal+blur covers, then 2500ms celebration. Feedback audio also late
// (with modal, not verdict) so preview stays silent for review.
const VERDICT_PREVIEW_MS = 1000;
const BREAK_MS = 2500;


// ponytail: top tiers stay fixed (earned praise is consistent); the bottom
// band rotates through the existing mispronounce voice lines so low scores
// sound corrective, not celebratory. Every string MUST exist in
// FEEDBACK_FILES (sounds.js) or no audio plays. Randomness is presentation
// only — score/ratio/badges/teacher data stay deterministic.
const LOW_TIER_POOL = ["Nope!", "Not Quite!", "Again!", "Keep Trying!", "Try Again"];

// ponytail: ratio tiers (100/75/50 ~ percentage) drive message + audio.
// Straight-through: fed the OVERALL ratio at final completion — the message
// is the only feedback rendered, never a score.
function tierMessage(scoreRatio) {
    if (scoreRatio >= 1) return "Excellent!";
    if (scoreRatio >= 0.75) return "Nailed It!";
    if (scoreRatio >= 0.5) return "Great!";
    return LOW_TIER_POOL[Math.floor(Math.random() * LOW_TIER_POOL.length)];
}

export function useStoryQuestEngine({ saveEndpoint = "/student/saveParagraphProgress", ...rest }) {
    const resume = useMemo(() => {
        // ponytail: tutorial (deferPersist) never resumes — mirrors the core gate.
        if (typeof window === "undefined" || rest.deferPersist) return null;
        return rest.resumeData
            ? rest.resumeData
            : (rest.moduleId ? readResumeSession(rest.moduleId, "para") : null);
    }, [rest.resumeData, rest.moduleId, rest.deferPersist]);

    const sentenceScoresRef = useRef([]);
    // ponytail: stable getter identity — an inline arrow would churn
    // persistProgress identity and reset the 60s timer effect. Reads the
    // live ref instead, so the final sentence is included even when core's
    // COMPLETED effect persists before this commit's effects run.
    const persistExtra = useCallback(
        () => ({
            sentence_scores: sentenceScoresRef.current,
            // ponytail: overrides core's `streak: maxStreakRef.current` because
            // `...extra` spreads AFTER it (useGameplayCore.js:345-347). Safe
            // precisely because it does NOT touch core's ref — a ref is stable,
            // so the [] deps below stay correct.
            streak: maxStreakRef.current,
        }),
        []
    );

    // ponytail: scope "para" — see useWordBlastEngine. Paragraph ids collide
    // with word ids per level, so without this a Story Quest record could be
    // resumed by Word Blast (and its pending commit replayed to the wrong
    // endpoint). Paragraphs are NEVER shuffled; this is identity, not order.
    const core = useGameplayCore({ ...rest, saveEndpoint, persistExtra, scope: "para" });

    const [verdicts, setVerdicts] = useState(() => resume?.verdicts ?? {});
    const [sentenceScores, setSentenceScores] = useState(() => resume?.sentenceScores ?? []);
    const [sentenceFeedback, setSentenceFeedback] = useState(null);
    const [sentenceBreak, setSentenceBreak] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [justScored, setJustScored] = useState(false);
    // ponytail: mirror of Word Blast's streak feel for the straight-through
    // read — counts consecutive correct words, reset on a wrong verdict.
    const [streakCount, setStreakCount] = useState(0);
    const [streakShake, setStreakShake] = useState(null);
    const streakShakeTimerRef = useRef(null);
    const streakRef = useRef(0);
    // ponytail: peak streak for the round — the story_streak badge metric.
    // SEVERE separation from core: Word Blast's streak lives in core's
    // maxStreakRef, SQ's here. Never merge these two (locked by
    // storyQuestStreak.test.js) or one mode's streak would feed the other's
    // badges. resetStreak must NOT clear it — that is the whole point of peak.
    const maxStreakRef = useRef(0);

    const verdictsRef = useRef(verdicts);
    const gameStateRef = useRef(core.gameState);
    const finalTimerRef = useRef(null);
    const finalizingRef = useRef(false);
    const wrongTimerRef = useRef(null);
    const scoredTimerRef = useRef(null);
    const completionGuardRef = useRef(false);
    const previewTimerRef = useRef(null);
    const onWordRecognizedRef = useRef(rest.onWordRecognized);
    const onMispronounceRef = useRef(rest.onMispronounce);
    sentenceScoresRef.current = sentenceScores;
    verdictsRef.current = verdicts;
    gameStateRef.current = core.gameState;
    onWordRecognizedRef.current = rest.onWordRecognized;
    onMispronounceRef.current = rest.onMispronounce;

    const clearBreak = useCallback(() => {
        clearTimeout(previewTimerRef.current);
        clearTimeout(finalTimerRef.current);
        finalTimerRef.current = null;
        finalizingRef.current = false;
        previewTimerRef.current = null;
        completionGuardRef.current = false;
        setSentenceBreak(false);
    }, []);

    // ponytail: consecutive-correct drive the header shake; one blast sound
    // per verdict batch (not per word) keeps the straight-through read alive.
    const bumpStreak = useCallback((correctN) => {
        streakRef.current += correctN;
        maxStreakRef.current = Math.max(maxStreakRef.current, streakRef.current);
        setStreakCount(streakRef.current);
        if (streakRef.current >= 2) {
            const intensity =
                streakRef.current >= 8 ? "intense" : streakRef.current >= 5 ? "medium" : "subtle";
            setStreakShake(intensity);
            clearTimeout(streakShakeTimerRef.current);
            streakShakeTimerRef.current = setTimeout(
                () => setStreakShake(null),
                intensity === "intense" ? 500 : 400,
            );
        }
    }, []);
    const resetStreak = useCallback(() => {
        streakRef.current = 0;
        setStreakCount(0);
        setStreakShake(null);
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(previewTimerRef.current);
            clearTimeout(finalTimerRef.current);
            clearTimeout(wrongTimerRef.current);
            clearTimeout(scoredTimerRef.current);
        };
    }, []);

    // Resume payload = core shape + SQ detail (superset of the same key;
    // this effect runs after core's, so it wins the write).
    useEffect(() => {
        if (typeof window === "undefined" || !rest.moduleId || rest.deferPersist || core.gameState !== "ACTIVE") {
            return;
        }
        // ponytail: clamp timeLeft 0-60; savedAt rides along for backward compat but is no longer read (clock pauses while away)
        writeResumeSession(rest.moduleId, {
            moduleId: rest.moduleId,
            scope: "para",
            currentWordIndex: core.currentWordIndex,
            wordsSmashed: core.wordsSmashed,
            // DELIBERATELY 0, and deliberately not symmetric with Word Blast.
            //
            // Word Blast round-trips both values (`resume?.currentStreak ?? 0`)
            // because core owns that streak and needs it to resume the header
            // chip mid-round. SQ owns its streak in streakRef/maxStreakRef, which
            // are useRef — they cannot be seeded from a resume record the way
            // useState can, and core reads neither for SQ.
            //
            // Only maxStreak matters: it is the value the story_streak badge
            // consumes (via persistExtra), so the peak survives an F5 and the
            // badge under-reports nothing. Restoring the running streak would
            // buy a header chip that resumes mid-shake — cosmetic, and it would
            // require re-seeding two refs, for nothing the badge reads.
            // Reintroduce only if the mid-round chip is worth the coupling.
            currentStreak: 0,
            maxStreak: maxStreakRef.current,
            timeLeft: Math.max(0, Math.min(60, Math.floor(core.timeLeft))),
            savedAt: Date.now(),
            verdicts,
            sentenceScores,
        });
    }, [
        rest.moduleId,
        core.gameState,
        core.currentWordIndex,
        core.wordsSmashed,
        core.maxStreak,
        core.timeLeft,
        verdicts,
        sentenceScores,
    ]);

    const pulseWrong = useCallback(() => {
        setIsWrong(true);
        clearTimeout(wrongTimerRef.current);
        wrongTimerRef.current = setTimeout(() => setIsWrong(false), 900);
    }, []);

    const pulseScored = useCallback(() => {
        setJustScored(true);
        clearTimeout(scoredTimerRef.current);
        scoredTimerRef.current = setTimeout(() => setJustScored(false), 500);
    }, []);

    // ponytail: the round's ONLY stop — reached at the last word, whatever
    // sentence the reader happens to be in. No range argument, and no
    // `rangeIdx + 1 < ranges.length` guard: that leftover from the old
    // per-sentence-break design made callers resolve the range with
    // findIndex(r => idx < r.end) = the FIRST range the index sits in, so a
    // final batch starting inside a non-final sentence (a fluent reader
    // swallowing the tail in one breath) hit the guard and swallowed the whole
    // completion — no modal, no sound, no moveToNextWord, verdicts already
    // locked so every handler early-returns: a dead round to the 60s cap.
    // ponytail: the `sentence*` names below are legacy vocabulary for
    // paragraph-level state (same as the DB column) — nothing steps per
    // sentence anymore.
    const completeSentence = useCallback(() => {
        if (completionGuardRef.current) return;
        completionGuardRef.current = true;
        // ponytail: hold the final streak chip through the 1000ms silent
        // verdict preview + celebration modal — otherwise the header clears
        // it 400ms after the last correct word and a one-breath perfect read
        // shows no streak at all.
        //
        // PEAK, not current streak. A round that ran an 8-streak then missed
        // its last word resets streakRef to 0, so reading it here showed "WARM!"
        // for the one round the kid actually earned Story Legend on. Reads the
        // same value the badge consumes (maxStreakRef), so the header and the
        // badge can never disagree about what happened.
        clearTimeout(streakShakeTimerRef.current);
        if (maxStreakRef.current >= 2) {
            setStreakShake(
                maxStreakRef.current >= 8 ? "intense" : maxStreakRef.current >= 5 ? "medium" : "subtle",
            );
        }

        // ponytail: end-of-round bucketing, scoring only (see rangesFromWords).
        // Counted from the finished verdicts so sentence_scores stays intact
        // for the Sentence Star badge (sum == smashed). Sync the ref alongside
        // state (see persistExtra comment above).
        const allScores = rangesFromWords(rest.words).map((r) => {
            let correct = 0;
            for (let i = r.start; i < r.end; i++) {
                if (verdictsRef.current[i] === "correct") correct++;
            }
            return correct;
        });
        sentenceScoresRef.current = allScores;
        setSentenceScores(allScores);

        const totalCorrect = allScores.reduce((a, b) => a + b, 0);
        const total = core.totalWords > 0 ? core.totalWords : 1;
        const message = tierMessage(totalCorrect / total);
        setSentenceFeedback({ message });

        // End of the paragraph: verdicts visible 1000ms silent preview before
        // modal, then hold the celebration (bubble + modal + sound late
        // with modal). The move is deferred so the review moment shows.
        clearTimeout(previewTimerRef.current);
        previewTimerRef.current = setTimeout(() => {
            previewTimerRef.current = null;
            playFeedbackSound(message);
            pulseScored();
            setSentenceBreak(true);
            finalizingRef.current = true;
            clearTimeout(finalTimerRef.current);
            finalTimerRef.current = setTimeout(() => {
                finalTimerRef.current = null;
                finalizingRef.current = false;
                core.moveToNextWord(Math.max(1, core.totalWords - core.currentWordIndex));
            }, BREAK_MS);
        }, VERDICT_PREVIEW_MS);
    }, [
        rest.words,
        pulseScored,
        core.moveToNextWord,
        core.totalWords,
        core.currentWordIndex,
    ]);

    const handleWordRecognized = useCallback((count = 1) => {
        if (gameStateRef.current !== "ACTIVE" || sentenceBreak) return;
        const idx = core.currentWordIndex;
        if (idx >= core.totalWords) return;
        if (verdictsRef.current[idx] !== undefined) return;

        // ponytail: straight-through — no sentence-boundary clamp; overshoot
        // just reads on (clamped only at the paragraph end).
        const n = Math.max(1, Math.min(count | 0 || 1, Math.max(core.totalWords - idx, 1)));

        // ponytail: side effects stay out of the setState updater (StrictMode
        // double-invokes updaters — mastery POSTs must fire exactly once).
        const marked = {};
        for (let k = 0; k < n; k++) {
            marked[idx + k] = "correct";
            const w = rest.words?.[idx + k];
            if (w) onWordRecognizedRef.current?.(w);
        }
        verdictsRef.current = { ...verdictsRef.current, ...marked };
        setVerdicts(verdictsRef.current);
        core.addScore(n);
        bumpStreak(n);
        playSuccessSound();

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + n >= core.totalWords) {
            completeSentence();
        } else {
            core.moveToNextWord(n);
        }
    }, [
        sentenceBreak,
        completeSentence,
        core.currentWordIndex,
        core.totalWords,
        core.addScore,
        core.moveToNextWord,
        rest.words,
        bumpStreak,
    ]);

    // ponytail: batch verdicts from sentence alignment (GREEN/RED/…GREEN in
    // one authoritative pass). Sequential single calls can't do this — each
    // would read a stale currentWordIndex closure in the same tick — so the
    // batch computes from one base index, one verdict write, one index move.
    const handleSentenceVerdict = useCallback((outcomes) => {
        if (gameStateRef.current !== "ACTIVE" || sentenceBreak) return;
        if (!Array.isArray(outcomes) || outcomes.length === 0) return;
        const idx = core.currentWordIndex;
        if (idx >= core.totalWords) return;
        if (verdictsRef.current[idx] !== undefined) return;

        // ponytail: straight-through — no sentence-boundary clamp; the batch
        // applies to the paragraph tail (clamped only at the paragraph end).
        const applied = outcomes.slice(0, Math.max(core.totalWords - idx, 1));
        if (applied.length === 0) return;

        // ponytail: side effects stay out of the setState updater (StrictMode
        // double-invokes updaters — mastery POSTs must fire exactly once).
        const marked = {};
        let correct = 0;
        let wrong = 0;
        applied.forEach((v, k) => {
            const verdict = v === "wrong" ? "wrong" : "correct";
            marked[idx + k] = verdict;
            const w = rest.words?.[idx + k];
            if (!w) return;
            if (verdict === "correct") {
                correct++;
                onWordRecognizedRef.current?.(w);
            } else {
                wrong++;
                onMispronounceRef.current?.(w);
            }
        });
        verdictsRef.current = { ...verdictsRef.current, ...marked };
        setVerdicts(verdictsRef.current);
        if (correct > 0) {
            core.addScore(correct);
            bumpStreak(correct);
            playSuccessSound();
        }
        if (wrong > 0) {
            pulseWrong();
            resetStreak();
        }

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + applied.length >= core.totalWords) {
            completeSentence();
        } else {
            core.moveToNextWord(applied.length);
        }
    }, [
        sentenceBreak,
        completeSentence,
        pulseWrong,
        bumpStreak,
        resetStreak,
        core.currentWordIndex,
        core.totalWords,
        core.addScore,
        core.moveToNextWord,
        rest.words,
    ]);

    const handleMispronounce = useCallback(() => {
        if (gameStateRef.current !== "ACTIVE" || sentenceBreak) return;
        const idx = core.currentWordIndex;
        if (idx >= core.totalWords) return;
        if (verdictsRef.current[idx] !== undefined) return;

        const wordObj = rest.words?.[idx];
        if (!wordObj) return;
        onMispronounceRef.current?.(wordObj);

        setVerdicts((prev) => ({ ...prev, [idx]: "wrong" }));
        verdictsRef.current = { ...verdictsRef.current, [idx]: "wrong" };
        pulseWrong();
        resetStreak();

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + 1 >= core.totalWords) {
            completeSentence();
        } else {
            core.moveToNextWord(1);
        }
    }, [
        sentenceBreak,
        completeSentence,
        pulseWrong,
        resetStreak,
        core.currentWordIndex,
        core.totalWords,
        core.moveToNextWord,
        rest.words,
    ]);

    // Wrapped: never let the break outlive the round (timer keeps
    // running through celebration by design — no pause). If time runs out
    // mid final-celebration, the round is already complete — force the
    // deferred move now (→ COMPLETED + persist) instead of GAMEOVER.
    const handleTimeUp = useCallback(() => {
        if (finalizingRef.current) {
            clearTimeout(finalTimerRef.current);
            finalTimerRef.current = null;
            finalizingRef.current = false;
            setSentenceBreak(false);
            setSentenceFeedback(null);
            core.moveToNextWord(Math.max(1, core.totalWords - core.currentWordIndex));
            return;
        }
        clearBreak();
        setSentenceFeedback(null);
        core.handleTimeUp();
    }, [clearBreak, core.handleTimeUp, core.moveToNextWord, core.totalWords, core.currentWordIndex]);

    const handleFatalError = useCallback(() => {
        clearBreak();
        setSentenceFeedback(null);
        core.handleFatalError();
    }, [clearBreak, core.handleFatalError]);

    return {
        ...core,
        // Neutralized: SQ has no per-word feedback machine.
        currentStreak: streakCount,
        // ponytail: DELIBERATELY core.maxStreak, NOT streakRef/maxStreakRef.
        // Word Blast's streak is core's ref; binding SQ's here would let a
        // Story Quest round feed Word Blast streak badges (and vice versa on
        // resume, via the line above). SQ's own peak travels via persistExtra
        // instead. Do not "fix" this — locked by storyQuestStreak.test.js.
        maxStreak: core.maxStreak,
        isMispronounced: isWrong,
        isExploding: false,
        showPointsFeedback: false,
        pointsFeedbackValue: 0,
        scoreEmphasize: justScored,
        feedbackType: sentenceFeedback ? "correct" : null,
        feedbackMessage: sentenceFeedback?.message ?? "",
        streakShake,
        handleTimeUp,
        handleFatalError,
        handleWordRecognized,
        handleMispronounce,
        handleSentenceVerdict,
        verdicts,
        sentenceScores,
        sentenceFeedback,
        sentenceBreak,
    };
}
