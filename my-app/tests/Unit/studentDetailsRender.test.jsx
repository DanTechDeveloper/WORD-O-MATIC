// @vitest-environment happy-dom
// ponytail: StudentDetails was only ever covered by SOURCE GREPS (masteryLabels)
// and two Inertia prop asserts (TeacherStudentManageTest). Every rendering rule —
// the MASTERED silence, the five-bucket partition, the drop-empty filter, the
// N/A fallbacks — was unguarded, and two of them shipped broken in a row: a cut
// to three buckets made whole levels render nothing, and a threshold-gated badge
// printed "ATTEMPTS: 1" under a red NEEDS ATTENTION heading.
//
// So this mounts the REAL component and asserts on real DOM. The layout, the
// Inertia shell and the live poll are stubbed — the logic under test is
// StudentDetails' own.
//
// NOTE ON QUERIES: a sentence renders as one <span> per word (each word gets its
// own verdict chip), so "A pig sat." is NEVER a single text node. Everything
// that reads sentence prose therefore goes through panelText()/occurrences()
// rather than getByText, and strings that legitimately appear twice ("No Word
// Blast modules yet" — one per zone) use getAllByText. Both are not optional:
// the first throws, and the second silently passes on the wrong element.
import { render, screen, within, cleanup } from "@testing-library/react";
import { afterEach, beforeEach, vi } from "vitest";

// ── the page's only external dependencies ────────────────────────────────
let pageProps = {};
let livePayload = null;

vi.mock("@inertiajs/react", () => ({
    Head: ({ children }) => <>{children}</>,
    Link: ({ children, ...rest }) => <a {...rest}>{children}</a>,
    usePage: () => ({ props: pageProps }),
}));

vi.mock("@/Layouts/Teacher/DashboardLayout", () => ({
    default: ({ children }) => <div data-testid="layout">{children}</div>,
}));

vi.mock("@/Components/Shared/LiveStatusDot", () => ({
    default: () => <div data-testid="live-dot" />,
}));

vi.mock("@/hooks/Teacher/useLiveStats", () => ({
    useLiveStats: () => ({ status: "idle", data: livePayload }),
}));

const StudentDetail = (await import("@/Pages/Teacher/StudentDetails.jsx")).default;

// ── fixtures shaped exactly like curriculumForUser() output ───────────────
const w = (word, mastery = "unseen", failed_attempts = 0) => ({ word, mastery, failed_attempts });

const wordLevel = (n, words) => ({
    level: `Level ${n}: Word ${n}`,
    title: `Word ${n}`,
    level_num: n,
    words_count: words.length,
    mastered: words.filter((x) => x.mastery === "mastered").map((x) => x.word),
    training: words.filter((x) => x.mastery === "training").map((x) => x.word),
    word_stats: words,
});

// The JSX renders `words.map(...)`, NEVER `stat.sentence` — so the rendered
// prose is the words joined by a space, and a fixture whose `sentence` string
// disagrees with its own word list renders something else entirely. Deriving it
// here makes that impossible to get wrong.
const s = (words, sentence_index = 0) => ({
    sentence: words.map((x) => x.word).join(" "),
    sentence_index,
    // Mirrors ParagraphModule::buildLevels.
    mastery: words.every((x) => x.mastery === "mastered")
        ? "mastered"
        : words.some((x) => x.mastery !== "unseen")
          ? "training"
          : "unseen",
    failed_attempts: words.reduce((n, x) => n + (Number(x.failed_attempts) || 0), 0),
    words,
    word_ids: words.map((_, i) => i + 1),
});

const paraLevel = (n, sentences) => ({
    level: `Level ${n}: Para ${n}`,
    title: `Para ${n}`,
    level_num: n,
    words_count: sentences.flatMap((s) => s.words || []).length,
    mastered: [],
    training: [],
    word_stats: [],
    sentences: sentences.map((s) => s.sentence),
    total_sentences: sentences.length,
    mastered_sentences: sentences.filter((s) => s.mastery === "mastered").length,
    sentence_stats: sentences,
});

const data = (over = {}) => ({
    id: 42,
    student_id: "2301-00042",
    name: "Edge Casey",
    latestBadge: null,
    student: {
        section: "Sector 7-G",
        avatar: null,
        points: 1200,
        wordBlastAcc: 80,
        storyQuestAcc: 60,
        finalAverage: 70,
        status: "in_progress",
        read_level: 3,
        speak_level: 2,
    },
    readCurriculum: [],
    speakCurriculum: [],
    ...over,
});

const renderPage = (over) => render(<StudentDetail data={data(over)} />);

