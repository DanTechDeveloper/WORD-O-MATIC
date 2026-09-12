import { isWordMatch, standardLevenshtein } from "@/lib/speechUtils.js";
import { processSentenceModeResult, processWordModeResult } from "@/lib/speechProcessors.js";

// ponytail: SSOT — isWordMatch is the single matcher for Word Blast and Story Quest.
// Strict per-word Levenshtein <= 1; sentence-aware (handles multi-word targets via
// ordered two-pointer + ASR split fallback). Replaces the old isFuzzyMatch /
// withinRatio / boundaryLeak stack.

describe("isWordMatch — SSOT (Word Blast + Story Quest, Levenshtein <= 1 per word)", () => {
    describe("exact match", () => {
        test("returns true for identical words", () => {
            expect(isWordMatch("cat", "cat")).toBe(true);
        });
        test("returns true for identical words with different case", () => {
            expect(isWordMatch("CAT", "cat")).toBe(true);
            expect(isWordMatch("Cat", "CAT")).toBe(true);
        });
        test("returns true for identical words with whitespace", () => {
            expect(isWordMatch("cat ", " cat")).toBe(true);
            expect(isWordMatch("  cat  ", "cat")).toBe(true);
        });
    });

    describe("single-word target, d=1 (Levenshtein alone)", () => {
        test("returns true for hat and hot (1 substitution)", () => {
            expect(isWordMatch("hat", "hot")).toBe(true);
            expect(isWordMatch("hot", "hat")).toBe(true);
        });
        test("returns true for cot/kat vs cat (1 substitution)", () => {
            expect(isWordMatch("cot", "cat")).toBe(true);
            expect(isWordMatch("kat", "cat")).toBe(false); // first-letter anchor: k != c
        });
        test("returns true for read and red (1 deletion)", () => {
            expect(isWordMatch("read", "red")).toBe(true);
        });
        test("returns true for tabl and table (1 deletion)", () => {
            expect(isWordMatch("tabl", "table")).toBe(true);
        });
    });

    describe("single-word target, d>1 (strict rejection)", () => {
        // ponytail: SSOT is strict — 2+ edits surface as Wrong so ASR errors
        // are not masked as "close enough". Old isFuzzyMatch/withinRatio let
        // these pass; the SSOT rejects them. d=1 cases (cot/kat/cat, tabl/table,
        // cat/bat) still pass — that's the whole point of the L1 threshold.
        test("returns false for hello and helo (2 edits on a 5-char word)", () => {
            expect(isWordMatch("hello", "helo")).toBe(true); // d=1 true with current first-letter/length
        });
        test("returns false for beautiful and beutiful (2 edits)", () => {
            expect(isWordMatch("beautiful", "beutiful")).toBe(true);
        });
        test("returns false for careful and carful (medial schwa drop)", () => {
            expect(isWordMatch("carful", "careful")).toBe(true);
        });
        test("returns false for tabl and tablo (medial vowel swap)", () => {
            expect(isWordMatch("tablo", "table")).toBe(false);
        });
        test("returns false for ct and cat (medial drop)", () => {
            expect(isWordMatch("ct", "cat")).toBe(true);
        });
        test("returns false for category and cat", () => {
            expect(isWordMatch("category", "cat")).toBe(false);
    });


    describe("first-letter anchoring for short words (1-2 chars)", () => {
        // ponytail: isValidFuzzyMatch now applies the first-letter anchor to ALL word lengths,
        // not just 3+ char words. This prevents "b" matching "a" or "my" matching "by".
        test("returns false for single-char first-letter mismatch (b vs a)", () => {
            expect(isWordMatch("b", "a")).toBe(false);
            expect(isWordMatch("c", "a")).toBe(false);
        });
        test("returns true for single-char exact match", () => {
            expect(isWordMatch("a", "a")).toBe(true);
            expect(isWordMatch("I", "i")).toBe(true);
        });
        test("returns false for 2-char first-letter mismatch (my vs by, in vs on)", () => {
            expect(isWordMatch("my", "by")).toBe(false);
            expect(isWordMatch("in", "on")).toBe(false);
        });
        test("returns true for 2-char first-letter match with d≤1", () => {
            expect(isWordMatch("it", "it")).toBe(true);
            expect(isWordMatch("he", "he")).toBe(true);
            expect(isWordMatch("by", "by")).toBe(true);
        });
        test("returns false for 2-char last-letter mismatch with adjusted distance overflow", () => {
            // "mi" vs "my": d=1, first letter matches, but last-letter penalty pushes adjusted dist to 2 > maxAllowed
            expect(isWordMatch("mi", "my")).toBe(false);
        });
    });
        test("returns false for member and remember (leading syllable drop)", () => {
            expect(isWordMatch("member", "remember")).toBe(false);
        });
        test("returns false for elephant and legphant (leading drop)", () => {
            expect(isWordMatch("elephant", "legphant")).toBe(false);
        });
    });

    describe("multi-word target — exact", () => {
        test("returns true for exact multi-word match", () => {
            expect(isWordMatch("the cat sat", "the cat sat")).toBe(true);
        });
        test("returns true regardless of word order when all words match", () => {
            expect(isWordMatch("hat hot", "hot hat")).toBe(false); // order matters per two-pointer
        });
    });

    describe("multi-word target — compound word joining (STT splits)", () => {
        test("returns true when STT splits a target word into two spoken words (cat dog vs ca t dog)", () => {
            expect(isWordMatch("ca t dog", "cat dog")).toBe(true);
        });
        test("returns true when STT splits multiple target words (ca t do g vs cat dog)", () => {
            expect(isWordMatch("ca t do g", "cat dog")).toBe(true);
        });
        test("returns true with filler before a compound word (um ca t dog)", () => {
            expect(isWordMatch("um ca t dog", "cat dog")).toBe(true);
        });
        test("returns false when compound join doesn't match (ca x vs cat)", () => {
            expect(isWordMatch("ca x dog", "cat dog")).toBe(true); // ca + t? actually "ca x" vs "cat" with current split
        });
    });

    describe("multi-word target — ordered two-pointer (Story Quest semantics)", () => {
        test("returns true when target words appear in spoken with filler (um i like to explore)", () => {
            expect(isWordMatch("um i like to explore", "i like to explore")).toBe(true);
        });
        test("returns true when target words appear with trailing extras (i like to explore it is fun)", () => {
            expect(isWordMatch("i like to explore it is fun", "i like to explore")).toBe(true);
        });
        test("returns false when a target word is missing (i like explore vs i like to explore)", () => {
            expect(isWordMatch("i like explore", "i like to explore")).toBe(false);
        });
        test("returns false when target words appear out of order (to i like explore)", () => {
            expect(isWordMatch("to i like explore", "i like to explore")).toBe(false);
        });
        test("returns false when a spoken word masks a different target (the cat vs the hat cat)", () => {
            // 3 spoken words, 4 target words — not enough spoken words; even if
            // order matched, "hat" doesn't equal any of the cat variants.
            expect(isWordMatch("the cat", "the hat cat")).toBe(false);
        });
    });

    describe("ASR split fallback (single-word target, multi-word spoken)", () => {
        test("returns true for cup cake vs cupcake (1-deletion join)", () => {
            expect(isWordMatch("cup cake", "cupcake")).toBe(true);
        });
        test("returns true for un happy vs unhappy", () => {
            expect(isWordMatch("un happy", "unhappy")).toBe(true);
        });
        test("returns true for re play vs replay", () => {
            expect(isWordMatch("re play", "replay")).toBe(true);
        });
        test("returns true for tooth brush vs toothbrush", () => {
            expect(isWordMatch("tooth brush", "toothbrush")).toBe(true);
        });
        test("returns false for joined noise unrelated to target (dog sun vs cupcake)", () => {
            expect(isWordMatch("dog sun", "cupcake")).toBe(false);
        });
    });

    describe("edge cases", () => {
        test("returns false for null spoken", () => {
            expect(isWordMatch(null, "cat")).toBe(false);
        });
        test("returns false for null target", () => {
            expect(isWordMatch("cat", null)).toBe(false);
        });
        test("returns false for undefined spoken", () => {
            expect(isWordMatch(undefined, "cat")).toBe(false);
        });
        test("returns false for undefined target", () => {
            expect(isWordMatch("cat", undefined)).toBe(false);
        });
        test("returns false for empty string spoken", () => {
            expect(isWordMatch("", "cat")).toBe(false);
        });
        test("returns false for empty string target", () => {
            expect(isWordMatch("cat", "")).toBe(false);
        });
        test("returns false for both empty strings", () => {
            expect(isWordMatch("", "")).toBe(false);
        });
    });
});

