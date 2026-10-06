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
// ponytail: chapters are keyed 0-10 here exactly as CurriculumSeeder::paragraphsByLevel()
// is — key 0 IS the Story Quest tutorial chapter, so there is no separate tutorialSentence
// to keep in sync. parity with the seeder is MANUAL: nothing asserts these two literals
// equal CurriculumSeeder::wordsByModule()/paragraphsByLevel(). It drifted before —
// tutorialWords sat here as apple/banana/puppy/kitten/hamster while the seeder had already
// moved on, and the suite stayed green because it only tests its own copy. Resync both
// literals together on every reseed.
//
// Pasado (every word): P1 exact isFinal -> recognized; P2 high-conf interim exact ->
// recognized; P4 uppercase exact -> recognized.
// Bagsak (any word): B1 wrong-first-letter authoritative -> mispronounced, never
// recognized; B2 far word -> mispronounced; B3 another curriculum word matches this
// target (intra collision).
// Story Quest per sentence: P5 full-sentence final -> recognized; B5 wrong-sentence
// final -> mispronounced.

const wordsByModule = {
    1: ["lion", "frog", "fish", "bird", "duck", "goat", "wolf", "deer", "crab", "shark"],
    2: ["kitten", "puppy", "calf", "pony", "pigeon", "turtle", "hamster", "monkey", "mouse", "hedgehog"],
    3: ["moon", "storm", "rain", "snow", "wind", "cloud", "fire", "sunshine", "breeze", "frost"],
    4: ["apple", "banana", "grape", "melon", "lemon", "plum", "corn", "milk", "rice", "cake"],
    5: ["cheese", "mango", "honey", "walnut", "radish", "meat", "soup", "biscuit", "salt", "bean"],
    6: ["desk", "chair", "table", "door", "window", "shelf", "lamp", "paper", "shoe", "shirt"],
    7: ["jacket", "plate", "spoon", "fork", "knife", "blanket", "crayon", "backpack", "helmet", "bottle"],
    8: ["bike", "canoe", "raft", "truck", "taxi", "tractor", "wagon", "scooter", "ladder", "basket"],
    9: ["stop", "jump", "walk", "stand", "look", "sing", "open", "close", "push", "pull"],
    10: ["drop", "pick", "swim", "climb", "trace", "travel", "dash", "kneel", "sketch", "leap"],
};
const tutorialWords = ["start", "next", "skip", "play", "help"];
const sentencesByLevel = {
    0: "The game can start. Now we play.",
    1: "Water drips down. Frog feels cold.",
    2: "Stream flows fast. Puppy runs wide.",
    3: "Canoe glides soft. Wind blows hard.",
    4: "Fish swims deep. Melon rolls down.",
    5: "Rope pulls tight. Bean arrives safe.",
    6: "Gold shines bright. Lamp holds treasure.",
    7: "Key turns smooth. Knife slides apart.",
    8: "Hand takes prize. Basket fills up.",
    9: "Child can walk. Road looks clear.",
    10: "Camp fire burns. We drop the gear.",
};

const allWordBlast = [...Object.values(wordsByModule).flat(), ...tutorialWords];
const allSentences = Object.values(sentencesByLevel);

