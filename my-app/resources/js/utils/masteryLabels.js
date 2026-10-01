// Mastery attempt display helpers, shared so the label logic is unit-testable
// (see tests/Unit/masteryLabels.test.js) and the teacher page + parent email
// always agree. Mirrors ReportService::NEEDS_ATTENTION_ATTEMPTS.
import { normalizeText } from "@/lib/speechUtils";

export const NEEDS_ATTENTION_ATTEMPTS = 3;

// The five states every report surface renders. The PHP twin is
// ReportService::verdict() — a change in one is a change in both, because the
// email, the Excel Verdict column and this page must never answer "is this word
// a problem?" differently.
export const VERDICT = {
    NOT_ATTEMPTED: "notAttempted",
    NEEDS_ATTENTION: "needsAttention",
    PRACTICING: "practicing",
    RECOVERED: "recovered",
    MASTERED: "mastered",
};

export function verdict(mastery, failed, threshold = NEEDS_ATTENTION_ATTEMPTS) {
    const attempts = Number(failed || 0);

    if (mastery === "unseen") return VERDICT.NOT_ATTEMPTED;
    if (mastery === "mastered") {
        // The floor is the SAME as needsAttention, not 1. A word cannot recover
        // from something that never hurt it. Keeping the two floors equal also
        // means a word flagged needsAttention at exactly the threshold still
        // earns an acknowledgment when conquered.
        return attempts >= threshold ? VERDICT.RECOVERED : VERDICT.MASTERED;
    }

    return attempts >= threshold ? VERDICT.NEEDS_ATTENTION : VERDICT.PRACTICING;
}

// Label + color per verdict, so the JSX stops hand-writing text-red-500 /
// text-emerald-400 at three separate call sites.
//
// THE RULE: `cls` is the same shade as that verdict's chip BORDER in
// VERDICT_STYLE below — red-500 for needs attention, emerald-400 for recovered,
// accent for mastered, orange-400 for practicing. The sentence text paints a
// word's border and the drill list prints its status, so a word wears the same
// hue in both places; a mismatch makes the two look like different verdicts.
// `quiet` marks the states that are context, not a problem.
export const VERDICT_META = {
    [VERDICT.NOT_ATTEMPTED]: { label: "Not Yet Mastered", cls: "text-on-surface-variant", quiet: true },
    [VERDICT.NEEDS_ATTENTION]: { label: "Needs Attention", cls: "text-red-500", quiet: false },
    // Not muted: the drill list labels EVERY word, and a word sitting below the
    // threshold next to a hard word is exactly what the teacher needs to see.
    // Practicing is orange, matching its own chip border — grey here read as
    // "no verdict at all" rather than "still going".
    [VERDICT.PRACTICING]: { label: "Practicing", cls: "text-orange-400", quiet: true },
    [VERDICT.RECOVERED]: { label: "Recovered", cls: "text-emerald-400", quiet: false },
    // accent (lime), same rule: emerald is Recovered, and a word conquered
    // without ever struggling must not look like one that was rescued.
    [VERDICT.MASTERED]: { label: "Mastered", cls: "text-accent", quiet: true },
};

// Per-verdict styling, so a word that took 4 tries cannot look like one that
// took 1. `practicing` gets its own amber: before this the sentence text painted
// every failing word the same red, so a single slip and a six-try wall were
// indistinguishable without opening the drill list. Kept here rather than in the
// JSX so the inline chip and the drill-list dot can never disagree.
export const VERDICT_STYLE = {
    [VERDICT.NEEDS_ATTENTION]: {
        dot: "bg-red-500 shadow-[0_0_6px_#ef4444]",
        chip: "border-red-500/70 text-red-300 bg-red-500/10",
    },
    [VERDICT.PRACTICING]: {
        dot: "bg-orange-400 shadow-[0_0_6px_#fb923c]",
        chip: "border-orange-400/70 text-orange-300 bg-orange-400/10",
    },
    [VERDICT.RECOVERED]: {
        dot: "bg-emerald-400 shadow-[0_0_6px_#34d399]",
        chip: "border-emerald-400/70 text-emerald-300 bg-emerald-400/10",
    },
    // accent (lime) for mastered, not emerald — emerald is Recovered, and the
    // two must not look alike now that both render on Word Blast.
    [VERDICT.MASTERED]: {
        dot: "bg-accent shadow-[0_0_6px_#4ade80]",
        chip: "border-accent/70 text-accent bg-accent/10",
    },
    // No chip: an untouched word is just the sentence / a plain row, so a border
    // would imply a state that does not exist.
    [VERDICT.NOT_ATTEMPTED]: {
        dot: "bg-surface-container-high",
        chip: "",
    },
};