// ── panel scoping ────────────────────────────────────────────────────────
// Both sections are <div class="mb-12">; the h2 is the only reliable handle.
const sectionOf = (name) => {
    const h = screen.getAllByRole("heading", { level: 2 }).find((x) => new RegExp(name, "i").test(x.textContent));
    return h.closest(".mb-12");
};
const sqPanel = () => sectionOf("Story Quest");
const wbPanel = () => sectionOf("Word Blast");

const flat = (el) => el.textContent.replace(/\s+/g, " ");
const panelText = () => flat(sqPanel());

// Counts how many times a phrase appears in the panel's rendered text. The
// sentence text is split per word, so this is the only way to prove a sentence
// rendered EXACTLY once (not zero, not twice).
const occurrences = (needle, panel = sqPanel()) => {
    const t = flat(panel);
    let n = 0;
    let i = t.indexOf(needle);
    while (i !== -1) {
        n++;
        i = t.indexOf(needle, i + needle.length);
    }
    return n;
};

const GROUP_RE = /^(Needs Attention|Practicing|Recently Conquered|Recovered|Not Yet Mastered|Mastered) \((\d+)\)$/i;
const groupHeadings = () =>
    within(sqPanel())
        .getAllByText(GROUP_RE)
        .map((el) => el.textContent.trim());

const drillRows = () => within(sqPanel()).queryAllByRole("listitem");
// gap-1.5 spaces the three spans visually, so textContent reads "ARecorded: 4".
// Join the children so a failure message is legible.
const rowText = (r) => Array.from(r.children).map(flat).join(" ");

beforeEach(() => {
    pageProps = { teacher: { attention_threshold: 3 }, auth: {} };
    livePayload = null;
});

afterEach(() => {
    cleanup();
    vi.clearAllMocks();
});

