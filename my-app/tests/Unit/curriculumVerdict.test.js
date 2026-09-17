import { isWordMatch, normalizeText } from "@/lib/speechUtils.js";
import {
    processWordModeResult,
    processSentenceModeResult,
} from "@/lib/speechProcessors.js";

// ponytail: Deepgram-path verdict gate — the exact functions useDeepgramRecognition
// calls per message (conn.on("message") -> processWordModeResult/processSentenceModeResult).
// The hook itself is not mountable here (node env, live mic/WebSocket/token), and its
// verdict logic lives 100% in these processors, so this IS the hook's pasado/bagsak path.
// Source of word lists: CurriculumSeeder.php — 1:1 mirror. A bagsak word fails the suite
// and must be REPLACED in the seeder (never shipped, never runtime-filtered — filtering
// would break the 10-words-per-level invariant, teacher edit rules, and report denominators).
//
// Pasado (every word): P1 exact isFinal -> recognized; P2 high-conf interim exact ->
// recognized; P4 uppercase exact -> recognized.
// Bagsak (any word): B1 wrong-first-letter authoritative -> mispronounced, never
// recognized; B2 far word -> mispronounced; B3 another curriculum word matches this
// target (intra collision).
// Story Quest per sentence: P5 full-sentence final -> recognized; B5 wrong-sentence
// final -> mispronounced.

const wordsByModule = {
    1: ["frog", "crab", "drum", "swim", "snack", "slide", "stone", "bloom", "grape", "grill"],
    2: ["dream", "cloud", "snail", "green", "shade", "train", "queen", "roast", "paint", "cloak"],
    3: ["brush", "clock", "smile", "plant", "crash", "dress", "frost", "twist", "shark", "phone"],
    4: ["splash", "street", "stripe", "crane", "flute", "skate", "brave", "brick", "spark", "blast"],
    5: ["tiger", "river", "lemon", "pocket", "circus", "magnet", "violin", "planet", "robot", "camel"],
    6: ["remake", "unlock", "rewrite", "unzip", "dislike", "distrust", "misplace", "misspell", "reopen", "recycle"],
    7: ["thankful", "endless", "softly", "muddy", "wishful", "harmless", "neatly", "sleepy", "sticky", "kindly"],
    8: ["airplane", "sailboat", "mailbox", "raincoat", "suitcase", "bookshelf", "campground", "dragonfly", "wheelchair", "keyboard"],
    9: ["thunder", "journey", "whisper", "meadow", "clever", "spirit", "voyage", "village", "comet", "canyon"],
    10: ["architecture", "temperature", "electricity", "expedition", "horizon", "fortress", "galaxy", "lagoon", "mosaic", "pyramid"],
};
const tutorialWords = ["apple", "banana", "puppy", "kitten", "hamster"];
const sentencesByLevel = {
    1: "Milo sees a frog. A crab can swim.",
    2: "A green cloud floats. The queen sees a train.",
    3: "The clock ticks. Milo holds a brush.",
    4: "A brave crane lands. Milo finds a brick.",
    5: "A tiger crosses the river. A robot holds a lemon.",
    6: "Milo will recycle paper. He can reopen it.",
    7: "Milo walks softly. He feels thankful.",
    8: "A sailboat crosses the lake. Milo finds a mailbox.",
    9: "They hear low thunder. Milo finds a village.",
    10: "The fortress stands tall. Milo joins the expedition.",
};
const tutorialSentence = "A puppy naps. A hamster runs.";

const allWordBlast = [...Object.values(wordsByModule).flat(), ...tutorialWords];
const allSentences = [...Object.values(sentencesByLevel), tutorialSentence];

