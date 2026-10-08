// @vitest-environment happy-dom
// ponytail: real hook test — behaviour, not file text. Same pattern as
// useDeepgramRecognition.test.js: mock every external boundary (Inertia router,
// sounds), leave the engine's own state machine under test.
import { renderHook, act } from "@testing-library/react";
import { useGameplayCore } from "@/hooks/Student/useGameplayCore";
import { useStoryQuestEngine } from "@/hooks/Student/useStoryQuestEngine";
import { markReachable, markUnreachable } from "@/utils/connection";
import { armWordTimeout, armSentenceTimeout } from "@/lib/speechProcessors";
import { writeResumeSession, readResumeSession, readPendingSession } from "@/utils/resumeStorage";
import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");
const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");
const speakMode = read("resources/js/Pages/Student/GameplaySpeakMode.jsx");
const resumeStorage = read("resources/js/utils/resumeStorage.js");
const deepgram = read("resources/js/hooks/Student/useDeepgramRecognition.js");
const speechProcessors = read("resources/js/lib/speechProcessors.js");
const storyQuest = read("resources/js/hooks/Student/useStoryQuestEngine.js");

// ponytail: happy-dom exposes navigator.onLine as a prototype getter, so the
// instance has to be shadowed. The connection store is a module singleton, so
// it is reset too — otherwise one case's "unreachable" decides the next one.
const setOnline = (value) =>
    Object.defineProperty(window.navigator, "onLine", {
        value,
        configurable: true,
    });
afterEach(() => {
    setOnline(true);
    markReachable();
});

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

// ponytail: a mid-round state is the only interesting input here — word 3 of 5,
// score 3, 12s left. Everything downstream is about what survives a reset.
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

// ponytail: the hook is now a MIRROR of the shared store, not a listener owner.
// The store's own transitions are behaviour-tested in connection.test.js; what
// matters here is that the mic and the TapToStartOverlay read a value that goes
// false when the server cannot be reached — and that the hook holds the app's
// single store subscription (the modal deliberately does NOT subscribe).
describe("the core mirrors the shared connection store", () => {
    const mount = () =>
        renderHook(() =>
            useGameplayCore({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveWordProgress",
            }),
        );

    test("mounts reachable", () => {
        expect(mount().result.current.online).toBe(true);
    });

    test("goes offline when the store marks the server unreachable", () => {
        // The whole point of the store: a WiFi link with no uplink used to read
        // as online here, so the mic promised "Speak to Smash!" on a dead link.
        const { result } = mount();
        act(() => {
            markUnreachable("server");
        });
        expect(result.current.online).toBe(false);
        act(() => {
            markReachable();
        });
        expect(result.current.online).toBe(true);
    });

    test("holds no connectivity listener of its own", () => {
        // One subscription in the app. A second one here would let the two
        // disagree about the same network.
        const add = vi.spyOn(window, "addEventListener");
        const { unmount } = mount();
        unmount();
        const events = add.mock.calls.map((c) => c[0]);
        expect(events).not.toContain("online");
        expect(events).not.toContain("offline");
        add.mockRestore();
    });
});

describe("refillRoundClock — post-fatal-ASR recovery", () => {
    test("returns the round to IDLE with a full clock", () => {
        const { result } = mountMidRound();
        expect(result.current.gameState).toBe("ACTIVE");
        expect(result.current.timeLeft).toBe(12);

        act(() => result.current.refillRoundClock());

        expect(result.current.gameState).toBe("IDLE");
        expect(result.current.timeLeft).toBe(60);
    });

    test("preserves the kid's position and score", () => {
        // The whole point: startGame() resets no counters, so wiping these would
        // hand back "word 3 of 5, score 3" with a fresh clock — or, without the
        // refill, "word 3 of 5" with the 2s the dropout left behind.
        const { result } = mountMidRound();

        act(() => result.current.refillRoundClock());

        expect(result.current.currentWordIndex).toBe(3);
        expect(result.current.wordsSmashed).toBe(3);
        expect(result.current.currentStreak).toBe(2);
        expect(result.current.maxStreak).toBe(4);
    });

    test("un-sticks the visual flags that clearAllTimers orphaned", () => {
        const { result } = mountMidRound();

        // Dirty the flags the way a mid-round mispronounce does.
        act(() => result.current.handleMispronounce());
        expect(result.current.isMispronounced).toBe(true);
        expect(result.current.feedbackType).toBe("mispronounce");

        act(() => result.current.refillRoundClock());

        // clearAllTimers nulled their timers, so nothing else would ever clear
        // these — a stuck exploding word or a permanent feedback popup.
        expect(result.current.isMispronounced).toBe(false);
        expect(result.current.isExploding).toBe(false);
        expect(result.current.feedbackType).toBeNull();
        expect(result.current.feedbackMessage).toBe("");
    });

    test("re-arms the one-shot save guard so the retry persists", () => {
        const { result } = mountMidRound();
        routerMock.post.mockClear();

        // handleFatalError → persistProgress consumes hasSaved.
        act(() => result.current.persistProgress());
        act(() => result.current.persistProgress());
        expect(routerMock.post).toHaveBeenCalledTimes(1);

        act(() => result.current.refillRoundClock());
        act(() => result.current.persistProgress());

        expect(routerMock.post).toHaveBeenCalledTimes(2);
    });

    test("leaves the mic usable (isSaving must not strand the Microphone)", () => {
        const { result } = mountMidRound();

        act(() => result.current.persistProgress());
        expect(result.current.isSaving).toBe(true);

        act(() => result.current.refillRoundClock());

        // Microphone is `disabled={gameState === "COUNTDOWN" || isSaving}`.
        expect(result.current.isSaving).toBe(false);
    });
});

