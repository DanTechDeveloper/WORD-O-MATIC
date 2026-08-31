import { standardLevenshtein, isWordMatch, isFuzzyMatch, normalizeText } from "@/lib/speechUtils.js";

// ponytail: HARDCODED WORD BLAST curriculum — WORD BLAST only (L1-L10 100) + tutorial 5 = 105
// Source: CurriculumSeeder.php (Word Blast WORDS, not paragraphs)
// L1 fish/bird/book/lamp/jump/farm/chip/desk/moon/iron + L2 snow + L3 grip/palm + L4 track/press — Plan A 6-word fix for intra d=1 collisions (fish/fist, lamp/clamp, gold/golf, rain/train, sand/hand, train/trail).
// If a word not pabor (d=1 gives unwanted Correct), replace word in seeder and keep d<=1.
// This test uses standardLevenshtein ALONE — no withinRatio / boundaryLeak.

const wordsByModule = {
    1: ["fish", "bird", "book", "lamp", "jump", "farm", "chip", "desk", "moon", "iron"],
    2: ["cake", "tree", "kite", "road", "cube", "snow", "boat", "seed", "lime", "bone"],
    3: ["star", "drum", "frog", "milk", "nest", "sand", "belt", "grip", "golf", "palm"],
    4: ["grass", "train", "plate", "broom", "snake", "grape", "track", "flame", "press", "brick"],
    5: ["rabbit", "window", "pencil", "basket", "kitten", "napkin", "picnic", "helmet", "muffin", "lantern"],
    6: ["replay", "prefix", "unseen", "redo", "undo", "preview", "unhappy", "reload", "rewrite", "subway"],
    7: ["slowly", "joyful", "fearless", "quickly", "useful", "careful", "loudly", "kindly", "sadly", "painful"],
    8: ["rainbow", "sunset", "popcorn", "bedroom", "toothbrush", "football", "pancake", "firefly", "starfish", "cupcake"],
    9: ["explore", "beautiful", "adventure", "dinosaur", "enormous", "fantastic", "astronaut", "discover", "important", "vegetable"],
    10: ["perseverance", "accomplishment", "extraordinary", "responsibility", "determination", "communication", "collaboration", "environment", "celebration", "imagination"],
};
const tutorialWords = ["a", "I", "see", "my", "the"];
const allWordBlast = Object.values(wordsByModule).flat();
const allWithTutorial = [...allWordBlast, ...tutorialWords.map((w) => normalizeText(w))];

describe("CurriculumSeeder HARDCODED — WORD BLAST only (L1 Levenshtein-safe)", () => {
    test("WORD BLAST 100 words (10×10) with new L1", () => {
        expect(allWordBlast.length).toBe(100);
        for (let lvl = 1; lvl <= 10; lvl++) expect(wordsByModule[lvl].length).toBe(10);
        expect(wordsByModule[1]).toEqual(["fish", "bird", "book", "lamp", "jump", "farm", "chip", "desk", "moon", "iron"]);
    });
    test("with tutorial 105 total", () => {
        expect(allWithTutorial.length).toBe(105);
    });
    test("no duplicates, lowercase, max 20, L1 not in L2-L10", () => {
        const seen = new Set();
        for (const w of allWordBlast) {
            expect(w).toBe(w.toLowerCase());
            expect(w.length).toBeGreaterThan(0);
            expect(w.length).toBeLessThanOrEqual(20);
            expect(seen.has(w)).toBe(false);
            seen.add(w);
        }
        // L1 distinct from others
        const rest = Object.values(wordsByModule).slice(1).flat();
        for (const w of wordsByModule[1]) expect(rest.includes(w)).toBe(false);
    });
    test("L1 avg len ~4 (Levenshtein-safe) vs old 3", () => {
        const avg = wordsByModule[1].reduce((s, w) => s + w.length, 0) / 10;
        expect(avg).toBe(4);
    });
});