// The sentence verdict, derived from its WORDS — never from the summed
// failed_attempts. A 5-word sentence at one miss each sums to 5 and would clear
// the threshold while every single word is fine; that false positive is what the
// word-level view exists to remove. Mirrors ReportService::sentenceVerdictFrom().
export function sentenceVerdict(words, threshold = NEEDS_ATTENTION_ATTEMPTS) {
    const verdicts = (words || []).map((w) => verdict(w.mastery, w.failed_attempts, threshold));

    if (verdicts.includes(VERDICT.NEEDS_ATTENTION)) return VERDICT.NEEDS_ATTENTION;
    if (verdicts.includes(VERDICT.RECOVERED)) return VERDICT.RECOVERED;
    if (verdicts.includes(VERDICT.PRACTICING)) return VERDICT.PRACTICING;
    // A word never attempted keeps its sentence from being mastered. This branch
    // is what stops a brand-new student rendering every untouched sentence as
    // "Mastered — conquered on the first try", which is what happened when the
    // verdict fell straight through to MASTERED.
    //
    // …and the same holds for NO words at all: includes() needs an element to
    // find, so an empty word list missed every branch above and reported a
    // conquest that never happened.
    if (verdicts.length === 0 || verdicts.includes(VERDICT.NOT_ATTEMPTED)) {
        return VERDICT.NOT_ATTEMPTED;
    }

    return VERDICT.MASTERED;
}

// Merge duplicate texts inside one sentence: sum the attempts, keep the WORST
// mastery ('training' beats 'mastered' — a word is only recovered when every
// occurrence was conquered, the same all-or-nothing rule the sentence uses).
//
// Story Quest content is free prose, so the same word legitimately appears at
// several positions in one module ("A crab can swim." / "A fox naps."). Without
// this, keying by raw text is last-write-wins and the drill list undercounts the
// most common words in the curriculum. normalizeText is the ASR's own folder,
// reused rather than reinvented — the report and isWordMatch have to agree on
// what "the same word" means or the counts won't line up.
export function mergeSentenceWords(words, threshold = NEEDS_ATTENTION_ATTEMPTS) {
    const merged = new Map();

    for (const w of words || []) {
        const key = normalizeText(w.word);
        if (!key) continue;

        const mastery = w.mastery || "unseen";
        const failed = Number(w.failed_attempts || 0);
        const existing = merged.get(key);

        if (!existing) {
            merged.set(key, { word: w.word, mastery, failed_attempts: failed });
            continue;
        }

        existing.failed_attempts += failed;
        if (mastery !== "mastered") existing.mastery = mastery;
    }

    return [...merged.values()].map((w) => ({ ...w, verdict: verdict(w.mastery, w.failed_attempts, threshold) }));
}

// ── Bucketing (moved out of StudentDetails.jsx so it is testable) ──
//
// Story Quest groups the sentences by verdict. Titles come from VERDICT_META,
// never a literal, so a group heading cannot drift from the label printed beside
// the words. Word Blast does NOT group — it keeps the two Mastery / Training
// columns and splits on the `mastery` column alone.

// All five, because every sentence belongs to one and none of them is dead
// space: the panel drops EMPTY headings at the call site, which is what actually
// fixed the new-student "empty panel" read. An earlier cut to three buckets
// also removed a "Practising sentence is in NO group" lock — that lock was
// guarding against the very regression it could not see: a seeded student whose
// sentences are uniformly mastered had every sentence bucketed nowhere, so whole
// levels rendered nothing at all. Five buckets + a visibility filter is the fix;
// cutting buckets was never needed.
const SENTENCE_BUCKETS = [
    VERDICT.NEEDS_ATTENTION,
    VERDICT.PRACTICING,
    VERDICT.RECOVERED,
    VERDICT.NOT_ATTEMPTED,
    VERDICT.MASTERED,
];

