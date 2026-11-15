// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useGameplayCore } from "@/hooks/Student/useGameplayCore";
import { markReachable, markUnreachable } from "@/utils/connection";
import { writeResumeSession, readPendingSession } from "@/utils/resumeStorage";
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

function mountMidRound(deferPersist = false) {
    return renderHook(() =>
        useGameplayCore({
            words: WORDS,
            totalWords: WORDS.length,
            moduleId: 7,
            saveEndpoint: "/student/saveWordProgress",
            resumeData: deferPersist ? null : MID_ROUND,
            deferPersist,
        }),
    );
}

describe("POST accuracy — final progress (useGameplayCore)", () => {
    beforeEach(() => {
        routerMock.post.mockClear();
        markReachable();
    });

    test("persistProgress posts exactly once (hasSaved guard)", () => {
        const { result } = mountMidRound();
        act(() => result.current.persistProgress());
        act(() => result.current.persistProgress());
        expect(routerMock.post).toHaveBeenCalledTimes(1);
    });

    test("payload carries module_id, words_smashed, words_processed, streak, client_token", () => {
        const { result } = mountMidRound();
        act(() => result.current.persistProgress());
        const [url, payload] = routerMock.post.mock.calls[0];
        expect(url).toBe("/student/saveWordProgress");
        expect(payload.module_id).toBe(7);
        expect(payload.words_smashed).toBe(3);
        expect(payload.words_processed).toBe(3);
        expect(payload.streak).toBe(4);
        expect(typeof payload.client_token).toBe("string");
        expect(payload.client_token.length).toBeGreaterThan(0);
    });

    test("refillRoundClock resets the guard so a retry persists", () => {
        const { result } = mountMidRound();
        act(() => result.current.persistProgress());
        expect(routerMock.post).toHaveBeenCalledTimes(1);
        act(() => result.current.refillRoundClock());
        act(() => result.current.persistProgress());
        expect(routerMock.post).toHaveBeenCalledTimes(2);
    });

    test("handleFatalError posts once and blocks a follow-up persistProgress", () => {
        const { result } = mountMidRound();
        act(() => result.current.handleFatalError());
        act(() => result.current.persistProgress());
        expect(routerMock.post).toHaveBeenCalledTimes(1);
    });

    test("pause does not auto-persist; resume does not duplicate", () => {
        const { result } = mountMidRound();
        routerMock.post.mockClear();
        act(() => result.current.setGameState("PAUSED"));
        expect(routerMock.post).toHaveBeenCalledTimes(0);
        act(() => result.current.setGameState("COUNTDOWN"));
        expect(routerMock.post).toHaveBeenCalledTimes(0);
    });

    test("tutorial (deferPersist) posts without client_token and no pending session", () => {
        writeResumeSession(7, MID_ROUND);
        const { result } = mountMidRound(true);
        act(() => result.current.persistProgress());
        const payload = routerMock.post.mock.calls[0][1];
        expect(payload.client_token).toBeUndefined();
        expect(readPendingSession(7)).toBeNull();
    });

    test("offline writes a pending session with the same payload", () => {
        markUnreachable();
        const { result } = mountMidRound();
        act(() => result.current.persistProgress());
        const pending = readPendingSession(7);
        expect(pending).not.toBeNull();
        expect(pending.module_id).toBe(7);
        expect(pending.words_smashed).toBe(3);
        expect(pending.words_processed).toBe(3);
        expect(pending.streak).toBe(4);
        expect(typeof pending.client_token).toBe("string");
    });
});
