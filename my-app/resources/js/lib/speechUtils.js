function standardLevenshtein(a, b) {
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

// Hybrid: strict for short words (don't accept a different short word like
// hat/hot), forgiving for longer ones (tolerate ASR noise). Symmetric via
// max length so matching doesn't depend on which side is spoken vs target.
function maxEdits(wordLength) {
    if (wordLength <= 5) return 0;
    if (wordLength <= 8) return 2;
    return 3;
}

export function isFuzzyMatch(spoken, target) {
    if (!spoken || !target) return false;
    const a = spoken.toLowerCase().trim();
    const b = target.toLowerCase().trim();
    if (a === b) return true;
    if (a.length === 0 || b.length === 0) return false;

    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);

    if (wordsA.length === wordsB.length) {
        return wordsA.every((word, i) => {
            if (word === wordsB[i]) return true;
            const limit = maxEdits(Math.max(word.length, wordsB[i].length));
            return standardLevenshtein(word, wordsB[i]) <= limit;
        });
    }

    return wordsB.every((targetWord) =>
        wordsA.some((spokenWord) => {
            if (spokenWord === targetWord) return true;
            const limit = maxEdits(Math.max(spokenWord.length, targetWord.length));
            if (Math.abs(spokenWord.length - targetWord.length) > limit) return false;
            return standardLevenshtein(spokenWord, targetWord) <= limit;
        }),
    );
}
