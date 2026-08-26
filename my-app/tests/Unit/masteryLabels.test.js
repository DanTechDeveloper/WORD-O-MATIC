import { attentionMeta, attemptsShown, NEEDS_ATTENTION_ATTEMPTS } from "@/utils/masteryLabels.js";

const THRESHOLD = NEEDS_ATTENTION_ATTEMPTS;

describe("masteryLabels", () => {
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
        test("training under threshold shows nothing (Normal is silent)", () => {
            expect(attentionMeta({ mastery: "training", failed_attempts: 2 }, THRESHOLD)).toBeNull();
        });

        test("training at threshold is Needs Attention", () => {
            expect(attentionMeta({ mastery: "training", failed_attempts: 3 }, THRESHOLD)).toEqual({
                label: "Needs Attention",
                cls: "text-red-500",
            });
        });

        test("training above threshold is Needs Attention", () => {
            expect(attentionMeta({ mastery: "training", failed_attempts: 4 }, THRESHOLD).label).toBe(
                "Needs Attention",
            );
        });

        test("mastered under threshold shows nothing (never struggled)", () => {
            expect(attentionMeta({ mastery: "mastered", failed_attempts: 1 }, THRESHOLD)).toBeNull();
        });

        test("mastered at threshold is Recovered", () => {
            expect(attentionMeta({ mastery: "mastered", failed_attempts: 3 }, THRESHOLD)).toEqual({
                label: "Recovered",
                cls: "text-emerald-400",
            });
        });

        test("4 trains then mastered on the 5th is Recovered", () => {
            expect(attentionMeta({ mastery: "mastered", failed_attempts: 4 }, THRESHOLD).label).toBe(
                "Recovered",
            );
        });
    });
});
