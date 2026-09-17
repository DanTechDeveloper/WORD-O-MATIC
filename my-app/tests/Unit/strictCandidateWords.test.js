import { isWordMatch } from "@/lib/speechUtils.js";
import { processWordModeResult } from "@/lib/speechProcessors.js";

// ponytail: candidate staging gate — words NOT yet in the seeder, judged by the
// strict bar BEFORE promotion. Pasado (all asserts green) -> may be promoted 1:1
// into CurriculumSeeder providers (+ verdict mirrors + chapters as needed).
// Bagsak -> never promoted, recorded below, never runtime-filtered.
//
// Evaluated-and-EXCLUDED (criterion review, never entered the pool):
// - "yeast": east-confusion risk (isolated utterance may transcribe as "east").
// - "whale": "wail" homophone — unfixable false verdict under strict.
//
// Approved alternates (passed the gate, banked for future swaps, not yet seeded):
// (filled by promotion runs — pool members below that pass but are not swapped in)
//
// Pool history:
// - strict-era batch: 35 candidates (3/level L1-L10 + 5 tutorial), all passed,
//   11 promoted (see CurriculumSeeder), remainder banked as alternates.

const CANDIDATES = {
    1: ["clam", "grill", "brisk"],
    2: ["gloom", "beard", "cloak"],
    3: ["shark", "wrist", "gnome"],
    4: ["blast", "crisp", "grunt"],
    5: ["planet", "melon", "carpet"],
    6: ["subway", "preschool", "rewrite"],
    7: ["slowly", "bumpy", "sleepy"],
    8: ["cupcake", "toothbrush", "suitcase"],
    9: ["lantern", "prairie", "comet"],
    10: ["dinosaur", "volcano", "pyramid"],
    tutorial: ["mango", "orange", "papaya", "rabbit", "hamster"],
};

const BLOCKLISTED = [
    "sea", "see", "eye", "right", "write", "son", "sun", "hello", "hollow",
    "weak", "week", "hear", "here", "buy", "by", "to", "too", "two", "ate",
    "eight", "pair", "pear", "bare", "bear", "ant", "aunt", "harbour", "harbor",
    "lite", "light", "prints", "prince", "retail", "retell", "bacon", "beacon",
    "sheet", "sheep", "beach", "peach", "clown", "crown", "nurse", "purse",
    "coast", "toast", "brake", "break", "flower", "flour", "knight", "night",
];

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

const wrongFirst = (w) => (w[0] !== "z" ? "z" : "q") + w.slice(1);
const FAR_WORDS = ["zebra", "xylophone"];
const allCandidates = Object.values(CANDIDATES).flat();

describe("Candidate staging gate — strict verdicts per candidate word", () => {
    test("pool shape: 35 candidates, lowercase, 4-20 chars, no dups, none blocklisted", () => {
        expect(allCandidates.length).toBe(35);
        const seen = new Set();
        for (const w of allCandidates) {
            expect(w).toBe(w.toLowerCase());
            expect(w.length).toBeGreaterThanOrEqual(4);
            expect(w.length).toBeLessThanOrEqual(20);
            expect(seen.has(w)).toBe(false);
            seen.add(w);
            expect(BLOCKLISTED.includes(w)).toBe(false);
        }
    });

    for (const w of allCandidates) {
        test(`pasado: "${w}" recognized on exact final + high-conf interim + uppercase`, () => {
            for (const spoken of [w, w.toUpperCase()]) {
                const refs = makeRefs();
                processWordModeResult(
                    { isFinal: true, confidence: 1, 0: { transcript: spoken } },
                    w, refs.stateRefs, refs.timerRefs, refs.timeoutRefs, refs.propsRef,
                );
                expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
                expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
            }
            const interim = makeRefs();
            processWordModeResult(
                { isFinal: false, confidence: 0.9, 0: { transcript: w } },
                w, interim.stateRefs, interim.timerRefs, interim.timeoutRefs, interim.propsRef,
            );
            expect(interim.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        });

        test(`bagsak kung mali: "${w}" mispronounced on wrong-first-letter + far words`, () => {
            for (const spoken of [wrongFirst(w), ...FAR_WORDS]) {
                const refs = makeRefs();
                processWordModeResult(
                    { isFinal: true, confidence: 0.9, 0: { transcript: spoken } },
                    w, refs.stateRefs, refs.timerRefs, refs.timeoutRefs, refs.propsRef,
                );
                expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
                expect(refs.propsRef.current.onMispronounced).toHaveBeenCalled();
            }
        });
    }
});
