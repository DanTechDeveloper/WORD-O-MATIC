import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import { useGameplayCore } from "./useGameplayCore";
import { playFeedbackSound } from "@/utils/sounds";
import { readResumeSession, writeResumeSession } from "@/utils/resumeStorage";

// Story Quest sentence engine — word level = highlight verdicts only,
// sentence level = score + ONE feedback, game level = accumulated score.
// Core owns gameState/countdown/timer/resume/persist; this wrapper owns
// verdicts, sentence completion, the 3s break, and tiered feedback. Core's
// per-word feedback machine (streak/explosion/points popups) is never
// invoked here, so Word Blast behavior is untouched.

// ponytail: sentence boundaries come from the word tokens themselves —
// ParagraphWord rows are whitespace-split case-as-entered, so a sentence
// ends at a token with trailing [.!?]. Mirrors the server split
// (ParagraphModule::sentencesFromContent). No content prop needed.
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

// ponytail: consolation subcopy rotates text-only (no audio) so repeats feel
// fresh. Picked once per completion — never inline in render (timer ticks
// would reshuffle it every second).
const CONSOLATION_POOL = [
    (missed) => `${missed} tricky word${missed === 1 ? "" : "s"} — you'll get them next time!`,
    (missed) => `Good effort — listen for those ${missed} tricky word${missed === 1 ? "" : "s"}!`,
    (missed) => `Almost there — practice those ${missed} tricky word${missed === 1 ? "" : "s"}!`,
];

// ponytail: ratio tiers (100/75/50 ~ percentage) drive message + audio.
// Display is always point-based ("Sentence Score: 4 / 5") — scoreRatio never renders.
function tierMessage(scoreRatio) {
    if (scoreRatio >= 1) return "Excellent!";
    if (scoreRatio >= 0.75) return "Nailed It!";
    if (scoreRatio >= 0.5) return "Great!";
    return LOW_TIER_POOL[Math.floor(Math.random() * LOW_TIER_POOL.length)];
}

