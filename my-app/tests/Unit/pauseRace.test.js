// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useGameplayCore } from "@/hooks/Student/useGameplayCore";
import { markReachable } from "@/utils/connection";
import { writeResumeSession } from "@/utils/resumeStorage";
import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");

const routerMock = vi.hoisted(() => ({ post: vi.fn() }));
const soundsMock = vi.hoisted(() => ({
    playSuccessSound: vi.fn(),
    playFeedbackSound: vi.fn(),
    playMispronounceSound: vi.fn(),
}));
vi.mock("@inertiajs/react", () => ({ router: routerMock }));
vi.mock("@/utils/sounds", () => soundsMock);

const WORDS = [
    { id: 1, word: "apple" },
    { id: 2, word: "banana" },
    { id: 3, word: "puppy" },
    { id: 4, word: "kitten" },
    { id: 5, word: "hamster" },
];

const MID_ROUND = {
    moduleId: 7,
    currentWordIndex: 3,
    wordsSmashed: 3,
    currentStreak: 2,
    maxStreak: 4,
    timeLeft: 12,
    savedAt: Date.now(),
};

function mountMidRound() {
    return renderHook(() =>
        useGameplayCore({
            words: WORDS,
            totalWords: WORDS.length,
            moduleId: 7,
            saveEndpoint: "/student/saveWordProgress",
            resumeData: MID_ROUND,
        }),
    );
}

describe("pause-during-blast race (useGameplayCore)", () => {
    beforeEach(() => {
        routerMock.post.mockClear();
        markReachable();
    });

    test("blast then pause mid-animation: no advance, not exploding", () => {
        vi.useFakeTimers();
        const { result } = mountMidRound();
        act(() => result.current.handleWordRecognized(1));
        expect(result.current.isExploding).toBe(true);
        act(() => result.current.setGameState("PAUSED"));
        expect(result.current.isExploding).toBe(false);
        expect(result.current.currentWordIndex).toBe(3);
        vi.useRealTimers();
    });

    test("resume completes the pending advance exactly once", () => {
        vi.useFakeTimers();
        const { result } = mountMidRound();
        act(() => result.current.handleWordRecognized(1));
        act(() => result.current.setGameState("PAUSED"));
        act(() => result.current.setGameState("COUNTDOWN"));
        act(() => result.current.setGameState("ACTIVE"));
        act(() => {});
        expect(result.current.currentWordIndex).toBe(4);
        expect(result.current.isExploding).toBe(false);
        // second resume/ACTIVE must not advance again
        act(() => result.current.setGameState("PAUSED"));
        act(() => result.current.setGameState("COUNTDOWN"));
        act(() => result.current.setGameState("ACTIVE"));
        act(() => {});
        expect(result.current.currentWordIndex).toBe(4);
        vi.useRealTimers();
    });

    test("mispronounce pause race: advance completes on resume", () => {
        vi.useFakeTimers();
        const { result } = mountMidRound();
        act(() => result.current.handleMispronounce());
        expect(result.current.isMispronounced).toBe(true);
        act(() => result.current.setGameState("PAUSED"));
        expect(result.current.isMispronounced).toBe(false);
        act(() => result.current.setGameState("COUNTDOWN"));
        act(() => result.current.setGameState("ACTIVE"));
        act(() => {});
        expect(result.current.currentWordIndex).toBe(4);
        vi.useRealTimers();
    });

    test("COUNTDOWN alone does not advance", () => {
        vi.useFakeTimers();
        const { result } = mountMidRound();
        act(() => result.current.handleWordRecognized(1));
        act(() => result.current.setGameState("PAUSED"));
        act(() => result.current.setGameState("COUNTDOWN"));
        act(() => {});
        expect(result.current.currentWordIndex).toBe(3);
        vi.useRealTimers();
    });

    test("terminal paths clear pending advance", () => {
        vi.useFakeTimers();
        const { result } = mountMidRound();
        act(() => result.current.handleWordRecognized(1));
        act(() => result.current.handleTimeUp());
        act(() => result.current.setGameState("COUNTDOWN"));
        act(() => result.current.setGameState("ACTIVE"));
        act(() => {});
        expect(result.current.currentWordIndex).toBe(3);
        vi.useRealTimers();
    });
});