// ═══════════════════════════════════════════════════════════════════════════
describe("Story Quest — a mastered sentence is visible but silent", () => {
    const mastered = (words) => [paraLevel(1, [s(words)])];

    test("the sentence text and its module still render", () => {
        renderPage({ speakCurriculum: mastered([w("Milo", "mastered", 0), w("frog.", "mastered", 0)]) });
        expect(occurrences("Milo frog.")).toBe(1);
        expect(occurrences("Level 1: Para 1")).toBe(1);
    });

    test("but it claims no attempts, no per-word rows and no footer", () => {
        renderPage({ speakCurriculum: mastered([w("Milo", "mastered", 0), w("frog.", "mastered", 0)]) });
        expect(panelText()).not.toMatch(/recorded attempt/i);
        expect(panelText()).not.toMatch(/Recorded:/i);
        expect(drillRows()).toHaveLength(0);
    });

    test("a sentence conquered after 1-2 flubs is ALSO silent", () => {
        // Below the threshold is not a problem worth reporting, so this is
        // MASTERED too. It used to render two "Attempts" rows for a sentence
        // with nothing to drill.
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("Goats", "mastered", 2), w("graze.", "mastered", 1)])])] });
        expect(occurrences("Goats graze.")).toBe(1);
        expect(panelText()).not.toMatch(/recorded attempt/i);
        expect(panelText()).not.toMatch(/Recorded:/i);
    });

    test("a fully-mastered student still sees EVERY level and sentence", () => {
        // THE regression. Ten levels, every word mastered. While the buckets were
        // cut to three this produced an empty panel.
        const levels = Array.from({ length: 10 }, (_, i) =>
            paraLevel(i + 1, [
                s([w("Milo", "mastered", 0), w("reads", "mastered", 0), w("line", "mastered", 0), w(`${i}.`, "mastered", 0)], 0),
                s([w("Milo", "mastered", 0), w("holds", "mastered", 0), w("word", "mastered", 0)], 1),
            ]),
        );
        renderPage({ speakCurriculum: levels });

        expect(groupHeadings()).toEqual(["Mastered (20)"]);
        for (let i = 0; i < 10; i++) {
            expect(occurrences(`Milo reads line ${i}.`)).toBe(1);
            // Both sentences in the level name it, which is why a teacher can
            // tell which module a sentence came from.
            expect(occurrences(`Level ${i + 1}: Para ${i + 1}`)).toBe(2);
        }
        expect(panelText()).not.toMatch(/Recorded:/i);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("Story Quest — a sentence that needs work shows ATTEMPT + STATUS", () => {
    const struggling = () => [
        paraLevel(4, [s([
            w("A", "training", 4),
            w("brave", "training", 1),
            w("crane", "training", 2),
            w("lands.", "training", 7),
        ])]),
    ];

    test("every word gets an attempt count and a status", () => {
        renderPage({ speakCurriculum: struggling() });
        // textContent keeps the authored case — `uppercase` is a CSS transform,
        // so these are NOT the strings a screen-reader user hears either.
        expect(drillRows().map(rowText)).toEqual([
            "A Recorded: 4 · Needs Attention",
            "brave Recorded: 1 · Practicing",
            "crane Recorded: 2 · Practicing",
            "lands. Recorded: 7 · Needs Attention",
        ]);
    });

    test("a mastered word in a hard sentence gets failed+1, not the raw count", () => {
        // The original cross-panel bug: Word Blast said 5, Story Quest said 4.
        renderPage({
            speakCurriculum: [paraLevel(1, [s([
                w("The", "training", 5),
                w("mail", "mastered", 4),
                w("lands.", "training", 1),
            ])])],
        });
        expect(rowText(drillRows()[1])).toMatch(/^mail Recorded: 4 · Recovered$/);
    });

    test("the sentence footer sums recorded attempts and never invents tries", () => {
        renderPage({ speakCurriculum: struggling() });
        expect(panelText()).toMatch(/14 recorded attempts across the sentence/);
    });

    test("a single failure is pluralised correctly", () => {
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("A", "training", 1), w("cat", "training", 0)])])] });
        expect(panelText()).toMatch(/1 recorded attempt across the sentence/);
    });

    test("one hard word flags the sentence; five easy words do not", () => {
        // The summed-miss false positive the word-level view exists to remove:
        // 1+1+1+1+1 = 5 clears the threshold, but no single word is a problem.
        renderPage({
            speakCurriculum: [paraLevel(1, [s([
                w("A", "training", 1), w("b", "training", 1), w("c", "training", 1), w("d", "training", 1), w("e.", "training", 1),
            ])])],
        });
        expect(groupHeadings()).toEqual(["Practicing (1)"]);
    });

    test("a repeated word merges into ONE drill row but keeps both sentence chips", () => {
        // "a … a" — the drill list is merged (attempts summed), the sentence
        // text is positional, because that is what the child actually read.
        renderPage({
            speakCurriculum: [paraLevel(1, [s([
                w("A", "training", 3),
                w("cat", "training", 1),
                w("and", "training", 0),
                w("a", "training", 2),
                w("dog.", "training", 0),
            ])])],
        });
        const rows = drillRows();
        expect(rows).toHaveLength(2); // A (3+2=5) and cat — and/dog had no failures
        expect(rowText(rows[0])).toMatch(/^A Recorded: 5/);
        // Two chips in the prose (one "A", one "a" — positional, the case is
        // what the child read) but ONE merged drill row keyed on the first
        // spelling. So "A" appears twice: its chip plus the merged row.
        expect(within(sqPanel()).getAllByText("A")).toHaveLength(2);
        expect(within(sqPanel()).getAllByText("a")).toHaveLength(1);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("Story Quest — grouping invariants", () => {
    const mixed = () => [
        paraLevel(1, [
            s([w("pig", "training", 4)], 0), // needsAttention
            s([w("goats", "training", 1)], 1), // practicing
            s([w("cats", "mastered", 4)], 2), // recovered
            s([w("birds", "unseen", 0)], 3), // notAttempted
            s([w("crows", "mastered", 0)], 4), // mastered
        ]),
    ];

    test("five states produce five groups, each labelled with its own count", () => {
        renderPage({ speakCurriculum: mixed() });
        expect(groupHeadings().sort()).toEqual([
            "Mastered (1)", "Needs Attention (1)", "Not Yet Mastered (1)", "Practicing (1)", "Recently Conquered (1)",
        ]);
    });

    test("a heading with zero rows never renders", () => {
        // A brand-new student must not open onto dead "(0)" headings.
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("A", "unseen", 0), w("crab", "unseen", 0)])])] });
        expect(groupHeadings()).toEqual(["Not Yet Mastered (1)"]);
        expect(occurrences("(0)")).toBe(0);
    });

    test("every sentence renders exactly once — none duplicated, none lost", () => {
        renderPage({ speakCurriculum: mixed() });
        // A word with history shows up twice on screen (chip + drill row), so
        // counting words proves nothing. The heading counts are the real
        // invariant: a duplicate inflates the sum, a loss deflates it.
        const rendered = groupHeadings().reduce((n, h) => n + Number(h.match(/\((\d+)\)/)[1]), 0);
        expect(rendered).toBe(5);
    });

    test("the count line partitions the total across all five verdicts", () => {
        renderPage({ speakCurriculum: mixed() });
        const line = flat(within(sqPanel()).getByText(/sentences total/i));
        const nums = [...line.matchAll(/(\d+) (?:sentences|need attention|practicing|recovered|not attempted|mastered)/gi)].map((m) => Number(m[1]));
        expect(nums[0]).toBe(5);
        expect(nums.slice(1).reduce((a, b) => a + b, 0)).toBe(5);
    });

    test("an untouched sentence says 'Not attempted yet' and lists no words", () => {
        renderPage({ speakCurriculum: mixed() });
        expect(panelText()).toMatch(/Not attempted yet/);
        expect(drillRows()).toHaveLength(3); // only the three sentences with history
    });

    test("the count line vanishes when there is nothing to count", () => {
        renderPage({ speakCurriculum: [paraLevel(1, [])] });
        expect(screen.queryByText(/sentences total/i)).toBeNull();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("Word Blast — zones", () => {
    test("mastered and training words land in their own zones, unseen in neither", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 3), w("SUN", "training", 7), w("HAT", "training", 0), w("BAT", "unseen", 0)])] });
        const wb = flat(wbPanel());
        expect(wb).toMatch(/Mastery Zone/);
        expect(wb).toMatch(/Training Zone/);
        expect(wb).toMatch(/CAT/);
        expect(wb).toMatch(/SUN/);
        expect(wb).not.toMatch(/\bBAT\b/); // unseen belongs to neither zone
    });

    test("a Recovered word shows its raw recorded count", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 3)])] });
        expect(flat(wbPanel())).toMatch(/RECORDED: 3, Recovered/i);
    });

    test("a Needs Attention word shows its raw count", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 3)])] });
        expect(flat(wbPanel())).toMatch(/RECORDED: 3, Needs Attention/i);
    });

    test("a word below the threshold gets an attempt count and NO status badge", () => {
        // Word Blast's chip is threshold-gated ON PURPOSE — the zone heading
        // already says where you stand. This is the deliberate difference from
        // the Story Quest drill list, which labels every row.
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 2)])] });
        const wb = flat(wbPanel());
        expect(wb).toMatch(/RECORDED: 2/i);
        expect(wb).not.toMatch(/Needs Attention/);
        expect(wb).not.toMatch(/Recovered/);
    });

    test("empty zones explain themselves instead of showing a blank box", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 0)])] });
        expect(flat(wbPanel())).toMatch(/No words in training/);
        expect(flat(wbPanel())).not.toMatch(/No words mastered yet/);
    });

    test("both zones empty shows both explanations", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("BAT", "unseen", 0)])] });
        expect(flat(wbPanel())).toMatch(/No words mastered yet/);
        expect(flat(wbPanel())).toMatch(/No words in training/);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("empty and malformed payloads must not crash", () => {
    test("no modules at all", () => {
        expect(() => renderPage()).not.toThrow();
        // Both zones print the same copy, so this is genuinely two matches.
        expect(screen.getAllByText(/No Word Blast modules yet/i)).toHaveLength(2);
        expect(within(sqPanel()).getByText(/No Story Quest modules yet/i)).toBeTruthy();
    });

    test("Word Blast present, Story Quest absent", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 0)])] });
        expect(within(sqPanel()).getByText(/No Story Quest modules yet/i)).toBeTruthy();
        expect(screen.queryByText(/sentences total/i)).toBeNull();
    });

    test("a level with null sentence_stats", () => {
        expect(() => renderPage({ speakCurriculum: [{ level: "Level 1: Empty", sentence_stats: null }] })).not.toThrow();
    });

    test("a sentence with a missing words array", () => {
        expect(() => renderPage({ speakCurriculum: [paraLevel(1, [w("Ghost.", "training", 3)])] })).not.toThrow();
        // The prose is the WORDS, so with no words the block is empty and the
        // `sentence` string never appears. It must still name its module.
        expect(occurrences("Ghost.")).toBe(0);
        expect(occurrences("Level 1: Para 1")).toBe(1);
    });

    test("a sentence with an empty words array", () => {
        expect(() => renderPage({ speakCurriculum: [paraLevel(1, [s([])])] })).not.toThrow();
    });

    // ↑ That test rendered s([]) and asserted nothing about the verdict. THE
    // hole: sentenceVerdict([]) maps to an empty verdicts array, so no
    // includes() branch fires and it falls through to MASTERED. A sentence with
    // no words in it was therefore reported as "conquered on the first try" and
    // — because the JSX gates showAttempts on !== MASTERED — rendered SILENT,
    // with no attempts line and no drill list to hint that nothing happened.
    test("a sentence with an empty words array is Not Yet Mastered, not silent Mastered", () => {
        renderPage({ speakCurriculum: [paraLevel(1, [s([])])] });

        expect(groupHeadings()).toEqual(["Not Yet Mastered (1)"]);
        expect(panelText()).toMatch(/Not attempted yet/);
        // The sentence still names its module, and no drill row is invented.
        expect(occurrences("Level 1: Para 1")).toBe(1);
        expect(drillRows()).toHaveLength(0);
        expect(panelText()).not.toMatch(/Recorded:/i);
    });

    test("null and undefined failed_attempts never render NaN", () => {
        // Number(null) === 0 but Number(undefined) === NaN, and NaN would render
        // "Recorded: NaN" and make every comparison false. Both collapse to the
        // same bare chip a real zero produces — see the Word Blast matrix.
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "training", null), w("DOG", "mastered", undefined)])] });
        expect(document.body.textContent).not.toMatch(/NaN/);
    });

    test("a level with zero words does not divide by zero", () => {
        renderPage({ readCurriculum: [wordLevel(1, [])], speakCurriculum: [paraLevel(1, [])] });
        expect(screen.getAllByText("0% Complete")).toHaveLength(2);
        expect(document.body.textContent).not.toMatch(/NaN%|Infinity%/);
    });

    test("an unknown status falls back to Not Started", () => {
        renderPage({ student: { ...data().student, status: "banana" } });
        expect(screen.getAllByText("Not Started").length).toBeGreaterThanOrEqual(1);
    });

    test("a missing student object does not crash the header", () => {
        expect(() => renderPage({ student: null })).not.toThrow();
        expect(screen.getByRole("heading", { name: /Edge Casey/i })).toBeTruthy();
    });

    test("zero accuracies render N/A, not 0%", () => {
        // `src.student?.wordBlastAcc ? ... : "N/A"` — 0 is falsy, so a genuine
        // 0% accuracy is reported as N/A. Locked so a refactor cannot silently
        // change which of the two a teacher sees for a 0% student.
        renderPage({ student: { ...data().student, wordBlastAcc: 0, storyQuestAcc: 0, finalAverage: 0 } });
        expect(screen.getAllByText("N/A").length).toBeGreaterThanOrEqual(3);
    });

    test("a very long name and sentence do not break the tree", () => {
        const long = "Bartholomew-Montgomery Featherstonehaugh III";
        expect(() => renderPage({
            name: long,
            speakCurriculum: [paraLevel(1, [s([w(long, "training", 5)])])],
        })).not.toThrow();
        expect(occurrences("Needs Attention")).toBeGreaterThan(0);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("threshold is honoured end to end", () => {
    test("at threshold flags, one below does not", () => {
        for (const fails of [2, 3, 4]) {
            cleanup();
            renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", fails)])] });
            expect(flat(wbPanel())).toMatch(fails >= 3 ? /Needs Attention/ : /^(?!.*Needs Attention).*$/s);
        }
    });

    test("a teacher's custom threshold drives the same rule", () => {
        pageProps.teacher.attention_threshold = 5;
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 4)])] });
        expect(flat(wbPanel())).not.toMatch(/Needs Attention/);
    });

    test("a missing threshold prop falls back to 3", () => {
        pageProps = { teacher: {}, auth: {} };
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 3)])] });
        expect(flat(wbPanel())).toMatch(/Needs Attention/);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