describe("handleFatalError — durability before anything else", () => {
    test("banks the aborted round in the pending session, then clears resume", () => {
        writeResumeSession(7, MID_ROUND);
        expect(sessionStorage.getItem("wordomaticResume:7")).not.toBeNull();

        const { result } = mountMidRound();
        act(() => result.current.handleFatalError());

        // The aborted round replays on next mount — this is why the page must
        // call handleFatalError BEFORE refillRoundClock.
        expect(readPendingSession(7)).not.toBeNull();
        expect(sessionStorage.getItem("wordomaticResume:7")).toBeNull();
        expect(result.current.gameState).toBe("GAMEOVER");
    });

    test("tutorial rounds write no pending session (deferPersist)", () => {
        routerMock.post.mockClear();
        writeResumeSession(7, MID_ROUND);
        const { result } = renderHook(() =>
            useGameplayCore({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveWordProgress",
                resumeData: MID_ROUND,
                deferPersist: true,
            }),
        );

        act(() => result.current.handleFatalError());

        expect(readPendingSession(7)).toBeNull();
        expect(routerMock.post).not.toHaveBeenCalled();
    });

    test("tutorial rounds never resume and write no resume session (deferPersist)", () => {
        // A stale record from before the gate (or a same-id real round) must
        // not resurrect a tutorial round: F5 in a tutorial = word 1, full clock,
        // guide replays (guideDone inits on isResume in the pages).
        writeResumeSession(7, MID_ROUND);
        const { result } = renderHook(() =>
            useGameplayCore({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveWordProgress",
                deferPersist: true,
            }),
        );

        expect(result.current.gameState).toBe("IDLE");
        expect(result.current.currentWordIndex).toBe(0);
        expect(result.current.isResume).toBe(false);
        // The mount-time deferPersist branch wiped the stale record...
        expect(sessionStorage.getItem("wordomaticResume:7")).toBeNull();

        // ...and even an ACTIVE tutorial round writes nothing back.
        act(() => result.current.setGameState("ACTIVE"));
        expect(sessionStorage.getItem("wordomaticResume:7")).toBeNull();
    });

    test("story quest tutorial writes no resume session either", () => {
        writeResumeSession(7, MID_ROUND);
        const { result } = renderHook(() =>
            useStoryQuestEngine({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveParagraphProgress",
                deferPersist: true,
            }),
        );

        expect(result.current.gameState).toBe("IDLE");
        act(() => result.current.setGameState("ACTIVE"));
        expect(sessionStorage.getItem("wordomaticResume:7")).toBeNull();
    });
});

