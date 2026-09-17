export function normalizeText(text) {
    return (text ?? "")
        .toLowerCase()
        .replace(/[^\w\s]/g, "")
        .trim();
}

/**
 * Strict Word Match Validator — exact-only by design.
 * normalize() muna (case/punct/whitespace), tapos === lang ang hukom:
 * ang Deepgram transcript ay dapat eksaktong maglaman ng target word.
 * Walang Levenshtein, walang edit tolerance, walang second chance —
 * hindi tugma = mali. Kung may salitang pumapalya nang hindi nararapat,
 * ang SALITA ang pinapalitan (CurriculumSeeder), hindi ang matcher.
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
    // o exact pinagdurugtong na magkatabing token ("ca t" -> "cat").
    if (wordsB.length === 1) {
        const singleTarget = wordsB[0];

        for (let i = 0; i < wordsA.length; i++) {
            if (wordsA[i] === singleTarget) return true;

            if (i < wordsA.length - 1) {
                if (wordsA[i] + wordsA[i + 1] === singleTarget) return true;
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

        // COMPOUND WORD STITCHING (exact): "ca t" -> "cat".
        if (i + 1 < wordsA.length) {
            if (wordsA[i] + wordsA[i + 1] === wordsB[j]) {
                j++;
                i += 2;
                continue;
            }
        }

        // FILLER/HESITATION: laktawan ang sinabing salita, panatilihin ang target pointer.
        i++;
    }

    return j === wordsB.length;
}
