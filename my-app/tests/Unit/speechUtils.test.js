import { isFuzzyMatch, isWordMatch, standardLevenshtein } from "@/lib/speechUtils.js";
import { processSentenceModeResult, processWordModeResult } from "@/lib/speechProcessors.js";

// Story Quest = isFuzzyMatch with withinRatio + boundaryLeak
// Word Blast = isWordMatch with standardLevenshtein d<=1 (L1 fish/bird... Levenshtein-safe)

describe("isFuzzyMatch — Story Quest (withinRatio + boundaryLeak)", () => {
    describe("exact match", () => {
        test("returns true for identical words", () => {
            expect(isFuzzyMatch("cat", "cat")).toBe(true);
        });
        test("returns true for identical words with different case", () => {
            expect(isFuzzyMatch("CAT", "cat")).toBe(true);
            expect(isFuzzyMatch("Cat", "CAT")).toBe(true);
        });
        test("returns true for identical words with whitespace", () => {
            expect(isFuzzyMatch("cat ", " cat")).toBe(true);
            expect(isFuzzyMatch("  cat  ", "cat")).toBe(true);
        });
    });

    describe("short words (<=5 chars, 1 edit tolerance)", () => {
        test("returns true for hat and hot (1 substitution)", () => {
            expect(isFuzzyMatch("hat", "hot")).toBe(true);
            expect(isFuzzyMatch("hot", "hat")).toBe(true);
        });
        test("returns false for cat and bat (leading substitution — boundaryLeak)", () => {
            expect(isFuzzyMatch("cat", "bat")).toBe(false);
        });
        test("returns true for read and red (1 deletion)", () => {
            expect(isFuzzyMatch("read", "red")).toBe(true);
        });
        test("returns true for sit and sit (exact match)", () => {
            expect(isFuzzyMatch("sit", "sit")).toBe(true);
        });
        test("returns false for cat and dog (3 edits)", () => {
            expect(isFuzzyMatch("cat", "dog")).toBe(false);
        });
        test("returns false for cat and hen (2 substitutions)", () => {
            expect(isFuzzyMatch("cat", "hen")).toBe(false);
        });
    });

    describe("medium words (6-8 chars, 2 edit tolerance)", () => {
        test("returns true for hello and helo (2 edits)", () => {
            expect(isFuzzyMatch("hello", "helo")).toBe(true);
        });
        test("returns true for world and word (1 substitution + 1 deletion)", () => {
            expect(isFuzzyMatch("world", "word")).toBe(true);
        });
        test("returns true for testing and testing (typo)", () => {
            expect(isFuzzyMatch("testing", "teting")).toBe(true);
        });
    });

    describe("long words (>8 chars, 3 edit tolerance)", () => {
        test("returns false for elephant and legphant (leading drop — leak)", () => {
            expect(isFuzzyMatch("elephant", "legphant")).toBe(false);
        });
        test("returns true for beautiful and beutiful (2 edits)", () => {
            expect(isFuzzyMatch("beautiful", "beutiful")).toBe(true);
        });
    });

    describe("boundary leaks (leading/trailing drops and leading substitutions)", () => {
        test("returns false for areful and careful (leading drop)", () => {
            expect(isFuzzyMatch("areful", "careful")).toBe(false);
        });
        test("returns false for fareful and careful (leading substitution)", () => {
            expect(isFuzzyMatch("fareful", "careful")).toBe(false);
        });
        test("returns false for member and remember (leading syllable drop)", () => {
            expect(isFuzzyMatch("member", "remember")).toBe(false);
        });
        test("returns false for do and dog (trailing drop)", () => {
            expect(isFuzzyMatch("do", "dog")).toBe(false);
        });
        test("returns false for tabl and table (trailing drop)", () => {
            expect(isFuzzyMatch("tabl", "table")).toBe(false);
        });
        test("returns false for at and cat (leading consonant drop)", () => {
            expect(isFuzzyMatch("at", "cat")).toBe(false);
        });
        test("returns false regardless of argument order", () => {
            expect(isFuzzyMatch("careful", "areful")).toBe(false);
            expect(isFuzzyMatch("dog", "do")).toBe(false);
        });
    });

    describe("substitution tolerance preserved (ASR noise)", () => {
        test("returns true for tablo and table (end vowel substitution)", () => {
            expect(isFuzzyMatch("tablo", "table")).toBe(true);
        });
        test("returns true for carful and careful (medial schwa drop)", () => {
            expect(isFuzzyMatch("carful", "careful")).toBe(true);
        });
        test("returns true for ct and cat (medial drop)", () => {
            expect(isFuzzyMatch("ct", "cat")).toBe(true);
        });
        test("returns true for cot and cat (medial substitution)", () => {
            expect(isFuzzyMatch("cot", "cat")).toBe(true);
        });
        test("returns true for dig and dog (trailing substitution)", () => {
            expect(isFuzzyMatch("dig", "dog")).toBe(true);
        });
    });

    describe("multi-word matching (equal word count)", () => {
        test("returns true when all words match within tolerance", () => {
            expect(isFuzzyMatch("hat hot", "hot hat")).toBe(true);
        });
        test("returns false when one word is too different", () => {
            expect(isFuzzyMatch("cat dog", "bat hen")).toBe(false);
        });
        test("returns true for exact multi-word match", () => {
            expect(isFuzzyMatch("the cat sat", "the cat sat")).toBe(true);
        });
    });

    describe("multi-word matching (different word count)", () => {
        test("returns false when a spoken word only masks another (leading substitution)", () => {
            expect(isFuzzyMatch("the cat", "the hat cat")).toBe(false);
        });
        test("returns false when target word has no match", () => {
            expect(isFuzzyMatch("the cat", "the dog cat")).toBe(false);
        });
    });

    describe("ASR split fallback (single-word target, multi-word spoken)", () => {
        test("returns true for a compound split (cup cake vs cupcake)", () => {
            expect(isFuzzyMatch("cup cake", "cupcake")).toBe(true);
        });
        test("returns true for a prefix split (un happy vs unhappy)", () => {
            expect(isFuzzyMatch("un happy", "unhappy")).toBe(true);
        });
        test("returns true for a verb split (re play vs replay)", () => {
            expect(isFuzzyMatch("re play", "replay")).toBe(true);
        });
        test("returns true for an exact compound split (tooth brush vs toothbrush)", () => {
            expect(isFuzzyMatch("tooth brush", "toothbrush")).toBe(true);
        });
        test("returns false for joined noise that only masks the target (and do vs undo)", () => {
            expect(isFuzzyMatch("and do", "undo")).toBe(false);
        });
        test("returns false for random joined words unrelated to target (dog sun vs cupcake)", () => {
            expect(isFuzzyMatch("dog sun", "cupcake")).toBe(false);
        });
        test("returns false when the join produces a leading-swap leak (fun cake vs cupcake)", () => {
            expect(isFuzzyMatch("fun cake", "cupcake")).toBe(false);
        });
    });

    describe("edge cases", () => {
        test("returns false for null spoken", () => {
            expect(isFuzzyMatch(null, "cat")).toBe(false);
        });
        test("returns false for null target", () => {
            expect(isFuzzyMatch("cat", null)).toBe(false);
        });
        test("returns false for undefined spoken", () => {
            expect(isFuzzyMatch(undefined, "cat")).toBe(false);
        });
        test("returns false for undefined target", () => {
            expect(isFuzzyMatch("cat", undefined)).toBe(false);
        });
        test("returns false for empty string spoken", () => {
            expect(isFuzzyMatch("", "cat")).toBe(false);
        });
        test("returns false for empty string target", () => {
            expect(isFuzzyMatch("cat", "")).toBe(false);
        });
        test("returns false for both empty strings", () => {
            expect(isFuzzyMatch("", "")).toBe(false);
        });
    });
});