// ponytail: the hook test above can't reach the page files — these lock the
// wiring contract (ordering, guards, audio) and the "we changed nothing else"
// claims.
describe("page wiring", () => {
    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s persists the aborted round BEFORE refilling the clock", (_name, src) => {
        // Reversed = the aborted round's score is silently dropped.
        // Scoped to the onRestartFailed body: the token_failed handler also
        // refills, and a file-wide indexOf would compare across the two.
        const fn = src.indexOf("onRestartFailed:");
        const body = src.slice(fn, src.indexOf("}),", fn));
        expect(body.indexOf("handleFatalError();")).toBeGreaterThan(-1);
        expect(body.indexOf("handleFatalError();")).toBeLessThan(
            body.indexOf("refillRoundClock();"),
        );
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s recycles a dead uplink instead of burning the 60s round", (_name, src) => {
        // token_failed means the socket never opened, so the round has no score
        // to bank. refillRoundClock is the ONE recovery path that does not
        // persist — handleFatalError here would POST the 0/0 junk row.
        expect(src).toContain('if (err !== "token_failed") return;');
        expect(src).toContain('markUnreachable("server");');
        expect(src).toContain(
            'if (!isResume && !isTutorial) refillRoundClock();',
        );
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s keeps all three recovery guards", (_name, src) => {
        // onLine: no 8s dead-mic loop. isTutorial: keep the celebration bubble.
        // isResume: an IDLE round with isResume has no overlay to start from.
        expect(src).toContain(
            "if (!isResume && !isTutorial && navigator.onLine) refillRoundClock();",
        );
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s releases micLive when leaving the live-mic states", (_name, src) => {
        // sounds.js early-returns the /student click listener on micLive —
        // leaving it true after the round kills BGM and every SFX.
        // COUNTDOWN is live-mic too: BGM pauses there (not ACTIVE) so the
        // permission dialog doesn't collide with it.
        expect(src).toMatch(
            /if \(gameState === "COUNTDOWN" \|\| gameState === "ACTIVE"\) \{[\s\S]*?\} else \{[\s\S]*?setMicLive\(false\);/,
        );
    });
});

describe("deliberately unchanged", () => {
    test("resumeStorage.js keeps its exact export surface and key shape", () => {
        // Both resume writers are ACTIVE-gated, so the key reappears by itself.
        expect(resumeStorage).not.toContain("refillRoundClock");
        for (const fn of [
            "export function resumeKey",
            "export function readResumeSession",
            "export function writeResumeSession",
            "export function clearResumeSession",
            "export function pendingKey",
            "export function readPendingSession",
            "export function writePendingSession",
            "export function clearPendingSession",
        ]) {
            expect(resumeStorage).toContain(fn);
        }
    });

    test("the ASR hook bails when the server is unreachable and re-arms on 'online'", () => {
        // Without the online listener the bail strands the round for the full
        // 60s — every ladder rung is a no-op while the link is down.
        // The store, not navigator.onLine: a WiFi link with no uplink reads as
        // online, so the ladder used to be spent on a server that never answers.
        expect(deepgram).toContain("if (!isReachable()) return;");
        expect(deepgram).toContain(
            'window.addEventListener("online", onBackOnline)',
        );
        expect(deepgram).toContain(
            'window.removeEventListener("online", onBackOnline)',
        );
    });

    test("the close handler bails BEFORE the ladder, so no rung is wasted", () => {
        // Regression guard for the 60s hang: startConnection bails offline, so a
        // scheduled rung would fire once, get swallowed, and reschedule nothing.
        // The bail must sit ahead of the restartCount increment.
        const closeStart = deepgram.indexOf('conn.on("close"');
        const ladderStart = deepgram.indexOf("restartCount++", closeStart);
        expect(closeStart).toBeGreaterThan(-1);
        expect(ladderStart).toBeGreaterThan(closeStart);
        const bail = deepgram.indexOf("if (!isReachable()) return;", closeStart);
        expect(bail).toBeGreaterThan(closeStart);
        expect(bail).toBeLessThan(ladderStart);
    });

    test("the speech-verdict path stays connectivity-free", () => {
        // The exact opposite rule from the watchdogs: real speech must be judged
        // regardless of transport, or every child reads as Wrong when offline.
        const verdictStart = speechProcessors.indexOf(
            "export function processSentenceModeResult",
        );
        const verdictEnd = speechProcessors.indexOf(
            "export function processWordModeResult",
        );
        const wordEnd = speechProcessors.length;
        for (const span of [
            [verdictStart, verdictEnd],
            [verdictEnd, wordEnd],
        ]) {
            expect(speechProcessors.slice(span[0], span[1])).not.toContain(
                "navigator.onLine",
            );
        }
    });
});