describe("live poll", () => {
    test("a live payload replaces the rendered curriculum wholesale", () => {
        livePayload = { speakCurriculum: [paraLevel(9, [s([w("Live", "training", 9)])])] };
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("Stale", "unseen", 0)])])] });
        // "Live" is a flagged word, so it appears as a chip AND a drill row.
        // The module label is per-sentence, so count that.
        expect(occurrences("Level 9: Para 9")).toBe(1);
        expect(occurrences("Level 1: Para 1")).toBe(0);
        expect(occurrences("Stale")).toBe(0);
    });

    test("a partial live payload keeps the untouched keys from show()", () => {
        livePayload = { latestBadge: { name: "Streak Star", icon: "emoji_events" } };
        renderPage();
        expect(screen.getByText("Streak Star")).toBeTruthy();
        expect(within(sqPanel()).getByText(/No Story Quest modules yet/i)).toBeTruthy();
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// "Recovered" is right for a word and wrong for a sentence bucket.
//
// The recovered floor equals the attention floor, so a recovered sentence is one
// the child ALREADY conquered, and StudentController freezes failed_attempts the
// instant a word is mastered — re-reading it cleanly 20 more times changes
// nothing. "Recovered" as a group heading read as present tense and invited the
// exact wrong conclusion ("this needs work now"). The parent email has always
// said it correctly: "Recently Conquered" for the section, "Recovered" for each
// word inside.
//
// So the rename is SCOPED. Every assertion below pins a place that must NOT
// change, because a global rename of VERDICT_META[RECOVERED].label would rewrite
// the per-word drill row, the sentence footer and the Word Blast chip badge too.
describe("Story Quest — the recovered GROUP is past tense, its words are not", () => {
    const oneRecovered = () => [
        paraLevel(1, [s([
            w("The", "mastered", 0),
            w("mail", "mastered", 4),
            w("lands.", "mastered", 1),
        ])]),
    ];

    test("the group heading says Recently Conquered", () => {
        renderPage({ speakCurriculum: oneRecovered() });
        expect(groupHeadings()).toEqual(["Recently Conquered (1)"]);
    });

    test("and carries a subtext saying it is history, not current work", () => {
        renderPage({ speakCurriculum: oneRecovered() });
        expect(panelText()).toMatch(/no longer holding/i);
    });

    test("the per-word drill row still says Recovered", () => {
        renderPage({ speakCurriculum: oneRecovered() });
        // The exact row text is the assertion. Checking the whole panel for
        // /Recently Conquered/ would be wrong — the group heading legitimately
        // says it now; only the ROW must not.
        expect(drillRows().map(rowText)).toEqual([
            "mail Recorded: 4 · Recovered",
            "lands. Recorded: 1 · Mastered",
        ]);
    });

    test("the sentence footer still says Recovered", () => {
        renderPage({ speakCurriculum: oneRecovered() });
        // \s* not " ": the separator is `ml-1`, a CSS margin, so textContent has
        // no space before the middot.
        expect(panelText()).toMatch(/5 recorded attempts across the sentence\s*· Recovered/);
    });

    test("the Word Blast chip badge still says Recovered", () => {
        // attentionMeta is a WORD-level surface, so it keeps the word label.
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 3)])] });
        const chip = flat(wbPanel());
        expect(chip).toMatch(/RECORDED: 3, Recovered/i);
        expect(chip).not.toMatch(/Recently Conquered/i);
    });

    test("the other four group headings are untouched", () => {
        renderPage({
            speakCurriculum: [paraLevel(1, [
                s([w("pig", "training", 4)], 0), // needsAttention
                s([w("goats", "training", 1)], 1), // practicing
                s([w("birds", "unseen", 0)], 2), // notAttempted
                s([w("crows", "mastered", 0)], 3), // mastered
            ])],
        });
        expect(groupHeadings().sort()).toEqual([
            "Mastered (1)", "Needs Attention (1)", "Not Yet Mastered (1)", "Practicing (1)",
        ]);
        expect(panelText()).not.toMatch(/Recently/i);
    });

    test("the count line keeps the short form so it still reads as a tally", () => {
        renderPage({ speakCurriculum: oneRecovered() });
        // "2 recently conquered" is not a tally any teacher would write; the
        // summary line stays "N recovered" and the heading carries the tense.
        expect(panelText()).toMatch(/· 1 recovered/);
    });
});