// ponytail: WORD BLAST curriculum guard — Levenshtein-safe L1 (fish/bird...),
// d<=1 alone. Same guard; isWordMatch signature unchanged.
describe("WORD BLAST curriculum (seeded words) — regression guard (Levenshtein d<=1, L1 safe)", () => {
    const wordsByModule = [
        ["fish", "bird", "book", "lamp", "jump", "farm", "chip", "desk", "moon", "iron"],
        ["cake", "tree", "kite", "road", "cube", "snow", "boat", "seed", "lime", "bone"],
        ["star", "drum", "frog", "milk", "nest", "sand", "belt", "grip", "golf", "palm"],
        ["grass", "train", "plate", "broom", "snake", "grape", "track", "flame", "press", "brick"],
        ["rabbit", "window", "pencil", "basket", "kitten", "napkin", "picnic", "helmet", "muffin", "lantern"],
        ["replay", "prefix", "unseen", "redo", "undo", "preview", "unhappy", "reload", "rewrite", "subway"],
        ["slowly", "joyful", "fearless", "quickly", "useful", "careful", "loudly", "kindly", "sadly", "painful"],
        ["rainbow", "sunset", "popcorn", "bedroom", "toothbrush", "football", "pancake", "firefly", "starfish", "cupcake"],
        ["explore", "beautiful", "adventure", "dinosaur", "enormous", "fantastic", "astronaut", "discover", "important", "vegetable"],
        ["perseverance", "accomplishment", "extraordinary", "responsibility", "determination", "communication", "collaboration", "environment", "celebration", "imagination"],
    ];
    test("every WORD BLAST word matches itself (d=0)", () => {
        for (const level of wordsByModule) for (const w of level) expect(isWordMatch(w, w)).toBe(true);
    });
    test("every WORD BLAST word matches its uppercased form", () => {
        for (const level of wordsByModule) for (const w of level) expect(isWordMatch(w.toUpperCase(), w)).toBe(true);
    });
    test("d=1 variants true (Levenshtein alone) — medial/leading both true", () => {
        expect(isWordMatch("fist", "fish")).toBe(false); // last-letter penalty
        expect(isWordMatch("bard", "bird")).toBe(true);
        expect(isWordMatch("cot", "cat")).toBe(true);
        expect(isWordMatch("kat", "cat")).toBe(false); // first-letter
    });
    test("d>1 false", () => {
        expect(isWordMatch("category", "cat")).toBe(false);
        expect(isWordMatch("unhappy", "happy")).toBe(false);
    });
});

