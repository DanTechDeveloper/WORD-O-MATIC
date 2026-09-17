import { routeRecognitionMessage } from "@/lib/speechProcessors.js";

// ponytail: router tests — routeRecognitionMessage is the exact body of
// useDeepgramRecognition's conn.on("message"), extracted so Deepgram-shaped
// events can be tested without mounting the hook (no mic/WebSocket/token).
// Guards first, then word/sentence dispatch to the processors.

const makeRefs = ({ isWordMode = true, targetWord = "pig", isActive = true, muted = false } = {}) => {
    const stateRefs = {
        current: {
            hasMatched: false,
            isMounted: true,
            stoppedAt: 0,
            mispronouncedSentence: false,
            mispronouncedInWord: false,
            transcript: "",
            interim: "",
            lastSpeechAt: Date.now(),
        },
    };
    const timeoutRefs = { current: { graceEnd: 0, restartCount: 0, target: null, prevTarget: null, targetChangedAt: 0 } };
    const timerRefs = { current: { restart: null, sentence: null, word: null, settle: null, sentenceSettle: null, wordSettle: null } };
    const propsRef = {
        current: {
            isActive,
            isWordMode,
            targetWord,
            muted,
            onWordRecognized: vi.fn(),
            onMispronounced: vi.fn(),
            onProgress: vi.fn(),
            onPermissionDenied: vi.fn(),
            onRecognitionError: vi.fn(),
            onRestartFailed: vi.fn(),
        },
    };
    return { stateRefs, timeoutRefs, timerRefs, propsRef };
};

const dgEvent = ({ transcript = "", isFinal = false, speechFinal = false, confidence = 0.95, type = "Results" } = {}) => ({
    type,
    is_final: isFinal,
    speech_final: speechFinal,
    channel: { alternatives: [{ transcript, confidence }] },
});

const route = (data, refs) =>
    routeRecognitionMessage(data, refs.stateRefs, refs.timerRefs, refs.timeoutRefs, refs.propsRef);

describe("routeRecognitionMessage guards (hook wiring)", () => {
    test("ignores null data and non-Results types", () => {
        for (const data of [null, undefined, { type: "Metadata" }, {}]) {
            const refs = makeRefs();
            route(data, refs);
            expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
            expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
        }
    });
    test("ignores everything while inactive or muted", () => {
        for (const opts of [{ isActive: false }, { muted: true }]) {
            const refs = makeRefs(opts);
            route(dgEvent({ transcript: "pig", isFinal: true }), refs);
            expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
            expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
        }
    });
    test("ignores empty non-final transcript", () => {
        const refs = makeRefs();
        route(dgEvent({ transcript: "" }), refs);
        expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("defaults missing confidence to 1 (authoritative path still works)", () => {
        const refs = makeRefs();
        route(
            { type: "Results", is_final: true, channel: { alternatives: [{ transcript: "pig" }] } },
            refs,
        );
        expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
    });
});

describe("routeRecognitionMessage dispatch — word mode", () => {
    test("final exact transcript recognizes (the hook's happy path)", () => {
        const refs = makeRefs({ targetWord: "pig" });
        route(dgEvent({ transcript: "pig", isFinal: true }), refs);
        expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("authoritative wrong transcript mispronounces", () => {
        const refs = makeRefs({ targetWord: "pig" });
        route(dgEvent({ transcript: "zebra", isFinal: true, confidence: 0.9 }), refs);
        expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(refs.propsRef.current.onMispronounced).toHaveBeenCalled();
    });
});

describe("routeRecognitionMessage dispatch — sentence mode", () => {
    const target = "a pig naps";
    test("full-sentence final recognizes", () => {
        const refs = makeRefs({ isWordMode: false, targetWord: target });
        route(dgEvent({ transcript: "a pig naps", isFinal: true }), refs);
        expect(refs.propsRef.current.onWordRecognized).toHaveBeenCalledTimes(1);
        expect(refs.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("wrong-sentence final mispronounces", () => {
        const refs = makeRefs({ isWordMode: false, targetWord: target });
        route(dgEvent({ transcript: "the dog ran", isFinal: true }), refs);
        expect(refs.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(refs.propsRef.current.onMispronounced).toHaveBeenCalled();
    });
});