describe("isWordMatch (Word Blast — Levenshtein d<=1 alone, L1 safe words)", () => {
    describe("exact + d<=1", () => {
        test("identical true", () => {
            expect(isWordMatch("fish", "fish")).toBe(true);
        });
        test("case/punct normalized true", () => {
            expect(isWordMatch("FISH", "fish")).toBe(true);
            expect(isWordMatch("fish!", "fish")).toBe(true);
        });
        test("d=1 true (Levenshtein alone)", () => {
            expect(isWordMatch("fist", "fish")).toBe(true);
            expect(standardLevenshtein("fist", "fish")).toBe(1);
            expect(isWordMatch("cot", "cat")).toBe(true);
            expect(isWordMatch("kat", "cat")).toBe(true);
            expect(isWordMatch("tabl", "table")).toBe(true);
            expect(isWordMatch("bard", "bird")).toBe(true);
        });
        test("d>1 false", () => {
            expect(isWordMatch("category", "cat")).toBe(false);
            expect(isWordMatch("cat", "dog")).toBe(false);
            expect(isWordMatch("unhappy", "happy")).toBe(false);
        });
        test("cup cake vs cupcake d=1 true via Levenshtein alone", () => {
            expect(isWordMatch("cup cake", "cupcake")).toBe(true);
            expect(standardLevenshtein("cup cake", "cupcake")).toBe(1);
        });
    });
    describe("edge cases", () => {
        test("null/empty false", () => {
            expect(isWordMatch(null, "fish")).toBe(false);
            expect(isWordMatch("fish", null)).toBe(false);
            expect(isWordMatch("", "fish")).toBe(false);
            expect(isWordMatch("fish", "")).toBe(false);
            expect(isWordMatch("", "")).toBe(false);
        });
    });
});