// ponytail: the watchdogs report SILENCE. Silence caused by a dead link is
// infrastructure, not the child — so a dropped connection must not silently
// mark a word Wrong, bump the index, and lose the training POST.
describe("watchdog suppression while offline", () => {
    const wordRefs = (onMispronounced) => ({
        stateRefs: {
            current: {
                isMounted: true,
                hasMatched: false,
                mispronouncedInWord: false,
            },
        },
        timerRefs: { current: { word: null, wordSettle: null } },
        timeoutRefs: { current: { target: null } },
        propsRef: { current: { isActive: true, onMispronounced } },
    });

    const sentenceRefs = (onMispronounced) => ({
        stateRefs: {
            current: {
                isMounted: true,
                hasMatched: false,
                mispronouncedSentence: false,
                lastSpeechAt: Date.now() - 6000,
                transcript: "",
            },
        },
        timerRefs: { current: { sentence: null } },
        propsRef: { current: { isActive: true, onMispronounced } },
    });

    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test("armWordTimeout does NOT fire onMispronounced when offline", () => {
        setOnline(false);
        const onMispronounced = vi.fn();
        armWordTimeout("cat", ...Object.values(wordRefs(onMispronounced)));
        vi.advanceTimersByTime(5000);
        expect(onMispronounced).not.toHaveBeenCalled();
    });

    test("armWordTimeout still fires normally when online (regression guard)", () => {
        setOnline(true);
        const onMispronounced = vi.fn();
        armWordTimeout("cat", ...Object.values(wordRefs(onMispronounced)));
        vi.advanceTimersByTime(5000);
        expect(onMispronounced).toHaveBeenCalledTimes(1);
    });

    test("armSentenceTimeout does NOT fire onMispronounced when offline", () => {
        setOnline(false);
        const onMispronounced = vi.fn();
        armSentenceTimeout(...Object.values(sentenceRefs(onMispronounced)));
        vi.advanceTimersByTime(2000);
        expect(onMispronounced).not.toHaveBeenCalled();
    });

    test("armSentenceTimeout still fires normally when online (regression guard)", () => {
        setOnline(true);
        const onMispronounced = vi.fn();
        armSentenceTimeout(...Object.values(sentenceRefs(onMispronounced)));
        vi.advanceTimersByTime(2000);
        expect(onMispronounced).toHaveBeenCalledTimes(1);
    });

    test("an UNDEFINED navigator.onLine fails open (Node/SSR must not silence it)", () => {
        // Node reports navigator.onLine as undefined, not false. A truthiness
        // gate (!navigator.onLine) would suppress the watchdog permanently
        // outside a browser and a real 5s silence would never be judged.
        setOnline(undefined);
        const onMispronounced = vi.fn();
        armWordTimeout("cat", ...Object.values(wordRefs(onMispronounced)));
        vi.advanceTimersByTime(5000);
        expect(onMispronounced).toHaveBeenCalledTimes(1);
    });
});

// ponytail: the "wifi never returns" path — the 60s timer is the floor, and
// what it must leave behind is a durable score, not a dead mic.
describe("handleTimeUp while offline (wifi never returns)", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        setOnline(false);
        routerMock.post.mockReset();
        // Inertia fires onFinish from Request.send()'s .finally(), which runs on
        // a network failure too — that is what releases isSaving.
        routerMock.post.mockImplementation((_u, _p, opts) => opts?.onFinish?.());
    });
    afterEach(() => vi.useRealTimers());

    test("banks the round in the pending session, clears resume, ends GAMEOVER", () => {
        writeResumeSession(7, MID_ROUND);
        expect(sessionStorage.getItem("wordomaticResume:7")).not.toBeNull();

        const { result } = mountMidRound();
        act(() => result.current.handleTimeUp());

        // Score + words_processed + streak live here and replay on next mount.
        expect(readPendingSession(7)).not.toBeNull();
        expect(sessionStorage.getItem("wordomaticResume:7")).toBeNull();
        expect(result.current.gameState).toBe("GAMEOVER");
    });

    test("releases isSaving so the mic is not stuck disabled", () => {
        const { result } = mountMidRound();
        act(() => result.current.handleTimeUp());
        // Microphone is `disabled={gameState === "COUNTDOWN" || isSaving}`.
        expect(result.current.isSaving).toBe(false);
    });
});

describe("persistProgress while offline", () => {
    beforeEach(() => {
        setOnline(false);
        routerMock.post.mockReset();
        routerMock.post.mockImplementation((_u, _p, opts) => opts?.onFinish?.());
    });

    test("still attempts the POST and leaves the round durable", () => {
        const { result } = mountMidRound();

        act(() => result.current.persistProgress());

        // The guard is GET-only, so writes must still be attempted — blocking
        // them skips Request.finish() and strands isSaving (dead mic) while
        // losing the durable commit.
        expect(routerMock.post).toHaveBeenCalledTimes(1);
        expect(routerMock.post.mock.calls[0][0]).toBe(
            "/student/saveWordProgress",
        );
        const pending = readPendingSession(7);
        expect(pending).not.toBeNull();
        expect(pending.words_smashed).toBe(3);
        expect(pending.words_processed).toBe(3);
        expect(pending.streak).toBe(4);
        // onFinish releases the mic even though the request never landed.
        expect(result.current.isSaving).toBe(false);
    });
});

