import { describe, test, expect, vi } from "vitest";
import {
    processSentenceModeResult,
    countConsecutiveMatches,
} from "@/lib/speechProcessors.js";

const makeRefs = (lookahead) => ({
    stateRefs: {
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
    },
    timeoutRefs: { current: { graceEnd: 0, restartCount: 0, target: null } },
    timerRefs: { current: { restart: null, sentence: null, word: null, settle: null } },
    propsRef: {
        current: {
            isActive: true,
            lookahead,
            onWordRecognized: vi.fn(),
            onMispronounced: vi.fn(),
            onProgress: vi.fn(),
        },
    },
});

const LOOK = "the dog runs fast and far";

describe("lookahead multi-word advance (Story Quest frontend)", () => {
    test("isang hinga 'the dog' sa highlight na 'the' -> advance 2", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: true, 0: { transcript: "the dog" } },
            "the", r.stateRefs, r.timeoutRefs, r.timerRefs, r.propsRef,
        );
        expect(r.propsRef.current.onWordRecognized).toHaveBeenCalledWith(2);
        expect(r.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });
    test("interim partial -> progress only, no advance", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: false, 0: { transcript: "the dog" } },
            "the", r.stateRefs, r.timeoutRefs, r.timerRefs, r.propsRef,
        );
        expect(r.propsRef.current.onProgress).toHaveBeenCalledWith(2);
        expect(r.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
    });
    test("interim full lookahead -> advance lahat", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: false, 0: { transcript: LOOK } },
            "the", r.stateRefs, r.timeoutRefs, r.timerRefs, r.propsRef,
        );
        expect(r.propsRef.current.onWordRecognized).toHaveBeenCalledWith(6);
    });
    test("maling pangungusap -> mispronounce, walang advance", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: true, 0: { transcript: "zebra queens jump high" } },
            "the", r.stateRefs, r.timeoutRefs, r.timerRefs, r.propsRef,
        );
        expect(r.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(r.propsRef.current.onMispronounced).toHaveBeenCalled();
    });
    test("utal na 'the the dog' -> advance 2 pa rin", () => {
        expect(countConsecutiveMatches("the the dog", LOOK)).toBe(2);
    });
    test("nilaktawang salita -> hinto sa nilaktawan", () => {
        expect(countConsecutiveMatches("the runs", LOOK)).toBe(1);
    });
});
