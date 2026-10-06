import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");

// ponytail: source-lock, same shape as tutorialBubbleOverlap.test.js — the
// property lives in a useEffect dep array and a JSX key inside a page that
// cannot be mounted in vitest (Inertia + Deepgram + the gameplay engine).
//
// The bug: Story Quest latched the mispronounce into a ref and only drained it
// from an effect keyed on [sentenceBreak, gameState, HINTS]. A ref has no dep,
// and d3a540a removed per-sentence breaks, so sentenceBreak flipped true only
// at the paragraph end — where that effect's own guard bails. The bubble never
// appeared outside the tutorial. Both assertions below are the exact shape that
// regressed: the trigger must be a dep, and the remount must be a key.
describe("the mistake coach re-fires on every mispronunciation", () => {
    const pages = [
        ["GameplayReadMode", read("resources/js/Pages/Student/GameplayReadMode.jsx")],
        ["GameplaySpeakMode", read("resources/js/Pages/Student/GameplaySpeakMode.jsx")],
    ];

    // setCoachSeq appears exactly once per page — inside the coach trigger
    // effect — so the dep array that closes it is the one that matters.
    const BUMP = "setCoachSeq((n) => n + 1);";

    test.each(pages)("%s keys the coach effect on isMispronounced", (_name, src) => {
        const at = src.indexOf(BUMP);
        expect(at).toBeGreaterThan(-1);

        const deps = src.slice(src.indexOf("}, [", at), src.indexOf("]);", at));
        expect(deps).toContain("isMispronounced");
    });

    test.each(pages)("%s bumps a monotonic key so the bubble remounts", (_name, src) => {
        // animate-fade-in is a MOUNT animation (tailwind.config.js) and
        // setCoachActive(true) on an already-true value is a React bail-out —
        // without a changing key a repeat mispronounce repaints nothing.
        expect(src).toContain(BUMP);
        expect(src).toContain("key={coachSeq}");
    });

    test("Story Quest dropped the ref latch entirely", () => {
        // The latch's only consumer keyed on sentenceBreak, which after d3a540a
        // never returns to false mid-round — so it could never be drained.
        const [, speakMode] = pages[1];
        expect(speakMode).not.toContain("hadMispronounce");
        expect(speakMode).not.toContain("useRef");
    });
});