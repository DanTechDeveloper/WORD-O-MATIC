export function standardLevenshtein(a, b) {
    const m = a.length,
        n = b.length;
    if (m === 0) return n;
    if (n === 0) return m;

    let prevRow = new Int32Array(n + 1);
    let currRow = new Int32Array(n + 1);

    for (let j = 0; j <= n; j++) prevRow[j] = j;

    for (let i = 1; i <= m; i++) {
        currRow[0] = i; // Establish bounds
        for (let j = 1; j <= n; j++) {
            const cost = a[i - 1] === b[j - 1] ? 0 : 1;
            const del = prevRow[j] + 1;
            const ins = currRow[j - 1] + 1;
            const sub = prevRow[j - 1] + cost;

            currRow[j] =
                del < ins ? (del < sub ? del : sub) : ins < sub ? ins : sub;
        }
        let temp = prevRow;
        prevRow = currRow;
        currRow = temp;
    }
    return prevRow[n];
}

export function normalizeText(text) {
    return (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

/**
 * Universal Word Match Validator
 * Angkop sa KAHIT ANONG SALITA (maikli man o mahaba)
 */
function isValidFuzzyMatch(spokenWord, targetWord) {
    if (spokenWord === targetWord) return true;

    const targetLen = targetWord.length;
    const spokenLen = spokenWord.length;

    // SHORT-CIRCUIT: Early exit bago mag-Levenshtein matrix computation.
    // 1. FIRST-LETTER ANCHOR: Kung mali ang unang tunog/letra, automatic fail (K-5 Decoding constraint).
    if (spokenWord.charAt(0) !== targetWord.charAt(0)) return false;
    // 2. LENGTH FILTER: Kung lampas sa 2 letrang haba ang agwat, hindi na matatantya ng fuzzy.
    if (Math.abs(targetLen - spokenLen) > 2) return false;

    const rawDist = standardLevenshtein(spokenWord, targetWord);
    const maxAllowedError = Math.min(
        2,
        Math.max(1, Math.floor(targetLen * 0.2)),
    );

    if (rawDist > maxAllowedError) return false;

    // LAST-LETTER PENALTY: Dagdag penalty (+1) kapag mali ang dulong letra.
    let adjustedDist = rawDist;
    if (spokenWord.charAt(spokenLen - 1) !== targetWord.charAt(targetLen - 1)) {
        adjustedDist += 1;
    }
    return adjustedDist <= maxAllowedError;
}

export function isWordMatch(spoken, target) {
    if (!spoken || !target) return false;

    const a = normalizeText(spoken);
    const b = normalizeText(target);

    if (a.length === 0 || b.length === 0) return false;
    if (a === b) return true;

    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);

    // Strategy 1: Single-Word Target processing sa sliding window check
    if (wordsB.length === 1) {
        const singleTarget = wordsB[0];

        for (let i = 0; i < wordsA.length; i++) {
            if (isValidFuzzyMatch(wordsA[i], singleTarget)) return true;

            if (i < wordsA.length - 1) {
                const combined = wordsA[i] + wordsA[i + 1];
                if (isValidFuzzyMatch(combined, singleTarget)) return true;
            }
        }
        return false;
    }

    // Strategy 2: Multi-Word Target gamit ang dynamic two-pointer evaluation
    // Kaya nitong lagpasan ang stutters/fillers at ipunin ang pinaghiwalay na salita.
    let j = 0;
    let i = 0;
    while (i < wordsA.length && j < wordsB.length) {
        const isExact = wordsA[i] === wordsB[j];
        const isFuzzy = !isExact && isValidFuzzyMatch(wordsA[i], wordsB[j]);

        if (isExact || isFuzzy) {
            // STUTTER GUARD: Kung fuzzy match ang kasalukuyan pero exact match ang
            // susunod na salita, lalaktawan ang fuzzy para hindi masayang ang target slot.
            if (
                isFuzzy &&
                i + 1 < wordsA.length &&
                wordsA[i + 1] === wordsB[j]
            ) {
                i++;
                continue;
            }
            j++;
            i++;
            continue;
        }

        // COMPOUND WORD STITCHING: Pinagsasama ang magkasunod na salita (Hal. "ca t" -> "cat")
        if (i + 1 < wordsA.length) {
            const combined = wordsA[i] + wordsA[i + 1];
            if (
                combined === wordsB[j] ||
                isValidFuzzyMatch(combined, wordsB[j])
            ) {
                j++;
                i += 2;
                continue;
            }
        }

        // FILLER/HESITATION: Laktawan ang sinabing salita, panatilihin ang target pointer.
        i++;
    }

    return j === wordsB.length;
}
