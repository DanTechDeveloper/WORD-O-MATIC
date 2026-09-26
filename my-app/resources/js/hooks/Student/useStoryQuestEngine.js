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
        if (typeof window === "undefined" || !rest.moduleId || core.gameState !== "ACTIVE") {
            return;
        }
        // ponytail: include savedAt so readResumeSession can correct drift; clamp timeLeft 0-60
        writeResumeSession(rest.moduleId, {
            moduleId: rest.moduleId,
            currentWordIndex: core.currentWordIndex,
            wordsSmashed: core.wordsSmashed,
            currentStreak: 0,
            maxStreak: core.maxStreak,
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

    const completeSentence = useCallback((rangeIdx) => {
        if (completionGuardRef.current) return;
        const range = sentenceRanges[rangeIdx];
        if (!range) return;
        // ponytail: straight-through — only the FINAL range completes here.
        // Mid ranges never stop (callers moveToNextWord instead), so the kid
        // reads the whole paragraph in one go.
        if (rangeIdx + 1 < sentenceRanges.length) return;
        completionGuardRef.current = true;

        // ponytail: end-computed scores — count correct verdicts per range so
        // sentence_scores stays intact for badges/results (sum == smashed).
        // Sync the ref alongside state (see persistExtra comment above).
        const allScores = sentenceRanges.map((r) => {
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

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + n >= core.totalWords) {
            let rangeIdx = sentenceRanges.findIndex((r) => idx < r.end);
            if (rangeIdx < 0) rangeIdx = sentenceRanges.length - 1;
            completeSentence(rangeIdx);
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
        if (correct > 0) core.addScore(correct);
        if (wrong > 0) pulseWrong();

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + applied.length >= core.totalWords) {
            let rangeIdx = sentenceRanges.findIndex((r) => idx < r.end);
            if (rangeIdx < 0) rangeIdx = sentenceRanges.length - 1;
            completeSentence(rangeIdx);
        } else {
            core.moveToNextWord(applied.length);
        }
    }, [
        sentenceBreak,
        sentenceRanges,
        completeSentence,
        pulseWrong,
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

        // ponytail: straight-through — only the final word completes the
        // round; mid-sentence ends just advance.
        if (idx + 1 >= core.totalWords) {
            let rangeIdx = sentenceRanges.findIndex((r) => idx < r.end);
            if (rangeIdx < 0) rangeIdx = sentenceRanges.length - 1;
            completeSentence(rangeIdx);
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
        handleSentenceVerdict,
        // New sentence-level state.
        verdicts,
        sentenceScores,
        sentenceFeedback,
        sentenceBreak,
    };
}
