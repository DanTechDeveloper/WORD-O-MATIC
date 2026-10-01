import fs from "fs";
import { attentionMeta, groupSentences, mergeSentenceWords, sentenceVerdict, verdict, VERDICT, VERDICT_META, VERDICT_STYLE, NEEDS_ATTENTION_ATTEMPTS } from "@/utils/masteryLabels.js";

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

        // ── the whole rule, every branch ──
        //
        // The per-widget suites pin the buckets, the panel and the chips, but
        // nothing pinned the RULE across its full input space — which is how a
        // vacuous-truth hole (the zero-word case below) could sit under a comment
        // claiming it was closed. Transcribed from ParagraphModule::buildLevels()
        // so the JS twin and the server twin are compared row by row;
        // VerdictTest.php runs the identical table.
        const M = (word, mastery, failed_attempts) => ({ word, mastery, failed_attempts });

        // ParagraphModule::buildLevels() line-for-line.
        const serverSentenceMastery = (words) => {
            const allMastered = words.length > 0 && words.every((s) => s.mastery === "mastered");
            const hasTraining = words.some((s) => s.mastery === "training");
            const hasUnseen = words.some((s) => s.mastery === "unseen");
            return allMastered ? "mastered" : hasTraining || hasUnseen ? "training" : "unseen";
        };

        const MATRIX = [
            ["clean mastered", [M("Crows", "mastered", 0), M("caw.", "mastered", 0)], VERDICT.MASTERED],
            ["mastered, 1 recorded failure", [M("Crows", "mastered", 0), M("caw.", "mastered", 1)], VERDICT.MASTERED],
            ["mastered, 2 recorded failures", [M("Crows", "mastered", 0), M("caw.", "mastered", 2)], VERDICT.MASTERED],
            ["mastered, 3 recorded failures (boundary)", [M("Crows", "mastered", 0), M("caw.", "mastered", 3)], VERDICT.RECOVERED],
            ["mastered, 7 recorded failures", [M("Crows", "mastered", 0), M("caw.", "mastered", 7)], VERDICT.RECOVERED],
            ["training, 0", [M("Goats", "training", 0)], VERDICT.PRACTICING],
            ["training, 2", [M("Goats", "training", 2)], VERDICT.PRACTICING],
            ["training, 3 (boundary)", [M("Goats", "training", 3)], VERDICT.NEEDS_ATTENTION],
            ["every word unseen", [M("Crab", "unseen", 0), M("paws.", "unseen", 0)], VERDICT.NOT_ATTEMPTED],
            ["mastered + unseen", [M("Milo", "mastered", 0), M("frog.", "unseen", 0)], VERDICT.NOT_ATTEMPTED],
            ["recovered word + hard word", [M("mail", "mastered", 4), M("goes.", "training", 9)], VERDICT.NEEDS_ATTENTION],
            ["dup word, 2+2 (merge crosses, sentence does not)", [M("A", "mastered", 2), M("cat", "mastered", 0), M("a", "mastered", 2)], VERDICT.MASTERED],
            ["dup word, 3+0 (merge crosses threshold)", [M("A", "mastered", 3), M("cat", "mastered", 0)], VERDICT.RECOVERED],
            ["null failed_attempts", [M("A", "mastered", null)], VERDICT.MASTERED],
            // No `undefined` in PHP — the real shape of "never set" is a MISSING
            // key, which is what (int) ($w['failed_attempts'] ?? 0) defends.
            ["missing failed_attempts key", [{ word: "A", mastery: "mastered" }], VERDICT.MASTERED],
        ];

        test.each(MATRIX)("%s", (_name, words, expected) => {
            expect(sentenceVerdict(words)).toBe(expected);
        });

        // THE BUG. `verdicts.includes(NOT_ATTEMPTED)` is the guard that stops a
        // never-attempted sentence falling through to MASTERED — but it needs AT
        // LEAST ONE word to find. Zero words makes every includes() miss and the
        // function returns MASTERED, so a sentence with nothing in it reports a
        // conquest that never happened and renders SILENT (the JSX gates
        // showAttempts on !== MASTERED). The comment above the NOT_ATTEMPTED
        // branch claimed this case was handled; it was not.
        //
        // Not reachable from production data today — sentencesFromContent()
        // filters empty splits and the legacy branch needs words->count() > 0 —
        // so this is a hole in the RULE, not an observed teacher-facing bug.
        test("a sentence with NO words is Not Attempted, never Mastered", () => {
            expect(sentenceVerdict([])).toBe(VERDICT.NOT_ATTEMPTED);
        });

        test("a null / undefined word list is also Not Attempted", () => {
            expect(sentenceVerdict(null)).toBe(VERDICT.NOT_ATTEMPTED);
            expect(sentenceVerdict(undefined)).toBe(VERDICT.NOT_ATTEMPTED);
        });

        // The threshold is a SHARED prop (HandleInertiaRequests ->
        // ReportService::NEEDS_ATTENTION_ATTEMPTS), so a teacher whose threshold
        // moves must move the recovered floor with it.
        test("a custom threshold moves the recovered floor with the attention floor", () => {
            const three = [{ mastery: "mastered", failed_attempts: 3 }];
            expect(sentenceVerdict(three, 3)).toBe(VERDICT.RECOVERED);
            expect(sentenceVerdict(three, 5)).toBe(VERDICT.MASTERED);
            expect(sentenceVerdict([{ mastery: "training", failed_attempts: 4 }], 5)).toBe(VERDICT.PRACTICING);
        });

        // The SENTENCE verdict and the DRILL ROW verdict judge different things:
        // sentenceVerdict() reads the raw per-occurrence words, while
        // mergeSentenceWords() folds duplicates into one row and sums their
        // counters. So "A" at 2 failures in position 1 and "a" at 2 in position 5
        // is a MASTERED sentence (no single occurrence ever hit 3) carrying a
        // RECOVERED drill row (the merged word reached 4).
        test("the sentence judges raw occurrences; the drill row judges the merge", () => {
            const each = [M("A", "mastered", 2), M("cat", "mastered", 0), M("a", "mastered", 2)];

            const rowA = mergeSentenceWords(each, NEEDS_ATTENTION_ATTEMPTS).find((w) => w.word === "A");
            expect(rowA.failed_attempts).toBe(4);
            expect(rowA.verdict).toBe(VERDICT.RECOVERED);
            expect(sentenceVerdict(each)).toBe(VERDICT.MASTERED);

            const atThreshold = [M("A", "mastered", 3), M("cat", "mastered", 0)];
            expect(sentenceVerdict(atThreshold)).toBe(VERDICT.RECOVERED);
        });

        test("null and undefined failed_attempts never produce NaN", () => {
            expect(sentenceVerdict([M("A", "training", null)])).toBe(VERDICT.PRACTICING);
            expect(sentenceVerdict([M("A", "mastered", undefined)])).toBe(VERDICT.MASTERED);
            expect(sentenceVerdict([M("A", "unseen", null)])).toBe(VERDICT.NOT_ATTEMPTED);
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

        test("returns all 5 buckets — every sentence belongs to one", () => {
            // An earlier cut to three (needsAttention/recovered/notAttempted) was
            // meant to stop a new student seeing dead "(0)" headings, but the
            // VISIBILITY FILTER at the call site is what does that. Cutting the
            // buckets dropped real content: a student whose sentences are
            // uniformly mastered had every sentence bucketed nowhere, so whole
            // levels rendered nothing. All five + drop-empty is the fix.
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

        test("an empty sentence is bucketed Not Attempted, not Mastered", () => {
            // The bucket-level consequence of the zero-word hole: it landed in
            // Mastered, and StudentDetails renders that group with
            // showAttempts=false, so the row showed as a silently-conquered
            // sentence rather than one the child never got to.
            const { groups, counts } = groupSentences([
                { level: "Level 1: Farm", sentence_stats: [{ sentence: "", mastery: "unseen", words: [] }] },
            ]);
            expect(counts[VERDICT.MASTERED]).toBe(0);
            expect(groups.find((g) => g.key === VERDICT.NOT_ATTEMPTED).rows).toHaveLength(1);
        });

        test("mergeSentenceWords on an empty list is an empty list", () => {
            expect(mergeSentenceWords([])).toEqual([]);
        });

        test("a cleanly-read sentence is Mastered and yields no drill rows", () => {
            // THE rule the JSX gates on: a mastered sentence is rendered but
            // silent. MASTERED means every word was conquered and none ever hit
            // the threshold, so there is no struggle to report — StudentDetails
            // hides the attempts footer AND the per-word list for these.
            const clean = [
                {
                    level: "Level 3: Barn",
                    sentence_stats: [
                        { sentence: "Crows caw.", mastery: "mastered", words: [
                            { word: "crows", mastery: "mastered", failed_attempts: 0 },
                            { word: "caw.", mastery: "mastered", failed_attempts: 0 },
                        ] },
                    ],
                },
            ];

            const { groups, counts } = groupSentences(clean);
            const row = groups.find((g) => g.key === VERDICT.MASTERED).rows[0];
            expect(counts[VERDICT.MASTERED]).toBe(1);
            // The filter StudentDetails applies — must come back empty.
            expect(mergeSentenceWords(row.words, NEEDS_ATTENTION_ATTEMPTS).filter((w) => w.failed_attempts > 0)).toHaveLength(0);
        });

        test("a sentence conquered after a couple of flubs is Mastered, not Recovered", () => {
            // Below the threshold is not a problem worth celebrating, so a word at
            // 1-2 failures reads Mastered and the sentence renders silently. This
            // is why MASTERED needs no numbers on screen.
            expect(sentenceVerdict([{ mastery: "mastered", failed_attempts: 2 }])).toBe(VERDICT.MASTERED);
            expect(sentenceVerdict([{ mastery: "mastered", failed_attempts: 3 }])).toBe(VERDICT.RECOVERED);
        });

        test("every sentence renders exactly once, and names its module", () => {
            const { groups, counts } = groupSentences(curriculum);
            expect(groups.flatMap((g) => g.rows)).toHaveLength(3);
            expect(counts[VERDICT.NEEDS_ATTENTION]).toBe(1);
            expect(counts[VERDICT.RECOVERED]).toBe(1);
            expect(groups[0].rows[0].level).toBe("Level 1: Farm");
        });

        test("the five counts partition the sentences on screen", () => {
            // The count line promises this. If a bucket is ever cut again, the
            // numbers stop summing to the total and this fails.
            const { groups, counts } = groupSentences(curriculum);
            const total = Object.values(VERDICT).reduce((n, k) => n + counts[k], 0);
            expect(total).toBe(groups.flatMap((g) => g.rows).length + 0);
            expect(groups).toHaveLength(Object.keys(VERDICT).length);
        });
    });

    // The GROUP heading is about a SENTENCE; the inline `label` is about one WORD.
    // They used to be the same string, and "Recovered" is right for a word and
    // wrong for a sentence bucket.
    //
    // Why it matters: the recovered floor EQUALS the attention floor
    // (verdict() above), so by construction a recovered sentence is one the child
    // ALREADY conquered — the count is a frozen historical peak, not current
    // work. Nothing can ever clear it: StudentController freezes failed_attempts
    // the moment a word is mastered, so re-reading it cleanly 20 more times
    // changes nothing. "Recovered" read as present tense invited exactly the
    // wrong conclusion.
    //
    // The parent email has said this correctly all along — "Recently Conquered"
    // for the section, "Recovered" for each word inside it. The page now matches.
    // The per-word label is deliberately NOT renamed: a single word genuinely is
    // recovered, and renaming it too would make a drill row read
    // "mail Recorded: 4 · Recently Conquered", a sentence's claim about a word.
    describe("group headings speak about sentences, labels about words", () => {
        // Own fixture: a sibling describe's fixture is not in scope here, and a
        // shared one would couple the two suites' shapes.
        const { groups } = groupSentences([
            {
                level: "Level 1: Farm",
                sentence_stats: [
                    { sentence: "A pig sat.", mastery: "training", words: [{ word: "pig", mastery: "training", failed_attempts: 4 }] },
                    { sentence: "Cats nap.", mastery: "mastered", words: [{ word: "cats", mastery: "mastered", failed_attempts: 4 }] },
                    { sentence: "Birds fly.", mastery: "training", words: [{ word: "birds", mastery: "unseen", failed_attempts: 0 }] },
                ],
            },
        ]);

        const titleOf = (key) => groups.find((g) => g.key === key).title;

        test("the recovered GROUP is past tense", () => {
            expect(titleOf(VERDICT.RECOVERED)).toBe("Recently Conquered");
        });

        test("the recovered WORD label stays present tense", () => {
            expect(VERDICT_META[VERDICT.RECOVERED].label).toBe("Recovered");
        });

        test.each([
            [VERDICT.NEEDS_ATTENTION, "Needs Attention"],
            [VERDICT.PRACTICING, "Practicing"],
            [VERDICT.NOT_ATTEMPTED, "Not Yet Mastered"],
            [VERDICT.MASTERED, "Mastered"],
        ])("the other four group titles are untouched — %s", (key, expected) => {
            expect(titleOf(key)).toBe(expected);
        });

        test("every group title still comes from VERDICT_META, never a literal", () => {
            // A title typed into bucketize() instead of the SSOT is how the
            // heading and the inline label drifted apart in the first place.
            const source = fs.readFileSync("resources/js/utils/masteryLabels.js", "utf8");
            expect(source).not.toMatch(/title:\s*["\']/);
        });
    });

    // REGRESSION GUARD, BOTH DIRECTIONS. Story Quest's per-word row once printed
    // raw failed_attempts as "N Attempts" while Word Blast printed an invented
    // "+1 winning try", so one word read two numbers on the same page (Word Blast
    // said 5, Story Quest said 4). Adding the +1 to Story Quest fixed THAT pair
    // and broke a different one: the parent email and the Excel both print raw
    // `failed_attempts`, so a recovered word read 4 in the email and 5 on the
    // page. The bug was never the arithmetic — it was two conventions for one
    // number. There is now ONE: raw, labelled "Recorded", no arithmetic anywhere.
    describe("the per-word attempt number is raw, in the JSX and in the twin", () => {
        const details = codeOnly(
            fs.readFileSync("resources/js/Pages/Teacher/StudentDetails.jsx", "utf8"),
        );

        test("the drill row prints failed_attempts, never an invented try", () => {
            expect(details).not.toContain("attemptsShown");
            // The +1 is what made a mastered word read 5 where the email read 4.
            expect(details).not.toMatch(/failed_attempts\s*}\s*\+\s*1/);
        });

        test("the page says Recorded, so the number is not read as a try count", () => {
            // "Attempts: 5" claims something about the child's pronunciation tries,
            // and the 5s-silence watchdog puts non-tries in that counter.
            expect(details).toContain("Recorded:");
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

        test("a MASTERED sentence renders, but with no attempts and no drill list", () => {
            // The sentence stays visible (module + text + chips) — hiding it made
            // a top student's levels vanish, which is the bug this gates. What is
            // suppressed is the NUMBER, not the sentence.
            expect(details).toContain("showAttempts");
            expect(details).toMatch(/showAttempts && problems\.length > 0/);
            expect(details).toMatch(/sentenceVerdictValue !== VERDICT\.MASTERED/);
        });

        test("the count line names all five verdicts", () => {
            // Five buckets render, so five numbers must partition the total. A
            // line that names three leaves two rendered groups unlabelled.
            for (const key of ["NEEDS_ATTENTION", "PRACTICING", "RECOVERED", "NOT_ATTEMPTED", "MASTERED"]) {
                expect(details).toContain(`sqCounts[VERDICT.${key}]`);
            }
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
