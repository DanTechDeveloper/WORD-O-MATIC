import fs from "fs";
import { attentionMeta, attemptsShown, groupSentences, mergeSentenceWords, sentenceVerdict, verdict, VERDICT, VERDICT_META, VERDICT_STYLE, NEEDS_ATTENTION_ATTEMPTS } from "@/utils/masteryLabels.js";

const THRESHOLD = NEEDS_ATTENTION_ATTEMPTS;

// Same idiom as liveStats.test.js / offlineGuard.test.js: a rule that lives in
// JSX is a file-content check. Comments quote the code they replaced, so a
// negative lock reads CODE only.
const codeOnly = (src) =>
    src
        .split("\n")
        .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
        .join("\n");

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

        test("returns 3 buckets — the three the count line names", () => {
            // Practicing and Mastered are dropped on purpose: a new student's
            // 20 unread sentences used to render behind two dead "(0)" headings,
            // which made the panel read as empty. The count line only ever named
            // these three, so the group list — not the summary — was the outlier.
            const { groups } = groupSentences(curriculum);
            expect(groups.map((g) => g.key)).toEqual([
                VERDICT.NEEDS_ATTENTION,
                VERDICT.RECOVERED,
                VERDICT.NOT_ATTEMPTED,
            ]);
        });

        test("an untouched sentence is Not Attempted, never Mastered", () => {
            const { groups } = groupSentences(curriculum);
            const row = groups.find((g) => g.key === VERDICT.NOT_ATTEMPTED).rows[0];
            expect(row.sentence).toBe("Birds fly.");
            expect(groups.find((g) => g.key === VERDICT.RECOVERED).rows).toHaveLength(1);
        });

        test("a practising sentence is in NO group, and the count line still knows it", () => {
            // REGRESSION LOCK. The bucket list is the whole mechanism: a future
            // edit that re-adds PRACTICING or MASTERED would silently re-bury the
            // unread sentences this change exists to surface, and the assertions
            // above would still pass. counts is seeded from VERDICT rather than
            // from the bucket list, so the number must stay readable.
            const practice = [
                {
                    level: "Level 2: Barn",
                    sentence_stats: [
                        { sentence: "Goats graze.", mastery: "training", words: [{ word: "goats", mastery: "training", failed_attempts: 1 }] },
                        { sentence: "Crows caw.", mastery: "mastered", words: [{ word: "crows", mastery: "mastered", failed_attempts: 0 }] },
                    ],
                },
            ];

            const { groups, counts } = groupSentences(practice);
            expect(groups.flatMap((g) => g.rows)).toHaveLength(0);
            expect(counts[VERDICT.PRACTICING]).toBe(1);
            expect(counts[VERDICT.MASTERED]).toBe(1);
        });

        test("every sentence renders exactly once, and names its module", () => {
            // All 3 fixture sentences land in a kept bucket: a 4-try training
            // word is Needs Attention, a 4-try MASTERED word is Recovered
            // (>= threshold, not > 0), and an untouched word is Not Attempted.
            const { groups, counts } = groupSentences(curriculum);
            expect(groups.flatMap((g) => g.rows)).toHaveLength(3);
            expect(counts[VERDICT.NEEDS_ATTENTION]).toBe(1);
            expect(counts[VERDICT.RECOVERED]).toBe(1);
            expect(groups[0].rows[0].level).toBe("Level 1: Farm");
        });
    });

    // REGRESSION GUARD. Story Quest's per-word row used to print raw
    // failed_attempts as "N Attempts" and gate its label on a hand-rolled
    // `!VERDICT_META[v].quiet`, so one word read two different attempt counts on
    // the same page (Word Blast said 5, Story Quest said 4) from two
    // implementations of one threshold. It must go through the Word Blast pair.
    describe("StudentDetails per-word row uses the Word Blast SSOT", () => {
        const details = codeOnly(
            fs.readFileSync("resources/js/Pages/Teacher/StudentDetails.jsx", "utf8"),
        );

        test("counts through attemptsShown, never the raw failed_attempts", () => {
            expect(details).toContain("attemptsShown(w)");
            // The raw print is what made a mastered word under-count by one.
            expect(details).not.toContain("{w.failed_attempts} Attempt");
        });

        test("every word gets a status, not just the ones past the threshold", () => {
            // REGRESSION LOCK. A sentence has no Mastery/Training zone to give
            // context, so a threshold-gated badge left "ATTEMPTS: 1" unlabelled
            // directly under a red NEEDS ATTENTION heading — which read as a
            // contradiction. The label must render unconditionally; only its
            // COLOUR goes quiet (VERDICT_META sets muted for Practicing).
            expect(details).toContain("VERDICT_META[w.verdict]");
            expect(details).not.toContain("attentionMeta(w, threshold)");
        });

        test("the Word Blast chip keeps its own threshold gate", () => {
            // The two surfaces differ ON PURPOSE. Do not "unify" them.
            expect(details).toContain("attentionMeta(stat, threshold)");
        });

        test("no status dot on the drill list or the group heading", () => {
            // Both were a second copy of a colour already printed nearby: the
            // sentence text colours every word by its own verdict, and the group
            // heading already carries meta.cls. Removing the legend does NOT touch
            // SpeakModeMainContent's — that is the student's live karaoke key.
            const drill = details.slice(details.indexOf("const problems ="), details.indexOf("export default"));
            expect(drill).not.toContain("VERDICT_STYLE[w.verdict].dot");
            const groups = details.slice(details.indexOf("visibleSqGroups.map"));
            expect(groups).not.toContain("rounded-full shrink-0");
        });
    });

    // A word is painted twice on the Story Quest panel: the sentence text gives
    // it a chip BORDER (VERDICT_STYLE) and the drill list prints its status
    // (VERDICT_META). If the two hues disagree the same word looks like two
    // different verdicts. Practicing shipped grey against an orange border, and
    // Mastered shipped emerald — the same emerald as Recovered.
    describe("every status wears its own chip's border colour", () => {
        const borderShade = (chip) => (chip.match(/border-([a-z]+-[0-9]+|accent)/) || [])[1];

        for (const key of Object.values(VERDICT)) {
            const chip = VERDICT_STYLE[key].chip;
            const border = borderShade(chip);

            test(`${key}`, () => {
                if (!border) {
                    // Not Attempted has no chip — an untouched word is plain text,
                    // so its label stays neutral rather than inventing a hue.
                    expect(VERDICT_META[key].cls).toBe("text-on-surface-variant");
                    return;
                }
                expect(VERDICT_META[key].cls).toBe(`text-${border}`);
            });
        }

        test("no two verdicts share a colour", () => {
            // Cheap, and it is the exact failure: Recovered vs Mastered were both
            // emerald-400, so a rescued word and a never-struggled one looked
            // identical in the drill list.
            const hues = Object.values(VERDICT).map((k) => VERDICT_META[k].cls);
            expect(new Set(hues).size).toBe(hues.length);
        });
    });

    // REGRESSION GUARD for a class-purge bug no test could see. Tailwind scans
    // the `content` globs to decide which classes EXIST. masteryLabels.js owns
    // every verdict colour and is a .js file, so when the globs were jsx+blade
    // only, the entire emerald family was purged from the bundle: "Recovered"
    // fell back to the inherited body colour (black) on a dark panel, in BOTH
    // the Word Blast chip and the Story Quest heading, and the sentence chips
    // lost their borders. Nothing in vitest or phpunit renders CSS, so the
    // whole emerald family vanished silently — assert the glob, not the colour.
    describe("Tailwind scans the SSOT that owns the verdict colours", () => {
        const config = fs.readFileSync("tailwind.config.js", "utf8");
        const globs = [...config.matchAll(/'(\.\/[^']+)'/g)].map((m) => m[1]);
        const matches = (glob, file) =>
            new RegExp(
                "^" +
                    glob
                        .replace(/^\.\//, "")
                        .replace(/[.+^${}()|[\]\\]/g, "\\$&")
                        .replace(/\*\*\//g, "(?:.*/)?")
                        .replace(/\*\*/g, ".*")
                        .replace(/\*/g, "[^/]*") +
                        "$",
            ).test(file);

        test("masteryLabels.js is inside a scanned path", () => {
            const file = "resources/js/utils/masteryLabels.js";
            expect(globs.filter((g) => matches(g, file))).not.toHaveLength(0);
        });

        test("every colour it emits reaches a scanned file", () => {
            // The whole point of the glob: a colour that only appears in a .js
            // file is still a real class once the .js is scanned.
            const src = fs.readFileSync("resources/js/utils/masteryLabels.js", "utf8");
            const colours = [...new Set(src.match(/(?:text|bg|border)-[a-z]+-?[0-9]*(?:\/[0-9]+)?/g) || [])];

            expect(colours.length).toBeGreaterThan(0);
            expect(colours).toContain("text-emerald-400");
        });
    });
});
