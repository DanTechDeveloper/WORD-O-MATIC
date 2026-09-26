// @vitest-environment happy-dom
import { renderHook, act, waitFor } from "@testing-library/react";
import { DeepgramClient } from "@deepgram/sdk";
import { useDeepgramRecognition } from "@/hooks/Student/useDeepgramRecognition.js";

// ponytail: hook wiring tests — the hook itself is unmountable in node for
// real (live mic/WebSocket/token), so every external boundary is mocked and
// only the hook's OWN logic is under test: lifecycle cleanup, ref guards,
// grace windows, re-arm. Verdict math stays in speechUtils.test.js.
// These tests assert REASONABLE behavior, not current behavior — a red test
// here means the source is illogical, fix the source, not the test.

const dg = vi.hoisted(() => ({ conns: [] }));

vi.mock("@deepgram/sdk", () => ({
    DeepgramClient: vi.fn(function () {
        return {
            listen: {
                v1: {
                    connect: vi.fn(async () => {
                        const conn = {
                            handlers: {},
                            on: vi.fn((ev, cb) => {
                                conn.handlers[ev] = cb;
                            }),
                            close: vi.fn(),
                            connect: vi.fn(),
                            waitForOpen: vi.fn(async () => {
                                await conn.handlers.open?.();
                            }),
                            socket: { send: vi.fn() },
                        };
                        dg.conns.push(conn);
                        return conn;
                    }),
                },
            },
        };
    }),
}));

function makeAudioCtx() {
    const script = { connect: vi.fn(), disconnect: vi.fn(), onaudioprocess: null };
    const source = { connect: vi.fn(), disconnect: vi.fn() };
    const sink = { connect: vi.fn(), gain: { value: 0 } };
    return {
        __script: script,
        state: "running",
        sampleRate: 16000,
        destination: {},
        resume: vi.fn(async () => {}),
        audioWorklet: {
            addModule: vi.fn(async () => {
                throw new Error("no worklet in test");
            }),
        },
        createMediaStreamSource: vi.fn(() => source),
        createScriptProcessor: vi.fn(() => script),
        createGain: vi.fn(() => sink),
        close: vi.fn(async () => {}),
    };
}

function stubBrowser() {
    const trackStop = vi.fn();
    const getUserMedia = vi.fn(async () => ({ getTracks: () => [{ stop: trackStop }] }));
    Object.defineProperty(window.navigator, "mediaDevices", {
        value: { getUserMedia },
        configurable: true,
        writable: true,
    });
    const ctx = makeAudioCtx();
    vi.stubGlobal(
        "AudioContext",
        vi.fn(function () {
            return ctx;
        }),
    );
    const fetchMock = vi.fn(async () => ({
        ok: true,
        json: async () => ({ token: "tok", baseUrl: "http://dg", expires_in: 3600 }),
    }));
    vi.stubGlobal("fetch", fetchMock);
    return { trackStop, getUserMedia, ctx, fetchMock };
}

const baseProps = () => ({
    isActive: true,
    preload: true,
    targetWord: "cat",
    keyterms: ["cat", "dog"],
    onWordRecognized: vi.fn(),
    onPermissionDenied: vi.fn(),
    onMispronounced: vi.fn(),
    onRecognitionError: vi.fn(),
    onRestartFailed: vi.fn(),
    onProgress: vi.fn(),
});

// Deepgram-shaped Results message (what conn.on("message") receives).
const dgMsg = (transcript, { isFinal = false, speechFinal = false, confidence = 0.9 } = {}) => ({
    type: "Results",
    is_final: isFinal,
    speechFinal,
    channel: { alternatives: [{ transcript, confidence }] },
});

async function loadHook() {
    // Fresh module per test: the hook caches the Deepgram grant token at
    // module level, which must not leak between tests.
    vi.resetModules();
    dg.conns.length = 0;
    const hookMod = await import("@/hooks/Student/useDeepgramRecognition.js");
    const sdkMod = await import("@deepgram/sdk");
    vi.mocked(sdkMod.DeepgramClient).mockClear();
    return { useHook: hookMod.useDeepgramRecognition, Client: sdkMod.DeepgramClient };
}

