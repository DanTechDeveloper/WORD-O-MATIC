import { describe, test, expect, vi } from "vitest";
import {
    processSentenceModeResult,
    alignSentence,
} from "@/lib/speechProcessors.js";

const makeRefs = (lookahead, extra = {}) => ({
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
            onSentenceVerdict: vi.fn(),
            ...extra,
        },
    },
});

const LOOK = "the cat is very big";

describe("alignSentence — mid-sentence substitution walk", () => {
    test("gitnang mali: The DOG is very big -> [c,w,c,c,c]", () => {
        expect(alignSentence("the dog is very big", LOOK)).toEqual([
            "correct",
            "wrong",
            "correct",
            "correct",
            "correct",
        ]);
    });

    test("tugmang buo -> lahat correct", () => {
        expect(alignSentence(LOOK, LOOK)).toEqual([
            "correct",
            "correct",
            "correct",
            "correct",
            "correct",
        ]);
    });

    test("walang tugma -> null (watchdog pa rin)", () => {
        expect(alignSentence("zebra queens jump high", LOOK)).toBeNull();
    });

    test("tumigil sa maling word -> prefix lang, natira defer", () => {
        expect(alignSentence("the dog", LOOK)).toEqual(["correct"]);
    });

    test("mali sa huling salita ng buong pangungusap -> RED agad", () => {
        expect(alignSentence("the cat is very bag", LOOK)).toEqual([
            "correct",
            "correct",
            "correct",
            "correct",
            "wrong",
        ]);
    });

    test("utal na fragment sa frontier -> prefix lang, walang false RED", () => {
        expect(alignSentence("the ca", "the cat sat")).toEqual(["correct"]);
    });

    test("bakanteng transcript -> null", () => {
        expect(alignSentence("", LOOK)).toBeNull();
        expect(alignSentence("   ", LOOK)).toBeNull();
    });

    test("stale tapos nang sentence -> anchor sa HULI, hindi false RED", () => {
        // straight-through: transcript may dala pang first sentence dahil
        // tinanggal ang per-sentence wipe. Ang unang "a" ay stale.
        expect(
            alignSentence("a puppy naps a hamster runs", "a hamster runs"),
        ).toEqual(["correct", "correct", "correct"]);
    });
});

describe("processSentenceModeResult — alignment verdict path", () => {
    test("authoritative partial na may gitnang mali -> batch verdict, hindi 1-advance", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: true, confidence: 0.9, 0: { transcript: "the dog is very big" } },
            "the",
            r.stateRefs,
            r.timeoutRefs,
            r.timerRefs,
            r.propsRef,
        );
        expect(r.propsRef.current.onSentenceVerdict).toHaveBeenCalledWith([
            "correct",
            "wrong",
            "correct",
            "correct",
            "correct",
        ]);
        expect(r.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
        expect(r.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });

    test("walang batch callback -> lumang prefix path pa rin", () => {
        const r = makeRefs(LOOK, { onSentenceVerdict: undefined });
        processSentenceModeResult(
            { isFinal: true, confidence: 0.9, 0: { transcript: "the dog is very big" } },
            "the",
            r.stateRefs,
            r.timeoutRefs,
            r.timerRefs,
            r.propsRef,
        );
        expect(r.propsRef.current.onWordRecognized).toHaveBeenCalledWith(1);
        expect(r.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });

    test("mababang confidence -> walang batch, legacy prefix advance pa rin", () => {
        // ponytail: tugmang salita pinagkakatiwalaan kahit low-conf (gaya ng
        // word-mode accept); ang confidence gate ay para sa Wrong path lang.
        // Kaya walang RED batch — pero ang prefix advance, tuloy.
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: true, confidence: 0.4, 0: { transcript: "the dog is very big" } },
            "the",
            r.stateRefs,
            r.timeoutRefs,
            r.timerRefs,
            r.propsRef,
        );
        expect(r.propsRef.current.onSentenceVerdict).not.toHaveBeenCalled();
        expect(r.propsRef.current.onWordRecognized).toHaveBeenCalledWith(1);
        expect(r.propsRef.current.onMispronounced).not.toHaveBeenCalled();
    });

    test("interim partial -> progress lang, walang batch", () => {
        const r = makeRefs(LOOK);
        processSentenceModeResult(
            { isFinal: false, confidence: 0.9, 0: { transcript: "the dog is very" } },
            "the",
            r.stateRefs,
            r.timeoutRefs,
            r.timerRefs,
            r.propsRef,
        );
        expect(r.propsRef.current.onSentenceVerdict).not.toHaveBeenCalled();
        expect(r.propsRef.current.onWordRecognized).not.toHaveBeenCalled();
    });
});
