import { resolveWordOrder } from "@/Pages/Student/GameplayReadMode.jsx";
import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");

// ponytail: the two properties that matter — a saved order restores EXACTLY
// (an F5 mid-round must not move the kid to a different word), and a fresh
// order is a PERMUTATION (never a loss, never a duplicate). We assert the
// properties, not the randomness: Math.random is not seedable here and a test
// that flaked on chance would be worse than no test.
const WORDS = [
    { id: 1, word: "APPLE" },
    { id: 2, word: "BANANA" },
    { id: 3, word: "PUPPY" },
];
const ids = (arr) => arr.map((w) => w.id);

describe("resolveWordOrder", () => {
    describe("restore from a saved order", () => {
        test("returns exactly the saved order, not the authored one", () => {
            expect(ids(resolveWordOrder(WORDS, [3, 1, 2]))).toEqual([3, 1, 2]);
        });

        test("is stable across calls — an F5 mid-round cannot reshuffle", () => {
            const saved = [2, 3, 1];
            expect(ids(resolveWordOrder(WORDS, saved))).toEqual(ids(resolveWordOrder(WORDS, saved)));
        });

        test("matches ids regardless of number-vs-string (Inertia id drift)", () => {
            expect(ids(resolveWordOrder(WORDS, ["3", "1", "2"]))).toEqual([3, 1, 2]);
        });

        test("carries the word payload, not just the id", () => {
            expect(resolveWordOrder(WORDS, [2, 3, 1])[0]).toEqual({ id: 2, word: "BANANA" });
        });
    });

    describe("fallback to a fresh shuffle", () => {
        test("no saved order still yields every word", () => {
            expect(ids(resolveWordOrder(WORDS, null)).sort()).toEqual([1, 2, 3]);
        });

        test("is a permutation — same multiset, no loss, no duplicate", () => {
            const out = resolveWordOrder(WORDS);
            expect(out).toHaveLength(WORDS.length);
            expect(new Set(ids(out)).size).toBe(WORDS.length);
        });

        test("a wrong-length saved order is discarded, not truncated", () => {
            expect(ids(resolveWordOrder(WORDS, [1, 2]))).toHaveLength(3);
        });

        test("an unknown id is discarded, not half-applied", () => {
            expect(ids(resolveWordOrder(WORDS, [1, 999, 2]))).toHaveLength(3);
        });

        test("does not mutate the caller's array", () => {
            const base = [...WORDS];
            resolveWordOrder(base, null);
            expect(ids(base)).toEqual([1, 2, 3]);
        });
    });

    describe("degenerate input", () => {
        test("empty module returns empty", () => {
            expect(resolveWordOrder([], [1, 2])).toEqual([]);
        });

        test("undefined module is safe", () => {
            expect(resolveWordOrder(undefined, undefined)).toEqual([]);
        });
    });
});

// Source-locks, same pattern as gameplayRecovery.test.js. The shuffle is only
// safe because of WHERE it lives; a future refactor that moves it into the
// shared core silently breaks Story Quest, and no behaviour test down here
// would notice, because Story Quest never calls resolveWordOrder.
describe("word-order placement", () => {
    const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");
    const core = read("resources/js/hooks/Student/useGameplayCore.js");

    test("useGameplayCore does NOT shuffle — Story Quest shares it", () => {
        // useStoryQuestEngine spreads this hook, and its sentence ranges are
        // built by index (rangesFromWords). A shuffle here would scramble the
        // read order of a paragraph.
        // Regex, not a bare word: the prose in this file talks about shuffling
        // on purpose, and a substring lock would lock the comment, not the code.
        expect(core).not.toContain("resolveWordOrder");
        expect(core).not.toMatch(/const shuffled|\.sort\(\(\)\s*=>\s*Math\.random/);
    });

    test("the core records the order as ids, never as a reshuffle", () => {
        expect(core).toContain("wordOrder: wordsRef.current.map((w) => w.id)");
    });

    test("the core writes the resume record through resumeStorage, not a raw key", () => {
        // AGENTS: resumeStorage.js owns both keys — never hand-roll either one.
        // A raw setItem here is how the two writers drift apart.
        expect(core).toContain("writeResumeSession(moduleId, {");
        expect(core).not.toContain("wordomaticResume:");
    });

    test("the engine and the screen read the SAME array", () => {
        // words: wordOrder drives the microphone; words={wordOrder} draws the
        // giant word. A direct module?.words at either site re-opens the
        // one-shows-one-hears split.
        expect(readMode).toContain("words: wordOrder");
        expect(readMode).toContain("words={wordOrder}");
        expect(readMode).not.toContain("words={module?.words}");
    });

    test("the order is resolved once per mount, not per render", () => {
        expect(readMode).toContain("const [wordOrder] = useState(");
    });
});

// Sentences CANNOT be shuffled: useStoryQuestEngine builds contiguous sentence
// ranges by index, and the karaoke highlight walks them in reading order. The
// shuffle is therefore Word Blast's alone — this block exists so "separate
// business logic" stays true rather than merely being true today.
describe("the shuffle never reaches Story Quest", () => {
    const speakMode = read("resources/js/Pages/Student/GameplaySpeakMode.jsx");
    const storyQuest = read("resources/js/hooks/Student/useStoryQuestEngine.js");
    const wordEngine = read("resources/js/hooks/Student/useWordBlastEngine.js");
    const core = read("resources/js/hooks/Student/useGameplayCore.js");

    test("neither the Story Quest page nor its engine shuffles", () => {
        expect(speakMode).not.toContain("resolveWordOrder");
        expect(storyQuest).not.toContain("resolveWordOrder");
        expect(storyQuest).not.toMatch(/const shuffled|\.sort\(\(\)\s*=>\s*Math\.random/);
    });

    test("GameplaySpeakMode keeps the authored array, not a wordOrder", () => {
        expect(speakMode).toContain("words={speechRecognitionWords}");
        expect(speakMode).not.toContain("wordOrder");
    });

    test("each engine wrapper declares its own scope", () => {
        // useGameplayCore is shared, so it cannot know which game is mounted.
        expect(wordEngine).toContain('scope: "word"');
        expect(storyQuest).toContain('scope: "para"');
        expect(core).toContain("scope,");
    });

    test("the shared core never itself shuffles", () => {
        expect(core).not.toMatch(/const shuffled|\.sort\(\(\)\s*=>\s*Math\.random/);
    });
});
