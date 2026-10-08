// @vitest-environment happy-dom
// ponytail: SpeakModeMainContent is the ONLY place a child ever learns whether
// the app thinks a word was right. It is also the single least-tested surface in
// the ASR path: no PHP test can see it, no vitest did, no e2e exists — a broken
// border is found only by a human playing once.
//
// So the whole file is table-driven on purpose. The component picks EXACTLY ONE
// state per word out of a 5-deep ternary chain; what matters is WHICH state, not
// what shade it paints. stateOf() below names that decision, and every case
// below asserts the name. A `border-quest/80` -> `border-quest/70` tweak is a
// design change and must not fail this file; a reordering of the ternary chain
// that lets BLUE win over GREEN is a lie told to a child and MUST.
//
// Zero mocks on purpose: the component imports only React.
import { render, screen, cleanup, act } from "@testing-library/react";
import { afterEach, beforeAll, describe, expect, test, vi } from "vitest";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";

beforeAll(() => {
    // happy-dom has a scrollIntoView, but the karaoke autoscroll is not what
    // these tests are about and a stub keeps a DOM traversal out of the way.
    Element.prototype.scrollIntoView = () => {};
});
afterEach(() => cleanup());

// ── the seven states the ternary chain can land a word in ─────────────────
//   1 correct   verdict === "correct"      GREEN
//   2 wrong     verdict === "wrong"        RED
//   3 frontier  index === currentIndex     BLUE full   (showFrontier only)
//   4 trail     inside the highlight run   BLUE faded
//   5 pulsing   index === currentIndex     no border   (pre-speech)
//   6 past      index < currentIndex       dimmed
//   7 future    index > currentIndex       very dimmed
//
// Order is load-bearing: the trail wears quest/40, the frontier quest/80, and a
// verdict beats both. Checking /40 before /80 is what keeps them apart.
const stateOf = (el) => {
    const c = el.className;
    const bordered = /\bborder-2\b/.test(c);
    if (bordered && c.includes("border-accent")) return "correct";
    if (bordered && c.includes("border-rose-500")) return "wrong";
    if (bordered && c.includes("border-quest/40")) return "trail";
    if (bordered && c.includes("border-quest/80")) return "frontier";
    if (c.includes("animate-pulse")) return "pulsing";
    if (c.includes("opacity-20")) return "past";
    if (c.includes("opacity-60")) return "future";
    return "unknown";
};

const WORDS = ["one", "two", "three", "four", "five", "six", "seven", "eight"];
const AT = 2; // currentWordIndex for every case below

// The word map is the only .font-headline-xl element, and its chips are the
// direct-child spans. The legend chips also carry border-2 but live in a
// different container, and renderWordText nests its own spans INSIDE a chip —
// so a direct-child selector is the one query that is actually exact.
const chips = (c) => [...c.container.querySelectorAll(".font-headline-xl > span")];
const states = (c) => chips(c).map(stateOf);

const live = (over = {}) =>
    render(
        <SpeakModeMainContent
            words={WORDS}
            currentIndex={AT}
            gameState="ACTIVE"
            countdownValue={3}
            {...over}
        />,
    );

// ── 1. gameState staging ──────────────────────────────────────────────────
describe("gameState decides what the stage even shows", () => {
    test("IDLE with nothing to preview is an empty stage, not a broken map", () => {
        const c = render(<SpeakModeMainContent words={WORDS} gameState="IDLE" />);
        expect(chips(c)).toHaveLength(0);
    });

    test("IDLE previews the WHOLE paragraph, neutral — karaoke takes over live", () => {
        // The read is one pass, so there is no "current sentence" to preview and
        // no frontier to point at. Every word here must be borderless: a border
        // in this stage would be a promise the live stage has not made yet.
        const c = render(
            <SpeakModeMainContent
                words={WORDS}
                gameState="IDLE"
                previewWords={WORDS}
            />,
        );
        expect(chips(c)).toHaveLength(WORDS.length);
        for (const chip of chips(c)) expect(chip.className).not.toMatch(/\bborder-2\b/);
    });

    test("COUNTDOWN is the number alone — no paragraph, so nothing to misread", () => {
        const c = render(
            <SpeakModeMainContent words={WORDS} gameState="COUNTDOWN" countdownValue={2} />,
        );
        expect(chips(c)).toHaveLength(0);
        expect(screen.getByText("2")).toBeTruthy();
    });

    test("every other state is the live karaoke map", () => {
        for (const gameState of ["ACTIVE", "GAMEOVER", "COMPLETED", "DENIED"]) {
            cleanup();
            expect(states(live({ gameState }))).toEqual([
                "past",
                "past",
                "pulsing",
                "future",
                "future",
                "future",
                "future",
                "future",
            ]);
        }
    });
});