async function renderOpen(stubs, props, useHook) {
    const r = renderHook(({ word }) => useHook({ ...props, targetWord: word }), {
        initialProps: { word: props.targetWord },
    });
    await waitFor(() => expect(stubs.getUserMedia).toHaveBeenCalled());
    await waitFor(() => expect(dg.conns.length).toBeGreaterThan(0));
    return r;
}

beforeEach(() => {
    dg.conns.length = 0;
});

afterEach(() => {
    vi.unstubAllGlobals();
});

describe("useDeepgramRecognition — lifecycle", () => {
    test("unmount closes conn + audio + tracks and pending settle never fires", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        const { unmount } = await renderOpen(stubs, props, useHook);
        const conn = dg.conns[0];

        vi.useFakeTimers();
        // Arm a settle with a wrong interim, then unmount before it fires.
        act(() => {
            conn.handlers.message(dgMsg("fish", { confidence: 0.9 }));
        });
        unmount();
        act(() => {
            vi.advanceTimersByTime(10000);
        });
        expect(props.onMispronounced).not.toHaveBeenCalled();
        expect(conn.close).toHaveBeenCalled();
        expect(stubs.ctx.close).toHaveBeenCalled();
        expect(stubs.trackStop).toHaveBeenCalled();
        vi.useRealTimers();
    });

    test("unmount while token is in flight creates no client", async () => {
        const { useHook, Client } = await loadHook();
        stubBrowser();
        let resolveFetch;
        vi.mocked(fetch).mockImplementationOnce(
            () => new Promise((r) => (resolveFetch = r)),
        );
        const { unmount } = renderHook(() => useHook(baseProps()));
        unmount();
        await act(async () => {
            resolveFetch({
                ok: true,
                json: async () => ({ token: "tok", baseUrl: "http://dg", expires_in: 3600 }),
            });
        });
        expect(Client).not.toHaveBeenCalled();
    });

    test("a close triggers one reconnect", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        await renderOpen(stubs, props, useHook);
        const conn = dg.conns[0];

        vi.useFakeTimers();
        await act(async () => {
            conn.handlers.close();
            vi.advanceTimersByTime(1100);
        });
        // Flush the reconnect chain (fetch → connect → open → mic).
        await act(async () => {});
        expect(dg.conns.length).toBe(2);
        expect(props.onRestartFailed).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});