// ponytail: a round must never START without a connection. Offline, the preload
// preconnect bails, connRef stays null and the mic never opens — the child
// stares at 60s of unplayable word-drop, then handleTimeUp persists 0/0 and
// StudentController:558-562 banks a junk 0-score GameSession.
//
// The refusal is SILENT. The modal is not a click reaction: it shows on initial
// mount, the browser `offline` event, and offline page switches (inertia:before).
// A kid tapping the mic asked to PLAY — answering that with a connection error
// reads as a broken app. The mic + TapToStartOverlay say "No Connection"
// themselves, on the exact control he touched.
describe("round start is blocked while offline", () => {
    const guard = read("resources/js/Components/Shared/OfflineGuard.jsx");
    const mic = read("resources/js/Components/Student/Microphone.jsx");
    const overlay = read("resources/js/Components/Student/TapToStartOverlay.jsx");
    const core = read("resources/js/hooks/Student/useGameplayCore.js");

    test("the guard has NO click-reaction channel left", () => {
        // Regression guard: app:offline-reopen was a window CustomEvent fired by
        // the mic tap. It made a play tap raise a connection modal. The guard
        // must keep only mount / offline-event / inertia:before.
        expect(guard).not.toContain("app:offline-reopen");
        expect(readMode).not.toContain("app:offline-reopen");
        expect(speakMode).not.toContain("app:offline-reopen");
    });

    test("the guard still opens on mount, the offline event, and offline GETs", () => {
        expect(guard).toContain("useState(() => !isReachable())");
        expect(guard).toContain('window.addEventListener("offline", goOffline)');
        expect(guard).toContain('window.addEventListener("online", goOnline)');
        expect(guard).toContain('document.addEventListener("inertia:before", blockOfflineVisit)');
        // GET only — writes must still be attempted so pending commits replay.
        expect(guard).toContain('e.detail?.visit?.method !== "get"');
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s returns silently instead of starting", (_name, src) => {
        // No dispatch, no modal, no state change — just a bail. The probe is
        // what makes it honest: navigator.onLine said yes on a WiFi link with
        // no uplink, and the round banked a junk 0/0.
        expect(src).toMatch(/if \(!\(await probeConnection\(\)\)\) return;/);
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s gates inside handleMicrophoneClick, before any startGame", (_name, src) => {
        // Above the tutorial branch too, or the guide's mic step slips past it.
        const fn = src.indexOf("const handleMicrophoneClick");
        const gate = src.indexOf("if (!(await probeConnection())) return;");
        const firstStart = src.indexOf("startGame()");
        expect(fn).toBeGreaterThan(-1);
        expect(gate).toBeGreaterThan(fn);
        expect(gate).toBeLessThan(firstStart);
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s gates the round START on the store, not navigator.onLine", (_name, src) => {
        // navigator.onLine is undefined under Node/SSR, and it reads true on a
        // WiFi link with no uplink; neither answer is usable for a start, and a
        // wrong "yes" is what banked the 0/0 junk row. The fail-open lives in
        // the store (connection.test.js pins it). Prose may still name it, and
        // onRestartFailed still reads it (a Deepgram socket death is a different
        // host — see "keeps all three recovery guards"), so scope to the gate.
        const fn = src.indexOf("const handleMicrophoneClick");
        const code = src
            .slice(fn, src.indexOf("}, [", fn))
            .split("\n")
            .filter((line) => !line.trim().startsWith("//"))
            .join("\n");
        expect(code).not.toContain("navigator.onLine");
        expect(code).toContain("probeConnection()");
    });

    test("useGameplayCore holds the one store subscription and no listener of its own", () => {
        // Both pages reach this hook (Story Quest via useStoryQuestEngine's
        // `...core` spread), so this is the only place the app may subscribe.
        // The window listeners moved to initConnection (app.jsx) — a second
        // pair here would let the two disagree about the same network.
        expect(core).toContain(
            "useSyncExternalStore(subscribeConnection, isReachable)",
        );
        expect(core).not.toContain('window.addEventListener("online"');
        expect(core).not.toContain('window.addEventListener("offline"');
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s renders the offline state on the mic and the overlay", (_name, src) => {
        // The kid must see the reason on the control he tapped.
        expect(src).toContain("offline={!online}");
        expect(src).toContain("noConnection={!online}");
        expect(src).toContain("online,");
    });

    test("Story Quest has no sentence step — nothing divides the read at a period", () => {
        // The student reads one whole paragraph. Every period is a plain word
        // token: no sentence index, no recognizer reset, no guide step that
        // waits for a sentence. Sentence boundaries survive only as end-of-round
        // scoring buckets for the Sentence Star badge.
        expect(speakMode).not.toContain("currentSentenceIndex");
        expect(speakMode).not.toContain("resetKey");
        expect(speakMode).not.toContain("say-sentence-start");
        expect(speakMode).not.toContain('spotlight: "sentence"');
        expect(storyQuest).not.toContain("currentSentenceIndex");
        expect(storyQuest).not.toContain("resetKey");
        // The recognizer kept one continuous transcript across the whole read.
        expect(deepgram).not.toContain("resetKey");
        // The tour's read steps preview the WHOLE paragraph, not one sentence —
        // otherwise IDLE (tour + TapToStartOverlay stage) renders empty and
        // READ IT ALL points at nothing.
        expect(speakMode).toContain("previewWords={speechRecognitionWords}");
    });

    test("the mic prompt ranks live > offline > reconnecting > disabled", () => {
        // disabled means "Get Ready!" (a countdown IS coming); offline means
        // nothing happens at all; reconnecting means a live round is waiting on
        // a socket. All three outrank disabled — wrong order promises a kid a
        // countdown that never runs, or "Listening" on a dead pipe.
        const chain = mic.slice(
            mic.indexOf("const prompt ="),
            mic.indexOf(";", mic.indexOf("const prompt =")),
        );
        const order = ["live", "offline", "reconnecting", "disabled"].map(
            (k) => chain.indexOf(k),
        );
        expect(chain).toContain('"Listening..."');
        expect(chain).toContain('"No Connection"');
        expect(chain).toContain('"Reconnecting..."');
        expect(chain).toContain('"Get Ready!"');
        expect(chain).toContain('"Speak to Smash!"');
        for (const at of order) expect(at).toBeGreaterThan(-1);
        expect([...order].sort((a, b) => a - b)).toEqual(order);
    });

    test("the mic LABEL renders that chain — not a second, shorter one", () => {
        // The chain above was computed into `prompt` and then never rendered:
        // the label recomputed live > disabled > default on its own, dropping
        // offline and reconnecting. So on a dead link the aura dimmed while the
        // prompt still said "Speak to Smash!" — the exact lie the aura fix
        // (useDeepgramRecognition `reconnecting`) exists to prevent.
        expect(mic).toContain("{prompt}");
        // No second ternary chain in the label span.
        const label = mic.slice(mic.indexOf("whitespace-nowrap\">"), mic.indexOf("</span>", mic.indexOf("whitespace-nowrap\">")));
        expect(label).not.toContain("Speak to Smash!");
        expect(label).not.toContain("Get Ready!");
    });

    test("a mic that cannot hear must not pulse like a live one", () => {
        // live drives the aura, the fast spin and the graphic_eq icon. Offline
        // and reconnecting both fall to the idle branch.
        expect(mic).toContain(
            "const live = isListening && !offline && !reconnecting;",
        );
        expect(mic).not.toContain("isListening ? \"graphic_eq\"");
    });

    test("reconnecting is set only while a LIVE round waits on a socket", () => {
        // The mic used to say "Listening..." for the ~400ms the socket needed
        // after the network came back, because the page derives isListening from
        // gameState and that stays true through a dropout. Audio is not buffered
        // (the send at :453 drops it while the socket is still connecting), so
        // the fix is to stop claiming a link that is not up — not to go mic-first.
        const set = deepgram.indexOf("if (propsRef.current.isActive) setReconnecting(true);");
        const bail = deepgram.indexOf("if (!isReachable()) return;", set - 400);
        expect(set).toBeGreaterThan(-1);
        // After the bail: while offline there is nothing to reconnect FROM.
        expect(set).toBeGreaterThan(bail);
        // Never on preload/COUNTDOWN — that would flash at every round start.
        expect(deepgram).not.toContain("setReconnecting(true);\n    };");
        // Cleared the moment the socket is actually up.
        const open = deepgram.indexOf('conn.on("open"');
        expect(deepgram.slice(open, open + 900)).toContain("setReconnecting(false);");
        // And when the ladder gives up, so the mic stops promising a link.
        expect(deepgram).toContain(
            "// Gave up on the ladder — stop claiming a link is coming.\n                    setReconnecting(false);",
        );
    });

    test("reconnecting is cleared when the round ends", () => {
        // A stale true would keep the mic reading "Reconnecting..." on results.
        const at = deepgram.indexOf("}, [isActive]);");
        expect(deepgram.slice(at - 700, at)).toContain("setReconnecting(false);");
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s feeds reconnecting to the mic", (_name, src) => {
        expect(src).toContain("const { reconnecting } = useDeepgramRecognition({");
        expect(src).toContain("reconnecting={reconnecting}");
    });

    test("the overlay's noConnection outranks permissionState", () => {
        // A denied mic is still unplayable offline; Wi-Fi is the first fix.
        // Still display-only — the mic button is the real target.
        expect(overlay).toContain("noConnection = false");
        expect(overlay).toContain("const subtitle = noConnection");
        const conn = overlay.indexOf("const subtitle = noConnection");
        const perm = overlay.indexOf("permissionState != null");
        expect(conn).toBeGreaterThan(-1);
        expect(conn).toBeLessThan(perm);
        expect(overlay).toContain("pointer-events-none");
    });

    test("the preload effect does not preconnect while offline", () => {
        // The root cause: a preconnect startConnection immediately rejects, so
        // connRef stays null and no mic opens for the whole 60s round.
        const preloadStart = deepgram.indexOf("if (preload) {");
        const preconnect = deepgram.indexOf("startConnection();", preloadStart);
        const bail = deepgram.indexOf(
            "if (!isReachable()) return;",
            preloadStart,
        );
        expect(preloadStart).toBeGreaterThan(-1);
        expect(bail).toBeGreaterThan(preloadStart);
        expect(bail).toBeLessThan(preconnect);
    });

    test("the 'online' listener is NOT gated on isActive (mid-round must recover)", () => {
        // Regression guard: gating the preconnect must not stop a LIVE round
        // from reconnecting — that round has a real score in flight and the
        // child is mid-sentence.
        const online = deepgram.indexOf("const onBackOnline = () => {");
        // Window is the whole effect body, comment block included.
        const body = deepgram.slice(online, deepgram.indexOf("}, []);", online));
        expect(online).toBeGreaterThan(-1);
        expect(body).toContain("startConnection();");
        expect(body).not.toContain("isActive");
        expect(body).not.toContain("navigator.onLine === false");
        // startConnection's own guards are what keep this inert after a round ends.
        expect(deepgram).toContain(
            "(!propsRef.current.isActive && !propsRef.current.preload)",
        );
    });

    test("onBackOnline retires a half-open socket so the reconnect is not swallowed", () => {
        // THE hard-refresh bug. The browser does not fire `close` on a
        // half-open WebSocket when a link drops, so connRef.current stayed
        // truthy and startConnection's own guard (`|| connRef.current`)
        // returned early — swallowing the reconnect it was called to make.
        // Recognition stayed dead until the 60s timer, and only a hard
        // refresh (which rebuilds the ref) brought it back.
        const online = deepgram.indexOf("const onBackOnline = () => {");
        const body = deepgram.slice(online, deepgram.indexOf("}, []);", online));
        const retire = body.indexOf("connRef.current = null;");
        const reconnect = body.indexOf("startConnection();");
        expect(retire).toBeGreaterThan(-1);
        // Retire BEFORE reconnecting, or the guard still swallows it.
        expect(retire).toBeLessThan(reconnect);
        // And free the mic, or the dead transport keeps capturing.
        expect(body).toContain("teardownAudio();");
        // Null the ref before close() so a synchronous close is a no-op.
        expect(body.indexOf("connRef.current = null;")).toBeLessThan(
            body.indexOf("stale.close();"),
        );
    });

    test("every socket handler ignores a conn we already replaced", () => {
        // The retirement above closes a socket that may still emit open /
        // message / error / close. Without an identity check the stale
        // handler would null the LIVE connRef, kill the live audio, and burn
        // a restart rung — replacing one recovery bug with a worse one.
        for (const event of ["open", "message", "error", "close"]) {
            const at = deepgram.indexOf(`conn.on("${event}"`);
            expect(at, `conn.on("${event}") missing`).toBeGreaterThan(-1);
            // Bound at the next handler so one handler's guard can never
            // satisfy another's assertion. Comment blocks make a fixed
            // window too small for `open` and too blunt for `close`.
            const next = deepgram.indexOf('conn.on("', at + 1);
            const body = deepgram.slice(at, next === -1 ? at + 600 : next);
            expect(body, `conn.on("${event}") has no identity guard`).toContain(
                "if (connRef.current !== conn) return;",
            );
        }
    });
});