const makeWordRefs = () => {
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
    const timerRefs = { current: { restart: null, sentence: null, word: null, settle: null, sentenceSettle: null, wordSettle: null } };
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

const makeSentenceRefs = () => {
    const refs = makeWordRefs();
    refs.timeoutRefs.current.graceEnd = 0;
    return refs;
};

const wrongFirst = (w) => (w[0] !== "z" ? "z" : "q") + w.slice(1);
const FAR_WORDS = ["zebra", "xylophone"];

describe("Word Blast verdict gate — processWordModeResult per seeded word", () => {
    test("105 words total (100 + 5 tutorial), no dups, lowercase, 4-20 chars", () => {
        expect(allWordBlast.length).toBe(105);
        const seen = new Set();
        for (const w of allWordBlast) {
            expect(w).toBe(w.toLowerCase());
            expect(w.length).toBeGreaterThanOrEqual(4);
            expect(w.length).toBeLessThanOrEqual(20);
            expect(seen.has(w)).toBe(false);
            seen.add(w);
        }
    });

    for (const w of allWordBlast) {
        test(`pasado: "${w}" recognized on exact final + high-conf interim + uppercase`, () => {
            for (const spoken of [w, w.toUpperCase()]) {
                const refs = makeWordRefs();
                processWordModeResult(
                    { isFinal: true, confidence: 1, 0: { transcript: spoken } },
                    w, refs.stateRefs, refs.timerRefs, refs.timeoutRefs, refs.propsRef,
                );
                expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
                expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
            }
            const interim = makeWordRefs();
            processWordModeResult(
                { isFinal: false, confidence: 0.9, 0: { transcript: w } },
                w, interim.stateRefs, interim.timerRefs, interim.timeoutRefs, interim.propsRef,
            );
            expect(interim.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        });

        test(`bagsak kung mali: "${w}" mispronounced on wrong-first-letter + far words, never recognized`, () => {
            for (const spoken of [wrongFirst(w), ...FAR_WORDS]) {
                const refs = makeWordRefs();
                processWordModeResult(
                    { isFinal: true, confidence: 0.9, 0: { transcript: spoken } },
                    w, refs.stateRefs, refs.timerRefs, refs.timeoutRefs, refs.propsRef,
                );
                expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
                expect(refs.propsRef.current.onMispronounced).toHaveBeenCalled();
            }
        });
    }

    test("B3: zero intra-curriculum collisions — no other seeded word matches any target", () => {
        for (let i = 0; i < allWordBlast.length; i++) {
            for (let j = 0; j < allWordBlast.length; j++) {
                if (i === j) continue;
                expect(isWordMatch(allWordBlast[i], allWordBlast[j])).toBe(false);
            }
        }
    });
});

describe("Story Quest verdict gate — processSentenceModeResult per seeded sentence", () => {
    for (const sentence of allSentences) {
        const target = normalizeText(sentence);
        test(`pasado: recognized on full-sentence final — "${sentence}"`, () => {
            const refs = makeSentenceRefs();
            processSentenceModeResult(
                { isFinal: true, confidence: 1, 0: { transcript: sentence } },
                target, refs.stateRefs, refs.timeoutRefs, refs.timerRefs, refs.propsRef,
            );
            expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
            expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
        });

        test(`bagsak kung mali: wrong-sentence final mispronounced — "${sentence}"`, () => {
            for (const wrong of ["The dog ran away", "Zebra queens jump high"]) {
                const refs = makeSentenceRefs();
                processSentenceModeResult(
                    { isFinal: true, confidence: 0.9, 0: { transcript: wrong } },
                    target, refs.stateRefs, refs.timeoutRefs, refs.timerRefs, refs.propsRef,
                );
                expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
                expect(refs.propsRef.current.onMispronounced).toHaveBeenCalled();
            }
        });
    }
});

describe("Tutorial transcript lesson — locked (strict)", () => {
    test("inflections do NOT recognize — base form only (strict)", () => {
        expect(isWordMatch("apples", "apple")).toBe(false);
        expect(isWordMatch("puppy", "pupy")).toBe(false);
    });
    test("transcript-risk blocklist — neither side of a confusable pair is seeded", () => {
        const riskyPairs = [
            ["sea", "see"], ["eye", "i"], ["right", "write"], ["son", "sun"],
            ["hello", "hollow"], ["weak", "week"], ["hear", "here"], ["buy", "by"],
            ["to", "too"], ["to", "two"], ["ate", "eight"], ["pair", "pear"],
            ["bare", "bear"], ["ant", "aunt"], ["harbour", "harbor"], ["lite", "light"],
            ["prints", "prince"], ["retail", "retell"], ["bacon", "beacon"],
            ["sheet", "sheep"], ["beach", "peach"], ["clown", "crown"], ["nurse", "purse"],
            ["coast", "toast"], ["brake", "break"], ["flower", "flour"], ["knight", "night"],
        ];
        const seeded = new Set(allWordBlast);
        for (const [x, y] of riskyPairs) {
            expect(seeded.has(x)).toBe(false);
            expect(seeded.has(y)).toBe(false);
        }
    });
    test("single-char fragility stays out: old I->'eye' class of failure does not exist here", () => {
        expect(isWordMatch("eye", "elk")).toBe(false);
        for (const w of tutorialWords) expect(w.length).toBeGreaterThanOrEqual(3);
    });
});