describe("useDeepgramRecognition — stale guards", () => {
    test("fresh open re-arms grace: mic transient right after open can't instant-fail", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        // Slow mic: mount grace (800ms) expires BEFORE the connection opens,
        // like a real token-RTT + permission delay.
        let resolveMic;
        stubs.getUserMedia.mockImplementationOnce(() => new Promise((r) => (resolveMic = r)));
        const props = baseProps();
        renderHook(({ word }) => useHook({ ...props, targetWord: word }), {
            initialProps: { word: props.targetWord },
        });
        vi.useFakeTimers();
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        await act(async () => {
            resolveMic({ getTracks: () => [{ stop: stubs.trackStop }] });
        });
        const conn = dg.conns[0];

        // Mic-open transient hallucinated as a confident wrong word.
        act(() => {
            conn.handlers.message(dgMsg("fish", { isFinal: true, confidence: 0.9 }));
        });
        expect(props.onMispronounced).not.toHaveBeenCalled();
        // And no settle was armed behind it either.
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(props.onMispronounced).not.toHaveBeenCalled();

        // Past grace, a real wrong verdict still fires — grace is a window, not a gag.
        act(() => {
            vi.advanceTimersByTime(600);
        });
        act(() => {
            conn.handlers.message(dgMsg("fish", { isFinal: true, confidence: 0.9 }));
        });
        expect(props.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    test("settle armed for the previous target never fires after a switch", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        const { rerender } = await renderOpen(stubs, props, useHook);
        const conn = dg.conns[0];

        vi.useFakeTimers();
        // Wrong interim for "cat" arms the 1200ms settle.
        act(() => {
            conn.handlers.message(dgMsg("fish", { confidence: 0.9 }));
        });
        act(() => {
            vi.advanceTimersByTime(500);
        });
        // Switch to "dog" mid-settle.
        rerender({ word: "dog" });
        // Stale tail for the old word inside 500ms is dropped, not verdict.
        act(() => {
            conn.handlers.message(dgMsg("cat", { isFinal: true, confidence: 0.95 }));
        });
        expect(props.onMispronounced).not.toHaveBeenCalled();
        expect(props.onWordRecognized).not.toHaveBeenCalled();
        // Old settle window passes with no verdict.
        act(() => {
            vi.advanceTimersByTime(2000);
        });
        expect(props.onMispronounced).not.toHaveBeenCalled();

        // New target still works after its own grace: wrong interim → settle fires.
        act(() => {
            vi.advanceTimersByTime(900);
        });
        act(() => {
            conn.handlers.message(dgMsg("fish", { confidence: 0.9 }));
        });
        act(() => {
            vi.advanceTimersByTime(1300);
        });
        expect(props.onMispronounced).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });

    test("re-arm fires when targetWord is identical but targetIndex changes", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = { ...baseProps(), targetWord: "a", targetIndex: 0 };
        const { rerender } = renderHook(
            ({ word, idx }) => useHook({ ...props, targetWord: word, targetIndex: idx }),
            { initialProps: { word: "a", idx: 0 } },
        );
        await waitFor(() => expect(dg.conns.length).toBeGreaterThan(0));
        const conn = dg.conns[0];

        // Word 0 matched
        act(() => {
            conn.handlers.message(dgMsg("a", { isFinal: true, confidence: 0.9 }));
        });
        expect(props.onWordRecognized).toHaveBeenCalledTimes(1);

        // Advance to index 5 which ALSO has targetWord "a"
        rerender({ word: "a", idx: 5 });

        // Second "a" at index 5 recognizes because targetIndex changed re-armed the hook
        act(() => {
            conn.handlers.message(dgMsg("a", { isFinal: true, confidence: 0.9 }));
        });
        expect(props.onWordRecognized).toHaveBeenCalledTimes(2);
    });

    test("resetKey resets state and enables speech matching in sentence mode", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = {
            ...baseProps(),
            matchMode: "sentence",
            lookahead: "a robot holds a lemon",
            targetWord: "a",
            resetKey: 0,
        };
        const { rerender } = renderHook(
            ({ rk }) => useHook({ ...props, resetKey: rk }),
            { initialProps: { rk: 0 } },
        );
        await waitFor(() => expect(dg.conns.length).toBeGreaterThan(0));
        const conn = dg.conns[0];

        // Advance sentence: resetKey changes 0 -> 1
        rerender({ rk: 1 });

        act(() => {
            conn.handlers.message(dgMsg("a robot holds a lemon", { isFinal: true, confidence: 0.95 }));
        });
        expect(props.onWordRecognized).toHaveBeenCalledWith(5);
    });
});