export function useStoryQuestEngine({ saveEndpoint = "/student/saveParagraphProgress", ...rest }) {
    const resume = useMemo(() => {
        if (typeof window === "undefined") return null;
        return rest.resumeData
            ? rest.resumeData
            : (rest.moduleId ? readResumeSession(rest.moduleId) : null);
    }, [rest.resumeData, rest.moduleId]);

    const sentenceScoresRef = useRef([]);
    // ponytail: stable getter identity — an inline arrow would churn
    // persistProgress identity and reset the 60s timer effect. Reads the
    // live ref instead, so the final sentence is included even when core's
    // COMPLETED effect persists before this commit's effects run.
    const persistExtra = useCallback(
        () => ({ sentence_scores: sentenceScoresRef.current }),
        []
    );

    const core = useGameplayCore({ ...rest, saveEndpoint, persistExtra });

    const sentenceRanges = useMemo(() => rangesFromWords(rest.words), [rest.words]);

    const [verdicts, setVerdicts] = useState(() => resume?.verdicts ?? {});
    const [sentenceScores, setSentenceScores] = useState(() => resume?.sentenceScores ?? []);
    const [sentenceFeedback, setSentenceFeedback] = useState(null);
    const [sentenceBreak, setSentenceBreak] = useState(false);
    const [isWrong, setIsWrong] = useState(false);
    const [justScored, setJustScored] = useState(false);
    const [sentenceEpoch, setSentenceEpoch] = useState(0);
    const [breakJustEnded, setBreakJustEnded] = useState(false);

    const verdictsRef = useRef(verdicts);
    const gameStateRef = useRef(core.gameState);
    const breakTimerRef = useRef(null);
    const finalTimerRef = useRef(null);
    const finalizingRef = useRef(false);
    const justEndedTimerRef = useRef(null);
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
        clearTimeout(breakTimerRef.current);
        clearTimeout(justEndedTimerRef.current);
        clearTimeout(finalTimerRef.current);
        finalTimerRef.current = null;
        finalizingRef.current = false;
        breakTimerRef.current = null;
        previewTimerRef.current = null;
        completionGuardRef.current = false;
        setSentenceBreak(false);
        setBreakJustEnded(false);
    }, []);

    useEffect(() => {
        return () => {
            clearTimeout(previewTimerRef.current);
            clearTimeout(breakTimerRef.current);
            clearTimeout(finalTimerRef.current);
            clearTimeout(justEndedTimerRef.current);
            clearTimeout(wrongTimerRef.current);
            clearTimeout(scoredTimerRef.current);
        };
    }, []);

    // Resume payload = core shape + SQ detail (superset of the same key;
    // this effect runs after core's, so it wins the write).
    useEffect(() => {
        if (typeof window === "undefined" || !rest.moduleId || core.gameState !== "ACTIVE") {
            return;
        }
        writeResumeSession(rest.moduleId, {
            moduleId: rest.moduleId,
            currentWordIndex: core.currentWordIndex,
            wordsSmashed: core.wordsSmashed,
            currentStreak: 0,
            maxStreak: core.maxStreak,
            timeLeft: core.timeLeft,
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

    const completeSentence = useCallback((rangeIdx) => {
        if (completionGuardRef.current) return;
        const range = sentenceRanges[rangeIdx];
        if (!range) return;
        completionGuardRef.current = true;

        let correct = 0;
        for (let i = range.start; i < range.end; i++) {
            if (verdictsRef.current[i] === "correct") correct++;
        }
        const total = Math.max(1, range.end - range.start);
        const message = tierMessage(correct / total);

        // ponytail: sync the ref alongside state — core's COMPLETED effect
        // may persist before this commit's effects run, and the getter must
        // already include the final sentence.
        const newScores = [...sentenceScoresRef.current, correct];
        sentenceScoresRef.current = newScores;
        setSentenceScores(newScores);
        const missed = total - correct;
        const note = correct >= total
            ? "Flawless reading!"
            : CONSOLATION_POOL[Math.floor(Math.random() * CONSOLATION_POOL.length)](missed);
        setSentenceFeedback({ message, score: correct, total, note });

        if (rangeIdx + 1 >= sentenceRanges.length) {
            // Last sentence: verdicts visible 1000ms silent preview before
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
        } else {
            clearTimeout(previewTimerRef.current);
            previewTimerRef.current = setTimeout(() => {
                previewTimerRef.current = null;
                playFeedbackSound(message);
                pulseScored();
                // ponytail: move index only after VERDICT_PREVIEW_MS so the
                // next sentence's BLUE highlight stays hidden during review
                // (requirement: walang BLUE muna habang preview).
                core.moveToNextWord(Math.max(1, range.end - core.currentWordIndex));
                setSentenceBreak(true);
                clearTimeout(breakTimerRef.current);
                breakTimerRef.current = setTimeout(() => {
                    breakTimerRef.current = null;
                    completionGuardRef.current = false;
                    setSentenceBreak(false);
                    setSentenceFeedback(null);
                    // ponytail: pulse the next sentence's first word for ~1s as a
                    // "continue here" cue, then fall back to the static BLUE
                    // frontier. Same visual language as the fresh-mount start cue.
                    setBreakJustEnded(true);
                    clearTimeout(justEndedTimerRef.current);
                    justEndedTimerRef.current = setTimeout(() => setBreakJustEnded(false), 1000);
                    // ponytail: bump the epoch (Deepgram reset runs even when the
                    // next target normalizes equal) — the targetWord re-arm from
                    // the completion jump above follows as second guarantee. No
                    // index move here: already at the next sentence start. Debug
                    // line stays so manual repro confirms in DevTools.
                    setSentenceEpoch((e) => e + 1);
                    if (typeof window !== "undefined") {
                        console.debug("[SQ] sentence transition", {
                            fromRange: rangeIdx,
                            toIndex: range.end,
                            prevTarget: rest.words?.[range.end - 1]?.word,
                            nextTarget: rest.words?.[range.end]?.word,
                        });
                    }
                }, BREAK_MS);
            }, VERDICT_PREVIEW_MS);
        }
    }, [
        sentenceRanges,
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

        const range = sentenceRanges[sentenceScoresRef.current.length];
        const rangeEnd = range ? range.end : core.totalWords;
        // ponytail: clamp lookahead overshoot at the sentence boundary —
        // cross-sentence words re-evaluate after the break instead.
        const n = Math.max(1, Math.min(count | 0 || 1, Math.max(rangeEnd - idx, 1)));

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

        if (idx + n >= rangeEnd) {
            completeSentence(sentenceScoresRef.current.length);
        } else {
            core.moveToNextWord(n);
        }
    }, [
        sentenceBreak,
        sentenceRanges,
        completeSentence,
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

        const range = sentenceRanges[sentenceScoresRef.current.length];
        const rangeEnd = range ? range.end : core.totalWords;
        if (idx + 1 >= rangeEnd) {
            completeSentence(sentenceScoresRef.current.length);
        } else {
            core.moveToNextWord(1);
        }
    }, [
        sentenceBreak,
        sentenceRanges,
        completeSentence,
        pulseWrong,
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
        currentStreak: 0,
        maxStreak: 0,
        isMispronounced: isWrong,
        isExploding: false,
        showPointsFeedback: false,
        pointsFeedbackValue: 0,
        scoreEmphasize: justScored,
        feedbackType: sentenceFeedback ? "correct" : null,
        feedbackMessage: sentenceFeedback?.message ?? "",
        streakShake: null,
        handleTimeUp,
        handleFatalError,
        handleWordRecognized,
        handleMispronounce,
        // New sentence-level state.
        verdicts,
        sentenceScores,
        sentenceFeedback,
        sentenceBreak,
        sentenceEpoch,
        breakJustEnded,
    };
}
