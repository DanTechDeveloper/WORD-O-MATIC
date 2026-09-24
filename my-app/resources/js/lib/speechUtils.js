export function normalizeText(text) {
    return (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

// ponytail: stitch cap — exact join max 3 tokens (covers real STT splits:
// "ca t", "b a t", "air plane"). Letter-spelling ("f r o g") never comes
// out of the acoustic model, so no cap for it (YAGNI).
const MAX_STITCH = 3;

/**
 * Strict Word Match Validator — exact-only by design.
 * normalize() muna (case/punct/whitespace), tapos === lang ang hukom:
 * ang Deepgram transcript ay dapat eksaktong maglaman ng target word.
 * Walang Levenshtein, walang edit tolerance, walang second chance —
 * hindi tugma = mali. Kung may salitang pumapalya nang hindi nararapat,
 * ang SALITA ang pinapalitan (CurriculumSeeder), hindi ang matcher.
 *
 * Stitch ceiling: exact join max 3 tokens both directions (spoken-split
 * "b a t" -> "bat", spoken-joined inverse "cupcake" -> "cup cake").
 * Joins longer than the target break early (can never match); filler
 * skip unbounded by design (turn-taking).
 */
export function isWordMatch(spoken, target) {
    if (!spoken || !target) return false;

    const a = normalizeText(spoken);
    const b = normalizeText(target);

    if (a.length === 0 || b.length === 0) return false;
    if (a === b) return true;

    const wordsA = a.split(/\s+/);
    const wordsB = b.split(/\s+/);

    // Strategy 1: Single-Word Target — exact token sa sliding window,
    // o exact pinagdurugtong na magkatabing token ("ca t" -> "cat",
    // "b a t" -> "bat"). Length early-break: joined na mas mahaba sa
    // target, hindi na pwedeng mag-match.
    if (wordsB.length === 1) {
        const singleTarget = wordsB[0];

        for (let i = 0; i < wordsA.length; i++) {
            if (wordsA[i] === singleTarget) return true;

            let joined = "";
            for (let k = 1; k <= MAX_STITCH && i + k - 1 < wordsA.length; k++) {
                joined += wordsA[i + k - 1];
                if (joined.length > singleTarget.length) break;
                if (k >= 2 && joined === singleTarget) return true;
            }
        }
        return false;
    }

    // Strategy 2: Multi-Word Target — exact two-pointer. Hindi ito leniency
    // kundi turn-taking mechanics: nilalaktawan ang fillers/stutters ("um"),
    // pero bawat target slot ay eksaktong salita lang ang tatanggapin.
    let j = 0;
    let i = 0;
    while (i < wordsA.length && j < wordsB.length) {
        if (wordsA[i] === wordsB[j]) {
            j++;
            i++;
            continue;
        }

        // COMPOUND WORD STITCHING (exact, cap 3): "ca t" -> "cat".
        let stitched = false;
        let joined = "";
        for (let k = 1; k <= MAX_STITCH && i + k - 1 < wordsA.length; k++) {
            joined += wordsA[i + k - 1];
            if (joined.length > wordsB[j].length) break;
            if (k >= 2 && joined === wordsB[j]) {
                j++;
                i += k;
                stitched = true;
                break;
            }
        }
        if (stitched) continue;

        // INVERSE (exact, cap 3): spoken-joined vs target-split
        // ("cupcake" -> "cup cake").
        let inverse = false;
        let targetJoined = "";
        for (let k = 1; k <= MAX_STITCH && j + k - 1 < wordsB.length; k++) {
            targetJoined += wordsB[j + k - 1];
            if (targetJoined.length > wordsA[i].length) break;
            if (k >= 2 && wordsA[i] === targetJoined) {
                j += k;
                i++;
                inverse = true;
                break;
            }
        }
        if (inverse) continue;

        // FILLER/HESITATION: laktawan ang sinabing salita, panatilihin ang target pointer.
        i++;
    }

    return j === wordsB.length;
}