// ponytail: 12 words over 2 sentences — ranges [{0,10},{10,12}]. The last
// batch starts at word 6, i.e. inside the FIRST sentence, which is exactly
// what a fluent reader does when they swallow the tail in one breath. The
// removed `rangeIdx + 1 < ranges.length` guard resolved that batch to range 0
// and returned: no modal, no sound, no advance, verdicts already locked so
// every handler early-returns — a dead round until the 60s cap.
const PARAGRAPH = [
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten.",
    "eleven",
    "twelve.",
].map((word, id) => ({ id, word }));

describe("Story Quest completion from a batch inside a non-final sentence", () => {
    beforeEach(() => {
        vi.useFakeTimers();
        sessionStorage.clear();
        soundsMock.playFeedbackSound.mockClear();
    });
    afterEach(() => vi.useRealTimers());

    const mountStoryQuest = () =>
        renderHook(() =>
            useStoryQuestEngine({
                words: PARAGRAPH,
                totalWords: PARAGRAPH.length,
                moduleId: 707,
                saveEndpoint: "/student/saveParagraphProgress",
            }),
        );

    const startRound = (engine) => {
        act(() => engine.startGame());
        act(() => vi.advanceTimersByTime(4000)); // 3-2-1-GO! → ACTIVE
    };

    test("scores the whole paragraph, plays one sound, and completes", () => {
        const { result } = mountStoryQuest();
        startRound(result.current);

        act(() => result.current.handleWordRecognized(6));
        expect(result.current.currentWordIndex).toBe(6);

        act(() => result.current.handleSentenceVerdict(Array(6).fill("correct")));

        // The message rates the WHOLE paragraph (12/12), never a slice of it,
        // and sentence_scores stays per-sentence for badges/results.
        expect(result.current.sentenceFeedback).toEqual({ message: "Excellent!" });
        expect(result.current.sentenceScores).toEqual([10, 2]);

        // 1000ms silent verdict preview, then the modal and its one sound.
        act(() => vi.advanceTimersByTime(1000));
        expect(result.current.sentenceBreak).toBe(true);
        expect(soundsMock.playFeedbackSound).toHaveBeenCalledTimes(1);
        expect(soundsMock.playFeedbackSound).toHaveBeenCalledWith("Excellent!");

        // 2500ms celebration, then the round ends — not a dead round.
        act(() => vi.advanceTimersByTime(2500));
        expect(result.current.gameState).toBe("COMPLETED");
    });

    test("one message per round even if the tail is batched again", () => {
        const { result } = mountStoryQuest();
        startRound(result.current);

        act(() => result.current.handleWordRecognized(6));
        act(() => result.current.handleSentenceVerdict(Array(6).fill("correct")));
        // A late final for the same tail (the path that used to re-enter
        // completeSentence) must not re-score or replay the celebration.
        act(() => result.current.handleSentenceVerdict(Array(6).fill("correct")));
        act(() => vi.advanceTimersByTime(1000));

        expect(soundsMock.playFeedbackSound).toHaveBeenCalledTimes(1);
    });
});

