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

const GROUP_RE = /^(Needs Attention|Practicing|Recovered|Not Yet Mastered|Mastered) \((\d+)\)$/i;
const groupHeadings = () =>
    within(sqPanel())
        .getAllByText(GROUP_RE)
        .map((el) => el.textContent.trim());

const drillRows = () => within(sqPanel()).queryAllByRole("listitem");
// gap-1.5 spaces the three spans visually, so textContent reads "AAttempts: 4".
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
        expect(panelText()).not.toMatch(/recorded failure/i);
        expect(panelText()).not.toMatch(/Attempts:/i);
        expect(drillRows()).toHaveLength(0);
    });

    test("a sentence conquered after 1-2 flubs is ALSO silent", () => {
        // Below the threshold is not a problem worth reporting, so this is
        // MASTERED too. It used to render two "Attempts" rows for a sentence
        // with nothing to drill.
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("Goats", "mastered", 2), w("graze.", "mastered", 1)])])] });
        expect(occurrences("Goats graze.")).toBe(1);
        expect(panelText()).not.toMatch(/recorded failure/i);
        expect(panelText()).not.toMatch(/Attempts:/i);
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
        expect(panelText()).not.toMatch(/Attempts:/i);
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
            "A Attempts: 4 · Needs Attention",
            "brave Attempts: 1 · Practicing",
            "crane Attempts: 2 · Practicing",
            "lands. Attempts: 7 · Needs Attention",
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
        expect(rowText(drillRows()[1])).toMatch(/^mail Attempts: 5 · Recovered$/);
    });

    test("the sentence footer sums recorded failures and never invents tries", () => {
        renderPage({ speakCurriculum: struggling() });
        expect(panelText()).toMatch(/14 recorded failures across the sentence/);
    });

    test("a single failure is pluralised correctly", () => {
        renderPage({ speakCurriculum: [paraLevel(1, [s([w("A", "training", 1), w("cat", "training", 0)])])] });
        expect(panelText()).toMatch(/1 recorded failure across the sentence/);
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
        expect(rowText(rows[0])).toMatch(/^A Attempts: 5/);
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
            "Mastered (1)", "Needs Attention (1)", "Not Yet Mastered (1)", "Practicing (1)", "Recovered (1)",
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

    test("a Recovered word shows failed+1", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "mastered", 3)])] });
        expect(flat(wbPanel())).toMatch(/ATTEMPTS: 4, Recovered/i);
    });

    test("a Needs Attention word shows its raw count", () => {
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 3)])] });
        expect(flat(wbPanel())).toMatch(/ATTEMPTS: 3, Needs Attention/i);
    });

    test("a word below the threshold gets an attempt count and NO status badge", () => {
        // Word Blast's chip is threshold-gated ON PURPOSE — the zone heading
        // already says where you stand. This is the deliberate difference from
        // the Story Quest drill list, which labels every row.
        renderPage({ readCurriculum: [wordLevel(1, [w("SUN", "training", 2)])] });
        const wb = flat(wbPanel());
        expect(wb).toMatch(/ATTEMPTS: 2/i);
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

    test("null and undefined failed_attempts never render NaN", () => {
        // Number(null) === 0 but Number(undefined) === NaN, and NaN would render
        // "Attempts: NaN" and make every comparison false.
        renderPage({ readCurriculum: [wordLevel(1, [w("CAT", "training", null), w("DOG", "mastered", undefined)])] });
        expect(document.body.textContent).not.toMatch(/NaN/);
        expect(flat(wbPanel())).toMatch(/ATTEMPTS: 0/i);
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