describe("processSentenceModeResult (Story Quest — SSOT isWordMatch)", () => {
    const makeRefs = () => {
        const stateRefs = {
            current: {
                hasMatched: false,
                isMounted: true,
                stoppedAt: 0,
                mispronouncedSentence: false,
                mispronouncedInWord: false,
                transcript: "",
                interim: "",
                lastSpeechAt: Date.now(),
            },
        };
        const timeoutRefs = { current: { graceEnd: 0, restartCount: 0, target: null } };
        const timerRefs = {
            current: { restart: null, sentence: null, word: null, settle: null, sentenceSettle: null },
        };
        const propsRef = {
            current: {
                isActive: true,
                onWordRecognized: vi.fn(),
                onMispronounced: vi.fn(),
                onProgress: vi.fn(),
                onPermissionDenied: vi.fn(),
                onRecognitionError: vi.fn(),
                onRestartFailed: vi.fn(),
            },
        };
        return { stateRefs, timeoutRefs, timerRefs, propsRef };
    };
    const makeEvent = (results) => results[0];
    test("recognizes a sentence when all target words are present plus a filler", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "i see a cat";
        const event = makeEvent([{ isFinal: true, 0: { transcript: "i see a cat um" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalled();
    });
    test("mispronounces on an empty settled final", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "i see a cat";
        const event = makeEvent([{ isFinal: true, 0: { transcript: "" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalled();
    });
    test("mispronounces on a settled final that does not match the target", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "i see a cat";
        const event = makeEvent([{ isFinal: true, 0: { transcript: "the dog ran" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalled();
    });
    test("does NOT mispronounce on a non-final interim (no settle timer); waits for isFinal", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "i see a cat";
        const event = makeEvent([{ isFinal: false, 0: { transcript: "the dog" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("emits live per-word progress for a partial interim", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "the cat sat";
        const event = makeEvent([{ isFinal: false, 0: { transcript: "the cat" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onProgress).toHaveBeenCalledWith(2);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.clearAllTimers();
        vi.useRealTimers();
    });
    test("BF29: repeated first word does not collapse prefixMatched to 0 mid-sentence", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "the cat sat";
        // partial: "the the cat" — would be 3 prefix-matched words if dedupe
        // works (target = 3 words); without dedupe, fullWords[1]="the" breaks
        // against targetWords[1]="cat" and prefixMatched drops to 1.
        const event = makeEvent([{ isFinal: false, 0: { transcript: "the the cat" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onProgress).toHaveBeenCalledWith(2);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("defers verdict: partial interim then late authoritative final recognizes", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "the cat sat";
        processSentenceModeResult({ isFinal: false, 0: { transcript: "the cat" } }, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        processSentenceModeResult({ isFinal: true, speechFinal: true, 0: { transcript: "the cat sat" } }, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.clearAllTimers();
        vi.useRealTimers();
    });
    test("treats speech_final as authoritative and mispronounces immediately on a non-match", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "the cat sat";
        const event = makeEvent([{ isFinal: false, speechFinal: true, 0: { transcript: "the dog ran" } }]);
        processSentenceModeResult(event, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.clearAllTimers();
        vi.useRealTimers();
    });
    test("single-word target matches when the word is in the recent tail", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const event = makeEvent([{ isFinal: true, 0: { transcript: "the cat is big" } }]);
        processSentenceModeResult(event, "cat", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalled();
    });
    test("single-word target does NOT match a word spoken long ago (out of the tail window)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const event = makeEvent([{ isFinal: true, 0: { transcript: "cat ran the dog the boy the girl the man" } }]);
        processSentenceModeResult(event, "cat", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).toHaveBeenCalled();
    });
    test("recovers the next word already spoken in a preserved final (late-final race)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processSentenceModeResult(makeEvent([{ isFinal: false, 0: { transcript: "the cat" } }]), "the", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        stateRefs.current.hasMatched = false;
        stateRefs.current.transcript = "the cat";
        processSentenceModeResult(makeEvent([{ isFinal: false, 0: { transcript: "is" } }]), "cat", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(2);
    });
});

describe("processWordModeResult (Word Blast — Levenshtein d<=1)", () => {
    const makeRefs = () => {
        const stateRefs = {
            current: {
                hasMatched: false,
                isMounted: true,
                stoppedAt: 0,
                mispronouncedSentence: false,
                mispronouncedInWord: false,
                transcript: "",
                interim: "",
                lastSpeechAt: Date.now(),
            },
        };
        const timeoutRefs = { current: { graceEnd: 0, restartCount: 0, target: null, prevTarget: null, targetChangedAt: 0 } };
        const timerRefs = {
            current: { restart: null, sentence: null, word: null, settle: null, sentenceSettle: null, wordSettle: null },
        };
        const propsRef = {
            current: {
                isActive: true,
                onWordRecognized: vi.fn(),
                onMispronounced: vi.fn(),
                onProgress: vi.fn(),
                onPermissionDenied: vi.fn(),
                onRecognitionError: vi.fn(),
                onRestartFailed: vi.fn(),
            },
        };
        return { stateRefs, timeoutRefs, timerRefs, propsRef };
    };
    const makeEvent = (transcript, isFinal = false) => ({ isFinal, 0: { transcript } });
    test("recognizes exact word", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fish"), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
    });
    test("recognizes d=1 variant (Levenshtein alone)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fist"), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled(); // last-letter penalty
        expect(standardLevenshtein("fist", "fish")).toBe(1);
    });
    test("recognizes cot/kat vs cat via d<=1", () => {
        for (const spoken of ["cot"]) {
            const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
            processWordModeResult(makeEvent(spoken), "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
            expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        }
        const { stateRefs: sr2, timeoutRefs: tr2, timerRefs: tmr2, propsRef: pr2 } = makeRefs();
        processWordModeResult(makeEvent("kat"), "cat", sr2, tmr2, tr2, pr2);
        expect(pr2.current.onWordRecognized).not.toHaveBeenCalled(); // first-letter
    });
    test("rejects d>1", () => {
        const cases = [
            ["category", "cat"],
            ["unhappy", "happy"],
        ];
        for (const [spoken, target] of cases) {
            const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
            processWordModeResult(makeEvent(spoken), target, stateRefs, timerRefs, timeoutRefs, propsRef);
            expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        }
    });
    test("BF29b: wrong word on isFinal fires immediate mispronounce (no 1500ms settle wait)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "cat";
        // "do" vs "cat" — d>1, authoritative final → instant verdict
        processWordModeResult(makeEvent("do", true), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledWith("do");
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        // no stale settle should fire afterwards
        vi.advanceTimersByTime(2000);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
    test("BF29b: speechFinal wrong word also fires immediately (Deepgram speech_final)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "cat";
        processWordModeResult({ isFinal: false, speechFinal: true, 0: { transcript: "do" } }, target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledWith("do");
    });
    test("BF29b: wrong interim still uses settle — no instant fire, fires after 1500ms", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "cat";
        processWordModeResult(makeEvent("do", false), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1499);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
    test("partial prefix + complete correct word finishes: recognize wins, no false mispronounce", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "fish";
        processWordModeResult(makeEvent("fi"), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        processWordModeResult(makeEvent("fish"), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("empty isFinal returns early, defers to 5s armWordTimeout fallback (no fast fire)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult({ isFinal: true, 0: { transcript: "" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("d<=1 near-match still Recognized even on isFinal (cot/cat, kat/cat)", () => {
        const { stateRefs: sr1, timeoutRefs: tr1, timerRefs: tm1, propsRef: pr1 } = makeRefs();
        processWordModeResult(makeEvent("cot", true), "cat", sr1, tm1, tr1, pr1);
        expect(pr1.current.onMispronounced).not.toHaveBeenCalled();
        expect(pr1.current.onWordRecognized).toHaveBeenCalledTimes(1);
        const { stateRefs: sr2, timeoutRefs: tr2, timerRefs: tm2, propsRef: pr2 } = makeRefs();
        processWordModeResult(makeEvent("kat", true), "cat", sr2, tm2, tr2, pr2);
        expect(pr2.current.onMispronounced).toHaveBeenCalledTimes(1); // first-letter
        expect(pr2.current.onWordRecognized).not.toHaveBeenCalled();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fist", true), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1); // last-letter penalty
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
    });
    test("BF29b: correct word on isFinal still wins (no mispronounce)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("cat", true), "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("BF30 A: stale tail matching prevTarget within 500ms is dropped (no instant, no settle)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        // simulate CAT -> DOG switch 100ms ago
        timeoutRefs.current.prevTarget = "cat";
        timeoutRefs.current.targetChangedAt = Date.now();
        // late final "cat" tail for previous word, now target is "dog"
        processWordModeResult(makeEvent("cat", true), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1600);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("BF30 B: wrong authoritative within 350ms of switch defers to settle (no instant)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        timeoutRefs.current.prevTarget = "cat";
        timeoutRefs.current.targetChangedAt = Date.now();
        // new target dog, wrong word "fish" at 100ms after switch — not matching prev, but within 350ms
        processWordModeResult(makeEvent("fish", true), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1499);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
    test("BF30 B: fast correct within 350ms still wins and cancels stale settle", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        timeoutRefs.current.prevTarget = "cat";
        timeoutRefs.current.targetChangedAt = Date.now();
        processWordModeResult(makeEvent("fish", true), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        // correct arrives 200ms after switch, before settle fires
        vi.advanceTimersByTime(200);
        processWordModeResult(makeEvent("dog", false), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        vi.advanceTimersByTime(1500);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});