// ── 2. the state matrix + its priority order ──────────────────────────────
describe("which state a word lands in, and which one wins", () => {
    // Each row is one round: currentWordIndex is AT throughout, so the rows
    // differ only in what the engine and the mic have reported so far.
    const CASES = [
        [
            "before any speech: the frontier pulses and paints nothing",
            {},
            ["past", "past", "pulsing", "future", "future", "future", "future", "future"],
        ],
        [
            "speech started: the frontier becomes a solid BLUE border",
            { hasSpoken: true },
            ["past", "past", "frontier", "future", "future", "future", "future", "future"],
        ],
        [
            "a resume mount shows the frontier even with no speech in this session",
            { isResume: true },
            ["past", "past", "frontier", "future", "future", "future", "future", "future"],
        ],
        [
            "interim speech lights the trail past the frontier",
            { hasSpoken: true, highlightCount: 2 },
            ["past", "past", "frontier", "trail", "future", "future", "future", "future"],
        ],
        [
            "verdicts paint their own words and leave the rest alone",
            { hasSpoken: true, verdicts: { 0: "correct", 1: "wrong" } },
            ["correct", "wrong", "frontier", "future", "future", "future", "future", "future"],
        ],
        [
            "PRIORITY: a verdict on the frontier word beats the frontier",
            { hasSpoken: true, verdicts: { 2: "correct" } },
            ["past", "past", "correct", "future", "future", "future", "future", "future"],
        ],
        [
            "PRIORITY: and so does a wrong verdict — RED is never overdrawn BLUE",
            { hasSpoken: true, verdicts: { 2: "wrong" } },
            ["past", "past", "wrong", "future", "future", "future", "future", "future"],
        ],
        [
            "a verdict wins even with no frontier at all (pre-speech mount)",
            { verdicts: { 2: "correct" } },
            ["past", "past", "correct", "future", "future", "future", "future", "future"],
        ],
        [
            "a verdict on a word already passed is NOT dimmed — it is the record",
            { hasSpoken: true, verdicts: { 0: "correct" } },
            ["correct", "past", "frontier", "future", "future", "future", "future", "future"],
        ],
    ];

    for (const [name, props, expected] of CASES) test(name, () => {
        expect(states(live(props))).toEqual(expected);
    });
});

// ── 3. activeCount: the highlight run coercion ────────────────────────────
describe("highlightCount is coerced, never trusted", () => {
    // Math.max(1, highlightCount|0 || 1). Every row below feeds a value the mic
    // or a resume record could plausibly hand over, and pins the run that comes
    // out. The trail is strictly (currentIndex, currentIndex + activeCount), so a
    // coerced 1 means NO trail at all — the floor is "the frontier alone", not
    // "the frontier plus one".
    const CASES = [
        [1, []],
        [2, [3]],
        [3, [3, 4]],
        [99, [3, 4, 5, 6, 7]], // clamped by the word count, not a crash
        [0, []], // floor -> 1
        [-5, []], // floor -> 1
        [1.9, []], // |0 truncates to 1
        [NaN, []], // || 1 catches it
        [null, []], // null|0 is 0, then || 1
        [undefined, []], // the default param
        ["3", [3, 4]], // the resume record is JSON — it arrives as a string
    ];

    for (const [highlightCount, expectedTrail] of CASES) {
        test(`${String(highlightCount)} -> trail at [${expectedTrail.join(",")}]`, () => {
            const got = states(live({ hasSpoken: true, highlightCount }));
            expect(got[AT]).toBe("frontier");
            expect(
                got.map((s, i) => (s === "trail" ? i : -1)).filter((i) => i >= 0),
            ).toEqual(expectedTrail);
        });
    }
});