const makeWordRefs = () => {
    const stateRefs = {
        current: {
            hasMatched: false,
            isMounted: true,
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

// ponytail: the determiner rule is an ASR decision, not a style one, so it gets a
// gate. isWordMatch's filler skip (speechUtils.js:101-102) discards an EXTRA token
// on the SPOKEN side — a determiner in the TARGET is a required slot, not a filler.
// These chapters are read aloud as one whole sentence, so a leading "the" the child
// skips loses the entire score. Determiner-free targets accept BOTH readings.
describe("no leading determiner in a chapter sentence", () => {
    test("no real chapter (levels 1-10) opens with the/a/an", () => {
        const offenders = [];
        for (const level of Object.keys(sentencesByLevel)) {
            if (level === "0") continue; // frozen tutorial — see the test below
            for (const part of sentencesByLevel[level].split(/(?<=[.!?])\s+/)) {
                if (/^(the|a|an)\b/i.test(part.trim())) {
                    offenders.push(`L${level}: "${part.trim()}"`);
                }
            }
        }
        // Bagsak dito = alisin ang determiner sa seeder, HINDI palawayin ang matcher.
        expect(offenders).toEqual([]);
    });

    test("KNOWN GAP: key 0 (tutorial) still leads with a determiner, and is frozen", () => {
        // Asserted, not ignored. CurriculumSeeder seeds level 0 through
        // firstOrCreate + wasRecentlyCreated, so its text can never change on a
        // re-seed — editing it in the seeder is a no-op until migrate:fresh. It is
        // the same ASR exposure the rule above removes, on the one chapter every
        // child reads first. Recorded here so it cannot be forgotten silently.
        expect(sentencesByLevel[0]).toBe("The game can start. Now we play.");
        expect(isWordMatch("game can start", sentencesByLevel[0].split(". ")[0])).toBe(false);
    });

    test("why the rule holds: a determiner-free target accepts a spoken determiner", () => {
        // The reverse is NOT true — this is the whole point. A child who drops the
        // article against a target that has one fails the ENTIRE sentence.
        expect(isWordMatch("frog feels cold", "the frog feels cold")).toBe(false);
        expect(isWordMatch("the frog feels cold", "frog feels cold")).toBe(true);
        expect(isWordMatch("the the frog feels cold", "frog feels cold")).toBe(true);
    });
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

describe("Seeded STT-split compatibility — new matcher favors the curriculum", () => {
    test("L8 compounds survive STT splits (air plane vs airplane)", () => {
        const splits = {
            airplane: "air plane", sailboat: "sail boat", mailbox: "mail box",
            raincoat: "rain coat", suitcase: "suit case", bookshelf: "book shelf",
            campground: "camp ground", dragonfly: "dragon fly", wheelchair: "wheel chair",
            keyboard: "key board",
        };
        for (const [target, spoken] of Object.entries(splits)) {
            expect(isWordMatch(spoken, target)).toBe(true);
        }
    });
    test("L6 prefixed words survive STT splits (re make vs remake)", () => {
        const splits = {
            remake: "re make", unlock: "un lock", rewrite: "re write", unzip: "un zip",
            dislike: "dis like", distrust: "dis trust", misplace: "mis place",
            misspell: "mis spell", reopen: "re open", recycle: "re cycle",
        };
        for (const [target, spoken] of Object.entries(splits)) {
            expect(isWordMatch(spoken, target)).toBe(true);
        }
    });
    test("letter-spelling stays out: the acoustic model never emits it", () => {
        expect(isWordMatch("f r o g", "frog")).toBe(false);
        expect(isWordMatch("c l o c k", "clock")).toBe(false);
        expect(isWordMatch("a p p l e", "apple")).toBe(false);
    });
});

describe("Inverse cross-collision — chapter joins never spell a seeded word", () => {
    test("2..20-token windows of every chapter never equal a seeded word", () => {
        const seeded = new Set(allWordBlast);
        const collisions = [];
        for (const sentence of allSentences) {
            const words = normalizeText(sentence).split(/\s+/).filter(Boolean);
            for (let start = 0; start < words.length; start++) {
                let joined = "";
                for (let k = 1; k <= 20 && start + k - 1 < words.length; k++) {
                    joined += words[start + k - 1];
                    if (joined.length > 20) break;
                    if (k >= 2 && seeded.has(joined)) {
                        collisions.push(`"${sentence}" :: "${joined}"`);
                    }
                }
            }
        }
        // Bagsak dito = swap word (Step 4), never loosen the matcher.
        expect(collisions).toEqual([]);
    });
});
