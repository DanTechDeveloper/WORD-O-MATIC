export function standardLevenshtein(a, b) {
    const m = a.length, n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;
    const dp = new Int32Array((m + 1) * (n + 1));
    const w = n + 1;
    for (let i = 0; i <= m; i++) dp[i * w] = i;
    for (let j = 0; j <= n; j++) dp[j] = j;
    for (let i = 1; i <= m; i++) {
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const del = dp[(i - 1) * w + j] + 1;
            const ins = dp[i * w + (j - 1)] + 1;
            const sub = dp[(i - 1) * w + (j - 1)] + cost;
            dp[i * w + j] = del < ins ? (del < sub ? del : sub) : (ins < sub ? ins : sub);
        }
    }
    return dp[m * w + n];
}

// ponytail: Story Quest helpers — withinRatio + boundaryLeak only for isFuzzyMatch (Story Quest).
// Word Blast stays Levenshtein alone (isWordMatch d<=1) with L1 safe words in CurriculumSeeder.
function withinRatio(a, b) {
    const d = standardLevenshtein(a, b);
    return d / Math.max(a.length, b.length) <= 0.34;
}

function boundaryLeak(a, b) {
    if (Math.max(a.length, b.length) < 3) return false;
    if (a[0] !== b[0]) return true;
    const longer = a.length >= b.length ? a : b;
    const shorter = a.length >= b.length ? b : a;
    return longer.length > shorter.length && (longer.endsWith(shorter) || longer.startsWith(shorter));
}

export function normalizeText(text) {
    return (text ?? "").toLowerCase().replace(/[^\w\s]/g, "").trim();
}

// ponytail: Word Blast — Levenshtein alone (d <= 1). If a hardcoded word is not pabor, replace word in CurriculumSeeder.
export function isWordMatch(spoken, target) {
    if (!spoken || !target) return false;
    const a = normalizeText(spoken);
    const b = normalizeText(target);
    if (a.length === 0 || b.length === 0) return false;
    if (a === b) return true;
    return standardLevenshtein(a, b) <= 1;
}

export function isFuzzyMatch(spoken, target) {
    if (!spoken || !target) return false;
    const a = normalizeText(spoken);
    const b = normalizeText(target);
    if (a === b) return true;
    if (a.length === 0 || b.length === 0) return false;

    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);

    if (wordsA.length === wordsB.length) {
        return wordsA.every((word, i) => {
            if (word === wordsB[i]) return true;
            if (boundaryLeak(word, wordsB[i])) return false;
            return withinRatio(word, wordsB[i]);
        });
    }

    // ponytail: ASR split fallback — Deepgram may split cupcake -> cup cake; join and check with ratio+leak
    if (wordsB.length === 1 && wordsA.length > 1) {
        const joined = wordsA.join("");
        if (!boundaryLeak(joined, b) && withinRatio(joined, b)) return true;
    }

    // ponytail: ordered two-pointer — spoken must contain target words in order
    let j = 0;
    for (let i = 0; i < wordsA.length && j < wordsB.length; i++) {
        if (wordsA[i] === wordsB[j]) {
            j++;
            continue;
        }
        if (boundaryLeak(wordsA[i], wordsB[j])) continue;
        if (withinRatio(wordsA[i], wordsB[j])) j++;
    }
    return j === wordsB.length;
}
