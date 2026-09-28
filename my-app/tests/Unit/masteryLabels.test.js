import { attentionMeta, attemptsShown, groupSentences, mergeSentenceWords, sentenceVerdict, verdict, VERDICT, VERDICT_META, NEEDS_ATTENTION_ATTEMPTS } from "@/utils/masteryLabels.js";

const THRESHOLD = NEEDS_ATTENTION_ATTEMPTS;

describe("masteryLabels", () => {
    describe("verdict", () => {
        test("unseen is never a fake 0", () => {
            expect(verdict("unseen", 0)).toBe(VERDICT.NOT_ATTEMPTED);
        });

        test("training splits at the threshold", () => {
            expect(verdict("training", 2)).toBe(VERDICT.PRACTICING);
            expect(verdict("training", 3)).toBe(VERDICT.NEEDS_ATTENTION);
            expect(verdict("training", 9)).toBe(VERDICT.NEEDS_ATTENTION);
        });

        test("mastered is threshold-gated, not > 0", () => {
            // A word that slipped once and was then read correctly was never a
            // problem, so calling it "Recovered" credited a recovery that did
            // not happen. The floor MUST equal the attention floor.
            expect(verdict("mastered", 0)).toBe(VERDICT.MASTERED);
            expect(verdict("mastered", 1)).toBe(VERDICT.MASTERED);
            expect(verdict("mastered", 2)).toBe(VERDICT.MASTERED);
            expect(verdict("mastered", 3)).toBe(VERDICT.RECOVERED);
            expect(verdict("mastered", 4)).toBe(VERDICT.RECOVERED);
        });

        test("the recovered floor always equals the attention floor", () => {
            for (const threshold of [1, 2, 3, 4, 5]) {
                for (let failed = 0; failed <= 8; failed++) {
                    expect({
                        threshold,
                        failed,
                        wasFlagged: verdict("training", failed, threshold) === VERDICT.NEEDS_ATTENTION,
                    }).toEqual({
                        threshold,
                        failed,
                        wasFlagged: verdict("mastered", failed, threshold) === VERDICT.RECOVERED,
                    });
                }
            }
        });

        test("honours an explicit threshold", () => {
            expect(verdict("training", 3, 5)).toBe(VERDICT.PRACTICING);
            expect(verdict("training", 5, 5)).toBe(VERDICT.NEEDS_ATTENTION);
        });
    });

    describe("sentenceVerdict", () => {
        test("a summed miss count must not flag an untroubled sentence", () => {
            // THE false positive this exists to remove: 5 words at 1 miss each
            // sums to 5, clearing the threshold, while no word is a problem.
            const words = [
                { mastery: "mastered", failed_attempts: 0 },
                { mastery: "mastered", failed_attempts: 0 },
                { mastery: "mastered", failed_attempts: 0 },
                { mastery: "training", failed_attempts: 1 },
                { mastery: "training", failed_attempts: 2 },
            ];
            expect(words.reduce((n, w) => n + w.failed_attempts, 0)).toBe(3);
            expect(sentenceVerdict(words)).toBe(VERDICT.PRACTICING);
        });

        test("one hard word makes the sentence need attention", () => {
            expect(
                sentenceVerdict([
                    { mastery: "mastered", failed_attempts: 0 },
                    { mastery: "training", failed_attempts: 5 },
                    { mastery: "training", failed_attempts: 1 },
                ]),
            ).toBe(VERDICT.NEEDS_ATTENTION);
        });

        test("a fully mastered sentence with no history is just mastered", () => {
            expect(sentenceVerdict([{ mastery: "mastered", failed_attempts: 0 }])).toBe(VERDICT.MASTERED);
        });

        test("an untouched sentence is Not Attempted, never Mastered", () => {
            // Falling through to MASTERED made a brand-new student render every
            // untouched sentence as "conquered on the first try".
            const untouched = [
                { mastery: "unseen", failed_attempts: 0 },
                { mastery: "unseen", failed_attempts: 0 },
            ];
            expect(sentenceVerdict(untouched)).toBe(VERDICT.NOT_ATTEMPTED);
        });

        test("one played word lifts a sentence out of Not Attempted", () => {
            expect(
                sentenceVerdict([
                    { mastery: "training", failed_attempts: 1 },
                    { mastery: "unseen", failed_attempts: 0 },
                ]),
            ).toBe(VERDICT.PRACTICING);
        });
    });

    describe("mergeSentenceWords", () => {
        test("sums duplicate texts so the most common words are not undercounted", () => {
            // Keying by raw text is last-write-wins, which would report "a" at
            // 2 instead of 5 — the most common word in the curriculum.
            const merged = mergeSentenceWords([
                { word: "a", mastery: "training", failed_attempts: 2 },
                { word: "A", mastery: "training", failed_attempts: 3 },
                { word: "big", mastery: "training", failed_attempts: 1 },
            ]);
            expect(merged.map((w) => w.word)).toEqual(["a", "big"]);
            expect(merged[0].failed_attempts).toBe(5);
        });

        test("keeps the worst mastery", () => {
            const merged = mergeSentenceWords([
                { word: "big", mastery: "mastered", failed_attempts: 4 },
                { word: "Big", mastery: "training", failed_attempts: 1 },
            ]);
            expect(merged).toHaveLength(1);
            expect(merged[0].mastery).toBe("training");
            expect(merged[0].failed_attempts).toBe(5);
        });

        test("each merged word carries its own verdict", () => {
            const merged = mergeSentenceWords([
                { word: "a", mastery: "training", failed_attempts: 1 },
                { word: "big", mastery: "mastered", failed_attempts: 6 },
                { word: "cat", mastery: "unseen", failed_attempts: 0 },
            ]);
            expect(Object.fromEntries(merged.map((w) => [w.word, w.verdict]))).toEqual({
                a: VERDICT.PRACTICING,
                big: VERDICT.RECOVERED,
                cat: VERDICT.NOT_ATTEMPTED,
            });
        });

        test("drops punctuation-only tokens", () => {
            expect(mergeSentenceWords([{ word: "...", mastery: "training", failed_attempts: 3 }])).toEqual([]);
        });
    });


    describe("attemptsShown", () => {
        test("training shows raw failed_attempts", () => {
            expect(attemptsShown({ mastery: "training", failed_attempts: 3 })).toBe(3);
        });

        test("mastered adds the winning attempt (failed + 1)", () => {
            expect(attemptsShown({ mastery: "mastered", failed_attempts: 4 })).toBe(5);
        });

        test("mastered on first try shows 1", () => {
            expect(attemptsShown({ mastery: "mastered", failed_attempts: 0 })).toBe(1);
        });
    });

    describe("attentionMeta", () => {
        test("a clean mastered word gets no badge", () => {
            // The whole point of the threshold-gated recovered floor: a word
            // mastered below the threshold is just mastered. It must not be
            // labelled for a slip that never counted as a problem.
            expect(attentionMeta({ mastery: "mastered", failed_attempts: 2 }, THRESHOLD)).toBeNull();
        });

        test("training under threshold shows nothing (Normal is silent)", () => {
            expect(attentionMeta({ mastery: "training", failed_attempts: 2 }, THRESHOLD)).toBeNull();
        });

        test("training at threshold is Needs Attention", () => {
            expect(attentionMeta({ mastery: "training", failed_attempts: 3 }, THRESHOLD)).toEqual({
                label: "Needs Attention",
                cls: "text-red-500",
            });
        });

        test("mastered at threshold is Recovered", () => {
            expect(attentionMeta({ mastery: "mastered", failed_attempts: 3 }, THRESHOLD)).toEqual({
                label: "Recovered",
                cls: "text-emerald-400",
            });
        });
    });

    describe("groupSentences", () => {
        const curriculum = [
            {
                level: "Level 1: Farm",
                sentence_stats: [
                    { sentence: "A pig sat.", mastery: "training", words: [{ word: "pig", mastery: "training", failed_attempts: 4 }] },
                    { sentence: "Cats nap.", mastery: "mastered", words: [{ word: "cats", mastery: "mastered", failed_attempts: 4 }] },
                    { sentence: "Birds fly.", mastery: "training", words: [{ word: "birds", mastery: "unseen", failed_attempts: 0 }] },
                ],
            },
        ];

        test("returns 5 buckets — Story Quest keeps notAttempted", () => {
            const { groups } = groupSentences(curriculum);
            expect(groups.map((g) => g.key)).toEqual([
                VERDICT.NEEDS_ATTENTION,
                VERDICT.PRACTICING,
                VERDICT.RECOVERED,
                VERDICT.NOT_ATTEMPTED,
                VERDICT.MASTERED,
            ]);
        });

        test("an untouched sentence is Not Attempted, never Mastered", () => {
            const { groups } = groupSentences(curriculum);
            const row = groups.find((g) => g.key === VERDICT.NOT_ATTEMPTED).rows[0];
            expect(row.sentence).toBe("Birds fly.");
            expect(groups.find((g) => g.key === VERDICT.MASTERED).rows).toHaveLength(0);
        });

        test("every sentence renders exactly once, and names its module", () => {
            const { groups, counts } = groupSentences(curriculum);
            expect(groups.flatMap((g) => g.rows)).toHaveLength(3);
            expect(counts[VERDICT.NEEDS_ATTENTION]).toBe(1);
            expect(counts[VERDICT.RECOVERED]).toBe(1);
            expect(groups[0].rows[0].level).toBe("Level 1: Farm");
        });
    });
});