describe("useDeepgramRecognition — restart policy, token retry, error teardown", () => {
    test("four quick deaths in a row give up instead of looping forever", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        await renderOpen(stubs, props, useHook);

        vi.useFakeTimers();
        // Deaths 1-3 (each lived ~0ms): 3 retries with 1000/2000/3000ms backoff.
        const backoffs = [1000, 2000, 3000];
        for (let d = 0; d < 3; d++) {
            await act(async () => {
                dg.conns[d].handlers.close();
                vi.advanceTimersByTime(100);
            });
            await act(async () => {
                vi.advanceTimersByTime(backoffs[d]);
            });
            await act(async () => {});
            expect(dg.conns.length).toBe(d + 2);
        }
        expect(props.onRestartFailed).not.toHaveBeenCalled();
        // Death 4: streak exhausted → give up, no 5th conn ever.
        await act(async () => {
            dg.conns[3].handlers.close();
            vi.advanceTimersByTime(100);
        });
        await act(async () => {});
        expect(props.onRestartFailed).toHaveBeenCalledTimes(1);
        expect(dg.conns.length).toBe(4);
        await act(async () => {
            vi.advanceTimersByTime(30000);
        });
        await act(async () => {});
        expect(dg.conns.length).toBe(4);
        vi.useRealTimers();
    });

    test("a healthy long-lived conn resets the quick-death streak", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        await renderOpen(stubs, props, useHook);

        vi.useFakeTimers();
        // Death after 11s healthy: streak resets, retries like a first blip.
        await act(async () => {
            vi.advanceTimersByTime(11000);
        });
        await act(async () => {
            dg.conns[0].handlers.close();
            vi.advanceTimersByTime(1000);
        });
        await act(async () => {});
        expect(dg.conns.length).toBe(2);
        // Another death after a short life: streak is 1 again, not 2.
        await act(async () => {
            dg.conns[1].handlers.close();
            vi.advanceTimersByTime(2000);
        });
        await act(async () => {});
        expect(dg.conns.length).toBe(3);
        expect(props.onRestartFailed).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    test("token failure retries with backoff, then reports token_failed", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        stubs.fetchMock.mockRejectedValue(new Error("grant down"));
        const props = baseProps();

        vi.useFakeTimers();
        renderHook(() => useHook(props));
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(1);
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(2);
        await act(async () => {
            vi.advanceTimersByTime(2000);
        });
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(3);
        await act(async () => {
            vi.advanceTimersByTime(3000);
        });
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(4);
        expect(props.onRecognitionError).toHaveBeenCalledTimes(1);
        expect(props.onRecognitionError).toHaveBeenCalledWith("token_failed");
        expect(dg.conns.length).toBe(0);
        vi.useRealTimers();
    });

    test("token failure recovers when the retry succeeds", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        stubs.fetchMock.mockRejectedValueOnce(new Error("grant down"));
        const props = baseProps();

        vi.useFakeTimers();
        renderHook(() => useHook(props));
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(1);
        await act(async () => {
            vi.advanceTimersByTime(1000);
        });
        await act(async () => {});
        expect(stubs.fetchMock).toHaveBeenCalledTimes(2);
        expect(dg.conns.length).toBe(1);
        expect(props.onRecognitionError).not.toHaveBeenCalled();
        vi.useRealTimers();
    });

    test("conn error tears the conn down and reconnects", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        const props = baseProps();
        await renderOpen(stubs, props, useHook);
        const conn = dg.conns[0];

        act(() => {
            conn.handlers.error(new Error("boom"));
        });
        expect(props.onRecognitionError).toHaveBeenCalledWith("boom");
        expect(conn.close).toHaveBeenCalled();
        // The real SDK emits close after close(): simulate the event, then
        // the close handler owns restart policy.
        vi.useFakeTimers();
        await act(async () => {
            conn.handlers.close();
            vi.advanceTimersByTime(1100);
        });
        await act(async () => {});
        expect(dg.conns.length).toBe(2);
        expect(props.onRestartFailed).not.toHaveBeenCalled();
        vi.useRealTimers();
    });
});

describe("useDeepgramRecognition — RNNoise denoise path", () => {
    test("default: 48k context for RNNoise, Deepgram still gets 16k", async () => {
        const { useHook, Client } = await loadHook();
        const stubs = stubBrowser();
        await renderOpen(stubs, baseProps(), useHook);
        expect(window.AudioContext).toHaveBeenCalledWith({
            sampleRate: 48000,
        });
        const client = vi.mocked(Client).mock.results[0].value;
        expect(client.listen.v1.connect).toHaveBeenCalledWith(
            expect.objectContaining({ sample_rate: 16000 }),
        );
    });

    test("denoise:false keeps the legacy 16k context", async () => {
        const { useHook } = await loadHook();
        const stubs = stubBrowser();
        await renderOpen(stubs, { ...baseProps(), denoise: false }, useHook);
        expect(window.AudioContext).toHaveBeenCalledWith({
            sampleRate: 16000,
        });
    });
});