// The resume-vs-reshuffle boundary. Word Blast's play order lives ONLY in the
// resume record (GameplayReadMode resolveWordOrder reads `wordOrder` back), so
// a record left behind after a round ends means the next play resumes the
// PREVIOUS order — same first word, forever, with no error anywhere:
// words_processed is only a count, so the server never sees the difference.
// clearResume() guards three terminal paths; this pins the outcome, not the
// call sites, so removing a redundant one (they overlap on purpose) is fine
// while losing the guarantee is not.
describe("a finished round leaves no resume record, so the next play reshuffles", () => {
    const mount = () =>
        renderHook(() =>
            useGameplayCore({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveWordProgress",
                scope: "word",
                resumeData: MID_ROUND,
            }),
        );

    const mounted = () => readResumeSession(7, "word");

    test("a mid-round mount writes the record (so the assertions below mean something)", () => {
        mount();
        expect(mounted()).not.toBeNull();
        // The order travels with the index — this is the whole contract the
        // page's resolveWordOrder restores from.
        expect(mounted().wordOrder).toEqual([1, 2, 3, 4, 5]);
        expect(mounted().currentWordIndex).toBe(3);
    });

    test("clock running out clears it", () => {
        const { result } = mount();
        act(() => result.current.handleTimeUp());
        expect(mounted()).toBeNull();
    });

    test("a fatal ASR error clears it", () => {
        const { result } = mount();
        act(() => result.current.handleFatalError());
        expect(mounted()).toBeNull();
    });

    test("reaching the last word (COMPLETED) clears it", () => {
        // index 3 of 5 — two more words and the round completes. This path
        // never goes through handleTimeUp, so it is the one a missing
        // clearResume in the terminal-state effect would slip past.
        const { result } = mount();
        act(() => result.current.moveToNextWord(2));
        expect(result.current.gameState).toBe("COMPLETED");
        expect(mounted()).toBeNull();
    });

    test("a Story Quest record for the same module id stays invisible here", () => {
        // moduleId 7 exists in BOTH tables at level 7 — the collision that
        // scope exists to close. A para record must not read as word, or Word
        // Blast would resume a paragraph position.
        writeResumeSession(7, { scope: "para", currentWordIndex: 2, wordsSmashed: 2, timeLeft: 30 });
        expect(readResumeSession(7, "word")).toBeNull();
        expect(readResumeSession(7, "para")).not.toBeNull();
    });
});
