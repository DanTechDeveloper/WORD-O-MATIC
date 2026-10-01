import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");

// ponytail: source-lock, same pattern as wordOrder.test.js — the property
// lives in a JSX render condition, and nothing below the component can observe
// it without mounting the whole page (hook + Inertia + mic). The bug: DONE! and
// NICE TRY! are two separate mount sites, so nothing structurally stops them
// both rendering until one condition says so.
describe("tutorial end bubbles never stack", () => {
    const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");

    test("the coach bubble yields to the final DONE bubble", () => {
        // handleTimeUp (useGameplayCore.js) clears the mispronounceTimer, so
        // isMispronounced never flips back to false and coachActive outlives
        // the round. A guard missing here = both bubbles on screen at once.
        expect(readMode).toContain("coachActive && !isTutorialCompletePending && bodyUrl");
    });

    test("the cheer bubble is already inside the guide branch", () => {
        // The counterpart that was never broken — cheer lives INSIDE the
        // isTutorialCompletePending ternary, the coach never did. This asserts
        // the asymmetry so the fix does not get "simplified" back to one.
        expect(readMode).toContain("cheerActive && !coachActive && bodyUrl");
    });
});
