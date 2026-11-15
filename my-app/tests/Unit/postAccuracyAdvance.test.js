// @vitest-environment happy-dom
import { renderHook, act } from "@testing-library/react";
import { useGameplayCore } from "@/hooks/Student/useGameplayCore";

const routerMock = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@inertiajs/react", () => ({ router: routerMock }));
vi.mock("@/utils/sounds", () => ({ playSuccessSound:()=>{}, playFeedbackSound:()=>{}, playMispronounceSound:()=>{} }));

const WORDS = [{id:1,word:"a"},{id:2,word:"b"},{id:3,word:"c"},{id:4,word:"d"},{id:5,word:"e"}];
const MID = { moduleId:7, currentWordIndex:3, wordsSmashed:3, currentStreak:2, maxStreak:4, timeLeft:12, savedAt:Date.now() };

test("advance", async () => {
    routerMock.post.mockClear();
    vi.useFakeTimers();
    const { result } = renderHook(() => useGameplayCore({ words: WORDS, totalWords: 5, moduleId: 7, saveEndpoint: "/x", resumeData: MID }));
    act(() => result.current.handleWordRecognized(1));
    act(() => { vi.advanceTimersByTime(500); });
    await act(async () => { await Promise.resolve(); });
    act(() => result.current.persistProgress());
    const payload = routerMock.post.mock.calls[routerMock.post.mock.calls.length - 1]?.[1];
    vi.useRealTimers();
    expect(payload.words_processed).toBe(4);
    expect(payload.words_smashed).toBe(4);
});