describe("Levenshtein ALONE audit — standardLevenshtein only (d<=1)", () => {
    test("raw d sanity", () => {
        expect(standardLevenshtein("fish", "fist")).toBe(1);
        expect(standardLevenshtein("cot", "cat")).toBe(1);
        expect(standardLevenshtein("kat", "cat")).toBe(1);
        expect(standardLevenshtein("category", "cat")).toBe(5);
        expect(standardLevenshtein("cup cake", "cupcake")).toBe(1);
        expect(standardLevenshtein("tabl", "table")).toBe(1);
    });

    test("WORD BLAST Levenshtein-safe: new L1 words have ≤2 real d=1 neighbors (old cat had 10)", () => {
        const common = ["cat","cot","cut","bat","hat","mat","rat","can","cap","car","dog","dig","dug","dag","cog","log","sun","son","bun","run","big","bag","beg","red","bed","cup","cop","box","fox","pen","pan","pin","fish","fist","dish","bird","bard","book","look","cook","lamp","camp","jump","bump","farm","harm","chip","chop","desk","disk","moon","soon","gold","cold","hold","iron","snow","grip","palm","track","press"];
        const counts = wordsByModule[1].map((w) => ({
            w,
            c: common.filter((c) => c !== w && standardLevenshtein(w, c) === 1).length,
        }));
        for (const { w, c } of counts) expect(c).toBeLessThanOrEqual(2);
        expect(counts.find((x) => x.w === "fish").c).toBe(2);
        expect(counts.find((x) => x.w === "iron").c).toBe(0);
    });

    test("isWordMatch now = d<=1 (Levenshtein alone) — cot/cat true, kat/cat true, tabl/table true", () => {
        // Under d<=1 alone, lahat ng 1-edit papasa — pati leading/trailing na dati blocked
        expect(isWordMatch("cot", "cat")).toBe(true);
        expect(isWordMatch("kat", "cat")).toBe(true);
        expect(isWordMatch("tabl", "table")).toBe(true);
        expect(isWordMatch("fish", "fist")).toBe(true);
        expect(isWordMatch("bird", "bard")).toBe(true);
        // 2+ edits still false
        expect(isWordMatch("category", "cat")).toBe(false);
        expect(isWordMatch("cat", "dog")).toBe(false);
    });

    test("every WORD BLAST word: medial d=1 now Correct via Levenshtein alone", () => {
        const medialSwap = (w) => {
            if (w.length < 3) return w;
            const mid = Math.floor(w.length / 2);
            return w.slice(0, mid) + (w[mid] !== "o" ? "o" : "a") + w.slice(mid + 1);
        };
        for (const w of allWordBlast) {
            if (w.length < 3) continue;
            const v = medialSwap(w);
            if (v === w) continue;
            expect(standardLevenshtein(v, w)).toBe(1);
            expect(isWordMatch(v, w)).toBe(true);
            expect(isFuzzyMatch(v, w)).toBe(true);
        }
    });

    test("random word salpak — kung d<=1 sa target, true kaya pwede isalpak sa CurriculumSeeder", () => {
        // Simulate: random candidate "fist" for target "fish" — d=1 true → pabor, pwede isalpak
        // Pero ngayon wala nang fist sa curriculum (grip na), at iron/gold collision fixed
        const target = "iron";
        const candidates = ["irons", "irony", "icon", "xyz"];
        const pabor = candidates.filter((c) => isWordMatch(c, target));
        // irons d=1 true, xyz false
        expect(pabor).toContain("irons");
        expect(isWordMatch("xyz", "iron")).toBe(false);

        // Full flow: random word "cold" vs old "gold" d=1 true pero gold wala na, iron vs cold d=4 false → hindi isasalpak
        expect(standardLevenshtein("cold", "iron")).toBe(4);
        expect(isWordMatch("cold", "iron")).toBe(false);

        // Intra-curriculum d=1 should be 0 after Plan A fix
        const all = Object.values(wordsByModule).flat();
        let intra = 0;
        for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) if (standardLevenshtein(all[i], all[j]) <= 1) intra++;
        expect(intra).toBe(0);

        // Random salpak demo: new word "grip" vs "fish" d=4 false → hindi pabor, pero grip vs target grip true
        expect(isWordMatch("grip", "grip")).toBe(true);
        expect(isWordMatch("fist", "fish")).toBe(true); // fist still d=1 to fish, but fist not in curriculum anymore
    });

    test("tutorial not scored but same d<=1", () => {
        expect(isWordMatch("b", "a")).toBe(true); // d=1 true (single char)
        expect(isWordMatch("soe", "see")).toBe(true); // medial d=1 true
    });

    test("hardcoded verdict: Levenshtein alone sapat na, walang withinRatio/boundaryLeak — hindi pabor palitan salita", () => {
        // Kung hindi pabor (d>1 o d=1 pero unwanted), salita mismo papalitan, hindi threshold
        // Example: old "cat" had 10 neighbors → pinalitan ng "fish" (2 neighbors) — ngayon pabor
        expect(wordsByModule[1].includes("cat")).toBe(false);
        expect(wordsByModule[1].includes("fish")).toBe(true);
    });
});