// The GROUP HEADING is a claim about a SENTENCE; VERDICT_META[].label is a claim
// about a WORD. They were the same string, and "Recovered" is right for one and
// wrong for the other.
//
// The recovered floor EQUALS the attention floor (see verdict() above), so a
// recovered sentence is by construction one the child ALREADY conquered, and the
// number under it is a frozen peak: StudentController stops incrementing
// failed_attempts the moment a word is mastered, so re-reading it cleanly twenty
// more times changes nothing and the bucket can never empty. "Recovered" as a
// heading read as present tense and invited the opposite conclusion — that these
// sentences need work now.
//
// The parent email has said it correctly all along: "Recently Conquered" for the
// section, "Recovered" for each word inside it. The page now matches, and the
// per-word label is deliberately left alone — a drill row reading
// "mail Recorded: 4 · Recently Conquered" would be making a sentence's claim
// about a single word.
const GROUP_TITLES = {
    [VERDICT.RECOVERED]: "Recently Conquered",
};

// Rendered once under the group heading, and only where the heading alone is
// ambiguous. Same reason as the title: the number is history, and "history" is
// the part a teacher needs to be told rather than infer.
const GROUP_HINTS = {
    [VERDICT.RECOVERED]:
        "Hard words, already conquered. This is history, not current work — the student is no longer holding these sentences back.",
};

function bucketize(keys, fill) {
    const rows = Object.fromEntries(keys.map((k) => [k, []]));
    const counts = Object.fromEntries(Object.values(VERDICT).map((k) => [k, 0]));

    fill(rows, counts);


    // All buckets are returned, including empty ones, so a section can render a
    // stable column layout; the caller decides whether to show an empty group.
    // Title and hint come from the maps above, never a literal at the call site —
    // a literal there is how the heading and the inline label drifted apart.
    return {
        groups: keys.map((key) => ({
            key,
            title: GROUP_TITLES[key] ?? VERDICT_META[key].label,
            hint: GROUP_HINTS[key],
            rows: rows[key],
        })),
        counts,
    };
}

// Story Quest: every sentence renders, and each names its own module — grouping
// by verdict scatters a module's sentences across groups.
export function groupSentences(curriculum, threshold = NEEDS_ATTENTION_ATTEMPTS) {
    return bucketize(SENTENCE_BUCKETS, (rows, counts) => {
        for (const level of curriculum || []) {
            for (const stat of level.sentence_stats || []) {
                const key = sentenceVerdict(stat.words || [], threshold);
                counts[key]++;
                rows[key].push({ ...stat, level: level.level });
            }
        }
    });
}

// There is deliberately NO "attempts" helper, and there was one until 2026-10-01.
//
// It used to return `mastered ? failed + 1 : failed` — the "+1" being a mastered
// word's own winning try. It was wrong twice over:
//
//   1. It is not a try count. The 5s-silence watchdog increments failed_attempts
//      on pure silence, so a word the child stalled on and never attempted already
//      carries a "failure" that was no pronunciation attempt. Adding 1 to that
//      reports tries that never happened.
//   2. It desynchronised the page from the parent email and the Excel, which both
//      print failed_attempts raw. A recovered word read "4 recorded attempts to
//      conquer" in the email and "Attempts: 5" on the teacher page — the parent
//      and the teacher quoting different numbers for the same word.
//
// The tombstone is kept because the reasoning is easy to re-derive wrongly: the
// Word Blast chip and the Story Quest drill row once disagreed (5 vs 4) and the
// tempting fix is to add the +1 to Story Quest. That fixes one pair and breaks
// the email. ONE number, ONE convention, no arithmetic. Locked by
// VerdictTest::test_neither_language_adds_arithmetic_to_the_displayed_attempt_number().

// Only surface the flag when it fires (>= threshold) — "Normal" is noise on a
// chip. Resolution-cap rule: struggle flags expire once the word is mastered.
// Kept as the ONLY place a mastered word is labelled: below the threshold a
// mastered word is just a mastered word, with no "Recovered" badge for a slip
// that was never a problem.
export function attentionMeta(stat, threshold) {
    if (Number(stat.failed_attempts || 0) < threshold) return null;
    return stat.mastery === "mastered"
        ? { label: VERDICT_META[VERDICT.RECOVERED].label, cls: VERDICT_META[VERDICT.RECOVERED].cls }
        : { label: VERDICT_META[VERDICT.NEEDS_ATTENTION].label, cls: VERDICT_META[VERDICT.NEEDS_ATTENTION].cls };
}
