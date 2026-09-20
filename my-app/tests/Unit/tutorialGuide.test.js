import { isActionStep, nextStepIndex } from "@/Components/Student/TutorialGuide.jsx";

// ponytail: step-machine contract — tap never advances action steps; only the
// real game event (tap-mic / say-word / say-sentence-start) moves the tour.
const STEPS = [
    { id: "tour", action: "tap-continue" },
    { id: "mic", action: "tap-mic" },
    { id: "say", action: "say-word" },
    { id: "speak", action: "say-sentence-start" },
];

describe("TutorialGuide step-machine", () => {
    describe("isActionStep", () => {
        test("tap-continue steps are not action steps", () => {
            expect(isActionStep(STEPS[0])).toBe(false);
        });
        test("tap-mic / say-* steps require a real action", () => {
            expect(isActionStep(STEPS[1])).toBe(true);
            expect(isActionStep(STEPS[2])).toBe(true);
            expect(isActionStep(STEPS[3])).toBe(true);
        });
        test("missing step is not actionable", () => {
            expect(isActionStep(undefined)).toBe(false);
        });
    });

    describe("nextStepIndex", () => {
        test("tap advances tap-continue steps", () => {
            expect(nextStepIndex(STEPS, 0, "tap")).toBe(1);
        });
        test("tap does NOT advance action steps (no blind increment)", () => {
            expect(nextStepIndex(STEPS, 1, "tap")).toBe(1);
            expect(nextStepIndex(STEPS, 2, "tap")).toBe(2);
        });
        test("matching game event advances action steps", () => {
            expect(nextStepIndex(STEPS, 1, "tap-mic")).toBe(2);
            expect(nextStepIndex(STEPS, 2, "say-word")).toBe(3);
            expect(nextStepIndex(STEPS, 3, "say-sentence-start")).toBe(4);
        });
        test("wrong event leaves the step in place", () => {
            expect(nextStepIndex(STEPS, 1, "say-word")).toBe(1);
            expect(nextStepIndex(STEPS, 2, "tap-mic")).toBe(2);
        });
        test("last step returns steps.length so the page sets guideDone", () => {
            expect(nextStepIndex(STEPS, 3, "say-sentence-start")).toBe(STEPS.length);
        });
        test("unknown index is a no-op", () => {
            expect(nextStepIndex(STEPS, 99, "tap")).toBe(99);
        });
    });
});
