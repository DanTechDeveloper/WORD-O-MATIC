// Mastery attempt display helpers, shared so the label logic is unit-testable
// (see tests/Unit/masteryLabels.test.js) and the teacher page + parent email
// always agree. Mirrors ReportService::NEEDS_ATTENTION_ATTEMPTS.
export const NEEDS_ATTENTION_ATTEMPTS = 3;

// Mastered words count their final successful attempt; training words show
// unsuccessful attempts so far (counter is frozen once mastered).
export function attemptsShown(stat) {
    return stat.mastery === "mastered"
        ? stat.failed_attempts + 1
        : stat.failed_attempts;
}

// Only surface the flag when it fires (>= threshold) — "Normal" is noise on a
// chip. Resolution-cap rule: struggle flags expire once the word is mastered.
export function attentionMeta(stat, threshold) {
    if (stat.failed_attempts < threshold) return null;
    return stat.mastery === "mastered"
        ? { label: "Recovered", cls: "text-emerald-400" }
        : { label: "Needs Attention", cls: "text-red-500" };
}