// ── 4. showFrontier gates the BLUE ───────────────────────────────────────
describe("the BLUE border only exists once the frontier does", () => {
    test("no speech and no resume: the frontier pulses, borderless", () => {
        expect(stateOf(chips(live({}))[AT])).toBe("pulsing");
    });
});

// ── 5. the end-of-round overlay never erases the verdicts ────────────────
describe("the celebration covers the paragraph without deleting the record", () => {
    test("the message renders only while the break is open AND there is one", () => {
        const base = {
            words: WORDS,
            currentIndex: AT,
            gameState: "ACTIVE",
            sentenceBreak: true,
            verdicts: { 0: "correct", 1: "wrong" },
            sentenceFeedback: { message: "Excellent!" },
        };
        render(<SpeakModeMainContent {...base} />);
        expect(screen.getByText("Excellent!")).toBeTruthy();
        cleanup();

        // a break with nothing to say, and a message with no break, are both
        // silent — an empty dialog is worse than no dialog
        render(<SpeakModeMainContent {...base} sentenceFeedback={null} />);
        expect(screen.queryByText("Excellent!")).toBeNull();
        cleanup();
        render(<SpeakModeMainContent {...base} sentenceBreak={false} />);
        expect(screen.queryByText("Excellent!")).toBeNull();
    });

    test("the verdicts stay readable under the overlay — the 1000ms preview needs them", () => {
        // completeSentence() holds the modal for a second specifically so the
        // child can see what they got right and wrong. A blanked stage would
        // make that hold pointless.
        const c = render(
            <SpeakModeMainContent
                words={WORDS}
                currentIndex={AT}
                gameState="ACTIVE"
                sentenceBreak
                sentenceFeedback={{ message: "Great!" }}
                verdicts={{ 0: "correct", 1: "wrong" }}
            />,
        );
        expect(screen.getByText("Great!")).toBeTruthy();
        expect(states(c).slice(0, 2)).toEqual(["correct", "wrong"]);
    });
});

// ── 6. renderWordText: the punctuation is display-only ────────────────────
describe("sentence-final punctuation renders dim, outside the chip's colour", () => {
    const chipOf = (word) => {
        const c = render(
            <SpeakModeMainContent words={[word]} currentIndex={0} gameState="ACTIVE" hasSpoken verdicts={{ 0: "correct" }} />,
        );
        return chips(c)[0];
    };

    test("a terminator splits into its own dimmed span", () => {
        for (const [word, punctuation] of [
            ["naps.", "."],
            ["naps!", "!"],
            ["naps?", "?"],
        ]) {
            cleanup();
            const chip = chipOf(word);
            const parts = [...chip.querySelectorAll("span")];
            expect(parts).toHaveLength(2);
            expect(parts[1].textContent).toBe(punctuation);
            expect(parts[1].className).toBe("opacity-50");
            expect(parts[0].textContent).toBe("naps");
        }
    });

    test("a closing quote is NOT part of the terminator — the word stays whole", () => {
        // Ranges are cut on /[.!?][”"']?$/ (useStoryQuestEngine), which accepts a
        // closing quote, but the DISPLAY regex is /^(.*?)([.!?]+)$/ and cannot end
        // on one. So `end."` is dimmed as nothing at all. Asserted, not wished:
        // display-only (normalizeText drops the punctuation before matching), so
        // the inconsistency is cosmetic. Closing the regex to match the sentence
        // splitter is the fix if it ever stops being cosmetic.
        const chip = chipOf('said."');
        expect(chip.querySelectorAll("span")).toHaveLength(0);
        expect(chip.textContent).toBe('said."');
    });

    test("an abbreviation is split like any terminator", () => {
        const chip = chipOf("Mr.");
        const parts = [...chip.querySelectorAll("span")];
        expect(parts.map((p) => p.textContent)).toEqual(["Mr", "."]);
    });

    test("a word with no terminator is not split at all", () => {
        const chip = chipOf("naps");
        expect(chip.querySelectorAll("span")).toHaveLength(0);
        expect(chip.textContent).toBe("naps");
    });

    test("an empty or missing word renders nothing instead of throwing", () => {
        for (const word of ["", null, undefined]) {
            cleanup();
            expect(() => chipOf(word)).not.toThrow();
            expect(chipOf(word).textContent).toBe("");
        }
    });
});