//
// The parent email prints a word's `failed_attempts` raw and calls them
// "recorded attempts". The teacher page used to print `failed_attempts + 1` for
// every MASTERED word, so a recovered word read "4 recorded attempts to conquer"
// in the email and "Attempts: 5" on the page — and the parent and the teacher
// were quoting different numbers for the same word.
//
// The +1 was never real anyway: the 5s-silence watchdog increments
// failed_attempts on pure silence, so a word the child stalled on and never
// tried contributes a "failure" that was not a pronunciation attempt. Adding 1
// to invent a winning try reports tries that never happened.
//
// Pinned as a full (mastery × failed) matrix because the divergence was never
// about arithmetic being wrong — it was two conventions, and each was internally
// consistent. The matrix is what makes the third convention impossible to add.
describe("the attempt number is raw on every surface", () => {
    const wbChip = (mastery, failed) => {
        cleanup();
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", mastery, failed)])] });
        return flat(wbPanel());
    };

    // EVERY state a Word Blast word can be in, and exactly what it renders.
    //
    // The contested cell is mastered / 0. A bare chip is the right answer for it
    // — "Recorded: 0" repeated across every clean word is a wall of noise that
    // says nothing per chip — so the convention is taught ONCE by the legend
    // below the zone headings rather than stamped on every chip. The legend is
    // what removes the "was this word even recorded?" ambiguity that a bare chip
    // leaves on its own.
    describe("Word Blast — every state of a word, and what it renders", () => {
        const chip = (mastery, failed_attempts) => {
            cleanup();
            renderPage({ readCurriculum: [wordLevel(1, [w("SWIM", mastery, failed_attempts)])] });
            return flat(wbPanel());
        };

        // ── the boundary: post-tutorial, and words never reached ──
        //
        // The tutorial writes NO mastery rows — both gameplay modes gate the POST
        // on `!isTutorialModule`, and the tutorial module owns its own `words`
        // rows (CurriculumSeeder), so nothing carries over. A word therefore sits
        // at `unseen` with no row, and unseen belongs to NEITHER zone.
        test("a word never reached renders in neither zone", () => {
            const panel = chip("unseen", 0);
            expect(panel).not.toMatch(/SWIM/);
            expect(panel).toMatch(/No words mastered yet/i);
            expect(panel).toMatch(/No words in training/i);
        });

        test("a brand-new student sees both explanations and no chips", () => {
            // The exact post-tutorial state: every word unseen.
            renderPage({
                readCurriculum: [wordLevel(1, [w("SWIM", "unseen", 0), w("HAT", "unseen", 0), w("BAT", "unseen", 0)])],
            });
            const panel = flat(wbPanel());
            expect(panel).not.toMatch(/SWIM|HAT|BAT/);
            expect(panel).toMatch(/No words mastered yet/i);
            expect(panel).toMatch(/No words in training/i);
        });

        // ── the full (mastery x failed) matrix ──
        test.each([
            // clean → bare chip, no count, no badge
            ["mastered", 0],
            ["training", 0],
        ])("%s / %d renders a BARE chip", (mastery, failed) => {
            const panel = chip(mastery, failed);
            expect(panel).toMatch(/SWIM/);
            expect(panel).not.toMatch(/RECORDED:/i);
            expect(panel).not.toMatch(/ATTEMPTS:/i);
        });

        test.each([
            // below the floor → a count, no badge
            ["mastered", 1], ["mastered", 2],
            ["training", 1], ["training", 2],
        ])("%s / %d shows the count and no status", (mastery, failed) => {
            const panel = chip(mastery, failed);
            expect(panel).toContain(`Recorded: ${failed}`);
            expect(panel).not.toContain(`Recorded: ${failed + 1}`);
            expect(panel).not.toMatch(/Needs Attention|Recovered/);
        });

        test.each([
            ["mastered", 3, "Recovered"],
            ["mastered", 4, "Recovered"],
            ["mastered", 9, "Recovered"],
            ["training", 3, "Needs Attention"],
            ["training", 5, "Needs Attention"],
            ["training", 9, "Needs Attention"],
        ])("%s / %d shows the count and the %s badge", (mastery, failed, badge) => {
            const panel = chip(mastery, failed);
            expect(panel).toContain(`Recorded: ${failed}`);
            expect(panel).toContain(badge);
        });

        test("null and undefined counters are CLEAN, not NaN and not a count", () => {
            // Number(null) is 0 but Number(undefined) is NaN. NaN would render
            // "Recorded: NaN" and make every comparison false; both must collapse
            // to the same bare chip a real zero produces.
            renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", null), w("DOG", "training", undefined)])] });
            const panel = flat(wbPanel());
            expect(panel).not.toMatch(/NaN/);
            expect(panel).not.toMatch(/RECORDED:/i);
            expect(panel).toMatch(/CAT/);
            expect(panel).toMatch(/DOG/);
        });

        // THE legend. Without it, a bare chip next to "HAT Recorded: 1" reads as
        // "SWIM was never recorded" — which is the opposite of the truth, since
        // mastery is only ever written by a real correct read
        // (StudentController:330, sole caller onWordRecognized). One line teaches
        // the convention; stamping it on every chip would not.
        test("the legend states that a bare chip was read clean", () => {
            renderPage({ readCurriculum: [wordLevel(1, [w("SWIM", "mastered", 0)])] });
            const legend = flat(wbPanel());
            expect(legend).toMatch(/no count/i);
            expect(legend).toMatch(/read clean/i);
            expect(legend).toMatch(/recorded failures/i);
        });

        test("the legend shows even when both zones are empty", () => {
            // A brand-new student's only guidance should be the convention, not a
            // bare "no words yet" — and the tutorial is exactly that student.
            renderPage({ readCurriculum: [wordLevel(1, [])] });
            expect(flat(wbPanel())).toMatch(/read clean/i);
        });
    });

    // Story Quest drill row, one row per word with history.
    test.each([
        ["mastered", 3, 3], ["mastered", 4, 4], ["mastered", 7, 7],
        ["training", 2, 2], ["training", 3, 3], ["training", 9, 9],
    ])("Story Quest drill row — %s / %d prints %d, never more", (mastery, failed, expected) => {
        cleanup();
        renderPage({
            speakCurriculum: [paraLevel(1, [s([
                w("The", "mastered", 0),
                w("cat", "training", 1),
                w("hard", mastery, failed),
            ])])],
        });
        const row = drillRows().find((r) => flat(r).startsWith("hard"));
        expect(row).toBeTruthy();
        expect(rowText(row)).toBe(`hard Recorded: ${expected} · ${rowText(row).split("· ")[1]}`);
        expect(rowText(row)).not.toContain(`Recorded: ${failed + 1}`);
    });

    test("a first-try read prints no DRILL ROW — that list is a work list", () => {
        // The Story Quest drill list is the one place 0 stays hidden, and the
        // asymmetry is deliberate rather than an oversight: that list answers
        // "which words held this sentence back", so a word that held nothing back
        // correctly has no row. The Word Blast chip is a stat display, so it
        // shows every value. Same number, two surfaces with two questions.
        cleanup();
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("The", "training", 1), w("crab", "mastered", 0)])])] });
        expect(drillRows()).toHaveLength(1);
        expect(rowText(drillRows()[0])).toMatch(/^The Recorded: 1/);
        expect(panelText()).not.toMatch(/crab Recorded/i);
    });

    test("a recovered word's footer and drill row agree with each other", () => {
        // Footer sums the words' recorded failures; a drill row IS one word. With
        // no +1 on either side the row can no longer exceed the sentence total it
        // sits under — the confusion the two-unit split used to cause.
        renderPage({
            speakCurriculum: [paraLevel(1, [s([
                w("The", "mastered", 0),
                w("mail", "mastered", 4),
                w("lands.", "mastered", 1),
            ])])],
        });
        expect(panelText()).toMatch(/5 recorded attempts across the sentence/);
        expect(drillRows().map(rowText)).toEqual([
            "mail Recorded: 4 · Recovered",
            "lands. Recorded: 1 · Mastered",
        ]);
        // 4 + 1 = 5, the footer. Every drill number is a term in the sentence sum.
        expect(drillRows().reduce((n, r) => n + Number(flat(r).match(/Recorded: (\d+)/)[1]), 0)).toBe(5);
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// THE D-B CHARACTERIZATION. Two different numbers that USED to share one word,
// "Mastered", on one page — from two different rules:
//
//   header   "20 of 20 Sentences Conquered" + "100% Complete"
//            ← mastered_sentences, the SERVER rule: every word mastered
//   panel    "2 recovered · 18 mastered"
//            ← sqCounts[MASTERED], the JS rule: conquered AND never struggled
//
// The delta is exactly the number of RECOVERED sentences. A teacher reading the
// page top-down saw 20 "Mastered", then 18. Fixed by relabelling the header
// (StudentDetails:275) — the two rules are both correct, they just answer
// different questions, and the Wording was the bug. The invariant asserted here
// is the one that must survive any future change: the header number equals the
// panel's Mastered + Recovered, never the panel's Mastered alone.
describe("Story Quest — the header counts conquered, the panel splits it", () => {
    const withRecovered = () => {
        const sentences = [];
        for (let i = 0; i < 18; i++) {
            sentences.push(s([w(`word${i}`, "mastered", 0), w(`goes${i}`, "mastered", 0)]));
        }
        sentences.push(s([w("mail", "mastered", 4), w("ships.", "mastered", 1)])); // recovered
        sentences.push(s([w("crane", "mastered", 3), w("lands.", "mastered", 0)])); // recovered
        return [paraLevel(1, sentences)];
    };

    test("the header counts the recovered sentences too, and says so", () => {
        renderPage({ speakCurriculum: withRecovered() });
        // mastered_sentences = 20 of 20, because every word in every sentence
        // reached 'mastered' — the server's rule, feeding this line and the
        // progress bar. "Conquered" is the honest label: history allowed.
        expect(document.body.textContent).toMatch(/20 of 20 Sentences Conquered/);
        expect(document.body.textContent).not.toMatch(/Sentences Mastered/);
        expect(screen.getByText("100% Complete")).toBeTruthy();
    });

    test("the panel splits the same 20 into 18 mastered and 2 recovered", () => {
        renderPage({ speakCurriculum: withRecovered() });
        expect(groupHeadings().sort()).toEqual(["Mastered (18)", "Recently Conquered (2)"]);
        expect(panelText()).toMatch(/20 sentences total · 0 need attention · 0 practicing · 2 recovered/);
    });

    test("the header equals Mastered + Recovered, never Mastered alone", () => {
        renderPage({ speakCurriculum: withRecovered() });

        const headerNumber = Number(flat(document.body).match(/(\d+) of \d+ Sentences Conquered/)[1]);
        const panelNumber = Number(groupHeadings().find((h) => h.startsWith("Mastered")).match(/\((\d+)\)/)[1]);
        const recovered = Number(groupHeadings().find((h) => h.startsWith("Recently")).match(/\((\d+)\)/)[1]);

        expect(recovered).toBeGreaterThan(0);
        expect(headerNumber).toBe(panelNumber + recovered);
        // The regression this guards: header tracking the panel's Mastered count
        // instead of the conquered total would silently hide recovered history.
        expect(headerNumber).not.toBe(panelNumber);
    });

    test("Word Blast keeps 'Words Mastered' — its zones have no recovered split", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 3)])] });
        expect(document.body.textContent).toMatch(/1 of 1 Words Mastered/);
    });
});
