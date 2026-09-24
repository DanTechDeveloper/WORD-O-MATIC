import { isWordMatch } from "@/lib/speechUtils.js";
import { processSentenceModeResult, processWordModeResult } from "@/lib/speechProcessors.js";

// ponytail: SSOT — isWordMatch is the single matcher for Word Blast and Story Quest.
// STRICT exact-only: normalize() then ===. Any non-exact transcript is Wrong —
// no Levenshtein, no edit tolerance, no second chance. Structural mechanics stay
// (sliding window, exact pair-stitch, ordered two-pointer, filler skip).

describe("isWordMatch — SSOT strict exact-only (Word Blast + Story Quest)", () => {
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

    describe("single-word target — anything but exact is wrong", () => {
        test("returns false for 1-substitution pairs (hat/hot, cot/cat, kat/cat)", () => {
            expect(isWordMatch("hat", "hot")).toBe(false);
            expect(isWordMatch("hot", "hat")).toBe(false);
            expect(isWordMatch("cot", "cat")).toBe(false);
            expect(isWordMatch("kat", "cat")).toBe(false);
        });
        test("returns false for 1-deletion pairs (read/red, tabl/table)", () => {
            expect(isWordMatch("read", "red")).toBe(false);
            expect(isWordMatch("tabl", "table")).toBe(false);
        });
        test("returns false for near-miss pairs (hello/helo, beautiful/beutiful, carful/careful)", () => {
            expect(isWordMatch("hello", "helo")).toBe(false);
            expect(isWordMatch("beautiful", "beutiful")).toBe(false);
            expect(isWordMatch("carful", "careful")).toBe(false);
        });
        test("returns false for tablo/table, ct/cat, category/cat, member/remember, elephant/legphant", () => {
            expect(isWordMatch("tablo", "table")).toBe(false);
            expect(isWordMatch("ct", "cat")).toBe(false);
            expect(isWordMatch("category", "cat")).toBe(false);
            expect(isWordMatch("member", "remember")).toBe(false);
            expect(isWordMatch("elephant", "legphant")).toBe(false);
        });
    });

    describe("short words — exact only", () => {
        test("returns false for single-char mismatch (b/c vs a)", () => {
            expect(isWordMatch("b", "a")).toBe(false);
            expect(isWordMatch("c", "a")).toBe(false);
        });
        test("returns true for single-char exact match", () => {
            expect(isWordMatch("a", "a")).toBe(true);
            expect(isWordMatch("I", "i")).toBe(true);
        });
        test("returns false for 2-char mismatch (my vs by, in vs on, mi vs my)", () => {
            expect(isWordMatch("my", "by")).toBe(false);
            expect(isWordMatch("in", "on")).toBe(false);
            expect(isWordMatch("mi", "my")).toBe(false);
        });
        test("returns true for 2-char exact match", () => {
            expect(isWordMatch("it", "it")).toBe(true);
            expect(isWordMatch("he", "he")).toBe(true);
            expect(isWordMatch("by", "by")).toBe(true);
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
            expect(isWordMatch("ca x dog", "cat dog")).toBe(false);
        });
    });

    describe("N-token stitch (3-cap, exact-only)", () => {
        test("returns true when STT spells a target letter-by-letter (b a t vs bat)", () => {
            expect(isWordMatch("b a t", "bat")).toBe(true);
        });
        test("returns true for 3-token split inside a sentence (b a t naps vs bat naps)", () => {
            expect(isWordMatch("b a t naps", "bat naps")).toBe(true);
        });
        test("returns true for spoken-joined inverse (cupcake vs cup cake)", () => {
            expect(isWordMatch("cupcake", "cup cake")).toBe(true);
        });
        test("returns false when 3-token join doesn't match (c a x vs cat)", () => {
            expect(isWordMatch("c a x", "cat")).toBe(false);
        });
        test("returns false when 4-token join exceeds the cap (c a t s vs cats)", () => {
            expect(isWordMatch("c a t s", "cats")).toBe(false);
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

// ponytail: WORD BLAST curriculum guard — verdict-gated reseed (fox/quiz...),
// same guard shape; isWordMatch signature unchanged.
describe("WORD BLAST curriculum (seeded words) — regression guard (verdict-gated)", () => {
    const wordsByModule = [
        ["fox", "gum", "wag", "zip", "van", "yak", "jam", "kit", "log", "quiz"],
        ["peach", "cloud", "snail", "green", "light", "sheep", "queen", "toast", "paint", "globe"],
        ["brush", "clock", "smile", "plant", "crash", "dress", "frost", "twist", "thumb", "prince"],
        ["splash", "street", "stripe", "crane", "flute", "skate", "brave", "crown", "purse", "drift"],
        ["tiger", "river", "lemon", "pocket", "circus", "magnet", "violin", "tulip", "robot", "camel"],
        ["remake", "unlock", "repay", "unzip", "dislike", "distrust", "misplace", "misspell", "retell", "recycle"],
        ["thankful", "endless", "softly", "muddy", "wishful", "harmless", "neatly", "rusty", "sticky", "weekly"],
        ["airplane", "sailboat", "mailbox", "raincoat", "snowman", "bookshelf", "campground", "dragonfly", "wheelchair", "keyboard"],
        ["thunder", "journey", "whisper", "meadow", "clever", "beacon", "voyage", "harbor", "blanket", "canyon"],
        ["architecture", "temperature", "electricity", "expedition", "horizon", "fortress", "galaxy", "lagoon", "mosaic", "oasis"],
    ];
    test("every WORD BLAST word matches itself (d=0)", () => {
        for (const level of wordsByModule) for (const w of level) expect(isWordMatch(w, w)).toBe(true);
    });
    test("every WORD BLAST word matches its uppercased form", () => {
        for (const level of wordsByModule) for (const w of level) expect(isWordMatch(w.toUpperCase(), w)).toBe(true);
    });
    test("any non-exact variant is wrong (strict — no medial/last-letter mercy)", () => {
        expect(isWordMatch("quit", "quiz")).toBe(false);
        expect(isWordMatch("sheet", "sheep")).toBe(false);
        expect(isWordMatch("clack", "clock")).toBe(false);
        expect(isWordMatch("cot", "cat")).toBe(false);
        expect(isWordMatch("kat", "cat")).toBe(false);
    });
    test("d>1 false", () => {
        expect(isWordMatch("category", "cat")).toBe(false);
        expect(isWordMatch("misplace", "place")).toBe(false);
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
    test("partial authoritative final defers to watchdog instead of instant-failing", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "the cat sat";
        processSentenceModeResult({ isFinal: true, 0: { transcript: "the cat" } }, target, stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        // no further speech: the 5s silence watchdog owns the verdict
        vi.advanceTimersByTime(6000);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.clearAllTimers();
        vi.useRealTimers();
    });
    test("endpointed empty final with lookahead defers (pause, not wrong)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        propsRef.current.lookahead = "the cat sat";
        processSentenceModeResult({ isFinal: true, 0: { transcript: "" } }, "the", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("FIX low-confidence zero-match final defers with lookahead (noise, not wrong)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        propsRef.current.lookahead = "the cat sat";
        processSentenceModeResult({ isFinal: true, confidence: 0.25, 0: { transcript: "zebra" } }, "the", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("FIX low-confidence zero-match final defers without lookahead", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processSentenceModeResult({ isFinal: true, confidence: 0.25, 0: { transcript: "zebra" } }, "the cat sat", stateRefs, timeoutRefs, timerRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
});

describe("processWordModeResult (Word Blast — strict exact-only)", () => {
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
    test("near-miss variant is not recognized (strict: fist/fish is wrong)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fist"), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
    });
    test("near-miss cot/kat vs cat are wrong (strict)", () => {
        for (const spoken of ["cot", "kat"]) {
            const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
            processWordModeResult(makeEvent(spoken), "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
            expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
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
    test("BF29b: wrong interim still uses settle — no instant fire, fires after 1200ms", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        const target = "cat";
        processWordModeResult(makeEvent("do", false), target, stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1199);
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
    test("near-miss on isFinal mispronounces immediately (strict: no second chance)", () => {
        const { stateRefs: sr1, timeoutRefs: tr1, timerRefs: tm1, propsRef: pr1 } = makeRefs();
        processWordModeResult(makeEvent("cot", true), "cat", sr1, tm1, tr1, pr1);
        expect(pr1.current.onMispronounced).toHaveBeenCalledTimes(1);
        expect(pr1.current.onWordRecognized).not.toHaveBeenCalled();
        const { stateRefs: sr2, timeoutRefs: tr2, timerRefs: tm2, propsRef: pr2 } = makeRefs();
        processWordModeResult(makeEvent("kat", true), "cat", sr2, tm2, tr2, pr2);
        expect(pr2.current.onMispronounced).toHaveBeenCalledTimes(1);
        expect(pr2.current.onWordRecognized).not.toHaveBeenCalled();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult(makeEvent("fist", true), "fish", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
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
    test("BF30 B: wrong authoritative within 1000ms of switch defers to settle (no instant)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        timeoutRefs.current.prevTarget = "cat";
        timeoutRefs.current.targetChangedAt = Date.now();
        // 800ms per-word grace fully ignores verdicts; arrive at +900ms —
        // past grace but inside the 1000ms B guard, so no instant, settle arms.
        vi.advanceTimersByTime(900);
        // new target dog, wrong word "fish" at 900ms after switch
        processWordModeResult(makeEvent("fish", true), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1199);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(1);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
    test("BF30 B2: wrong speech inside the 800ms grace is ignored entirely (no settle)", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        timeoutRefs.current.prevTarget = "cat";
        timeoutRefs.current.targetChangedAt = Date.now();
        timeoutRefs.current.graceEnd = Date.now() + 800;
        // mic transient / noise interim at +100ms after switch — dropped, and
        // no settle is armed, so nothing fires even after the settle window.
        processWordModeResult(makeEvent("fish", true), "dog", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
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
        vi.advanceTimersByTime(700);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("low-confidence correct interim still accepts (no confidence gate on accepts)", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        processWordModeResult({ isFinal: false, confidence: 0.4, 0: { transcript: "cat" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("grace drops Wrong verdicts but a fast correct still wins", () => {
        vi.useFakeTimers();
        const g1 = makeRefs();
        g1.timeoutRefs.current.graceEnd = Date.now() + 10000;
        processWordModeResult(makeEvent("dog", false), "dog", g1.stateRefs, g1.timerRefs, g1.timeoutRefs, g1.propsRef);
        expect(g1.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        const g2 = makeRefs();
        g2.timeoutRefs.current.graceEnd = Date.now() + 10000;
        processWordModeResult(makeEvent("fish", true), "dog", g2.stateRefs, g2.timerRefs, g2.timeoutRefs, g2.propsRef);
        expect(g2.propsRef.current.onMispronounced).not.toHaveBeenCalled();
        expect(g2.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(g2.propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("FIX silence-safe: low-confidence noise interim never settles to Wrong", () => {
        vi.useFakeTimers();
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        // background noise / mic transient hallucinated as "the" at low conf —
        // the student said nothing, so no Wrong may fire, not even after settle.
        processWordModeResult({ isFinal: false, confidence: 0.25, 0: { transcript: "the" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        vi.advanceTimersByTime(2000);
        expect(propsRef.current.onMispronounced).not.toHaveBeenCalled();
        expect(propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
    test("FIX late Correct overrides an early authoritative Wrong", () => {
        const { stateRefs, timeoutRefs, timerRefs, propsRef } = makeRefs();
        // endpointed stutter fragment fires Wrong first (current instant path)…
        processWordModeResult({ isFinal: true, confidence: 0.9, 0: { transcript: "do" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onMispronounced).toHaveBeenCalledTimes(1);
        // …then the true word lands and must still win (engine cancels the
        // pending mispronounce advance via its stale-settle rescue).
        processWordModeResult({ isFinal: true, confidence: 0.95, 0: { transcript: "cat" } }, "cat", stateRefs, timerRefs, timeoutRefs, propsRef);
        expect(propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
    });
});