// ponytail: WORD BLAST curriculum guard — Levenshtein-safe L1 (fish/bird...), d<=1 alone.
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
    test("d=1 variants true (Levenshtein alone) — medial/leading both true now", () => {
        expect(isWordMatch("fist", "fish")).toBe(true);
        expect(isWordMatch("bard", "bird")).toBe(true);
        expect(isWordMatch("cot", "cat")).toBe(true);
        expect(isWordMatch("kat", "cat")).toBe(true);
    });
    test("d>1 still false", () => {
        expect(isWordMatch("category", "cat")).toBe(false);
        expect(isWordMatch("unhappy", "happy")).toBe(false);
    });
});

describe("processSentenceModeResult (Story Quest — withinRatio + boundaryLeak)", () => {
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
        // no settle timer: 2s of silence must NOT mispronounce (only 5s watchdog would)
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
        // "cat" is the first word, far outside the last-4-word scope -> not the current word
        const event = makeEvent([{ isFinal: true, 0: { transcript: "cat ran the dog the boy the girl the man" } }]);
        processSentenceModeResult(event, "cat", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).toHaveBeenCalled();
    });
    test("recovers the next word already spoken in a preserved final (late-final race)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        // word 1 matches from an interim
        processSentenceModeResult(makeEvent([{ isFinal: false, 0: { transcript: "the cat" } }]), "the", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        // simulate the engine advancing to the next word; the late final stays in transcript
        stateRefs.current.hasMatched = false;
        stateRefs.current.transcript = "the cat";
        // continued speech; the already-spoken "cat" must now match from the kept transcript
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
        const timeoutRefs = { current: { graceEnd: 0, restartCount: 0, target: null } };
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
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(standardLevenshtein("fist", "fish")).toBe(1);
    });
    test("recognizes cot/kat vs cat via d<=1", () => {
        for (const spoken of ["cot", "kat"]) {
            const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
            processWordModeResult(makeEvent(spoken), "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
            expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        }
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
    test("random word salpak — cold→gold was d=1 but gold→iron now d=4 false", () => {
        expect(standardLevenshtein("cold", "gold")).toBe(1);
        expect(standardLevenshtein("cold", "iron")).toBe(4);
        // old gold replaced by iron — cold no longer salpak, demonstrates Plan A fix
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("cold"), "iron", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        // grip is new word, fist→fish was d=1 but fist→grip d=4
        expect(standardLevenshtein("fist", "grip")).toBe(4);
    });
    test("authoritative isFinal non-match → immediate mispronounce (no settle wait)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "fish";
        // Interim (non-final) wrong word: no immediate verdict
        processWordModeResult(makeEvent("dog"), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        // isFinal=true on a non-matching word → immediate mispronounce (authoritative)
        processWordModeResult(makeEvent("fur", true), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("partial prefix + complete correct word finishes: recognize wins, no false mispronounce", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "fish";
        // Let-down start (incomplete but correct-so-far)
        processWordModeResult(makeEvent("fi"), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        // Correct word arrives before the 850ms settle fires → recognized, settle cleared
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
        // transcript empty → if(!transcript) return; no wordSettle armed here, no fast mispronounce
        processWordModeResult({ isFinal: true, 0: { transcript: "" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("d<=1 near-match still Recognized even on isFinal (cot/cat, kat/cat)", () => {
        // isWordMatch d<=1 true → recognized, fast path does NOT mispronounce
        for (const spoken of ["cot", "kat"]) {
            const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
            processWordModeResult(makeEvent(spoken, true), "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
            expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
            expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        }
        // cot is not fish target though — use correct targets in separate asserts
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fist", true), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
    });
});
