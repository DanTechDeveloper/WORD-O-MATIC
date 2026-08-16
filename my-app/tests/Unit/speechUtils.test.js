import { isFuzzyMatch } from "@/lib/speechUtils.js";
 
describe("isFuzzyMatch", () => {
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
 
        test("returns false for cat and bat (leading substitution)", () => {
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
        test("returns false for elephant and legphant (leading drop)", () => {
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