// ── 7. degenerate props must not take the round down ─────────────────────
describe("a bad props object is survivable", () => {
    test("no words at all is an empty map, not a crash", () => {
        const c = render(<SpeakModeMainContent words={[]} gameState="ACTIVE" currentIndex={0} hasSpoken />);
        expect(chips(c)).toHaveLength(0);
    });

    test("an index past the end highlights nothing", () => {
        // The page clamps to totalWords-1, but the round also runs a beat with
        // currentWordIndex === totalWords before COMPLETED lands. No word may be
        // dressed as "the one you are on" when there is no such word.
        const c = render(
            <SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={99} hasSpoken highlightCount={4} />,
        );
        expect(chips(c)).toHaveLength(WORDS.length);
        expect(states(c)).not.toContain("frontier");
        expect(states(c)).not.toContain("trail");
    });

    test("a negative index paints nothing either", () => {
        const c = render(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={-1} hasSpoken />);
        expect(states(c)).not.toContain("frontier");
    });

    test("a verdict for a word that no longer exists is ignored, not fatal", () => {
        // resumeStorage can outlive a curriculum edit — the record holds a key
        // for a word the module no longer has. Reading verdicts[index] must not
        // be what brings the round down.
        const stale = { 0: "correct", 99: "wrong" };
        expect(() => render(
            <SpeakModeMainContent words={["one", "two"]} gameState="ACTIVE" currentIndex={1} hasSpoken verdicts={stale} />,
        )).not.toThrow();
    });

    test("verdicts default to empty when the prop is omitted entirely", () => {
        const c = render(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={AT} hasSpoken />);
        expect(states(c)[AT]).toBe("frontier");
    });
});

// ── 8. latency stall hint ────────────────────────────────────────────────
describe("the latency stall hint", () => {
    const stallText = () => screen.queryByText(/keep reading/i);

    test("appears after 2s of frozen frontier during a live round", () => {
        vi.useFakeTimers();
        try {
            render(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={AT} hasSpoken />);
            expect(stallText()).toBeNull();
            act(() => vi.advanceTimersByTime(1999));
            expect(stallText()).toBeNull();
            act(() => vi.advanceTimersByTime(1));
            expect(stallText()).not.toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    test("never appears before speech starts or outside ACTIVE", () => {
        vi.useFakeTimers();
        try {
            cleanup();
            render(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={AT} />);
            act(() => vi.advanceTimersByTime(3000));
            expect(stallText()).toBeNull();
            cleanup();
            render(<SpeakModeMainContent words={WORDS} gameState="COUNTDOWN" countdownValue={2} hasSpoken />);
            act(() => vi.advanceTimersByTime(3000));
            expect(stallText()).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    test("a frontier move resets the clock and hides the hint", () => {
        vi.useFakeTimers();
        try {
            const c = render(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={AT} hasSpoken />);
            act(() => vi.advanceTimersByTime(2000));
            expect(stallText()).not.toBeNull();
            c.rerender(<SpeakModeMainContent words={WORDS} gameState="ACTIVE" currentIndex={AT + 1} hasSpoken />);
            expect(stallText()).toBeNull();
            act(() => vi.advanceTimersByTime(1999));
            expect(stallText()).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });

    test("sentenceBreak suppresses it — the celebration owns the screen", () => {
        vi.useFakeTimers();
        try {
            render(
                <SpeakModeMainContent
                    words={WORDS}
                    gameState="ACTIVE"
                    currentIndex={AT}
                    hasSpoken
                    sentenceBreak
                    sentenceFeedback={{ message: "That's OK!" }}
                />,
            );
            act(() => vi.advanceTimersByTime(3000));
            expect(stallText()).toBeNull();
        } finally {
            vi.useRealTimers();
        }
    });
});
