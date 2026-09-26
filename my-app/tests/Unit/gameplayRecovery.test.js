// @vitest-environment happy-dom
// ponytail: real hook test — behaviour, not file text. Same pattern as
// useDeepgramRecognition.test.js: mock every external boundary (Inertia router,
// sounds), leave the engine's own state machine under test.
import { renderHook, act } from "@testing-library/react";
import { useGameplayCore } from "@/hooks/Student/useGameplayCore";
import { armWordTimeout, armSentenceTimeout } from "@/lib/speechProcessors";
import { writeResumeSession, readPendingSession } from "@/utils/resumeStorage";
import fs from "fs";

const read = (p) => fs.readFileSync(p, "utf8");
const readMode = read("resources/js/Pages/Student/GameplayReadMode.jsx");
const speakMode = read("resources/js/Pages/Student/GameplaySpeakMode.jsx");
const resumeStorage = read("resources/js/utils/resumeStorage.js");
const deepgram = read("resources/js/hooks/Student/useDeepgramRecognition.js");
const speechProcessors = read("resources/js/lib/speechProcessors.js");

// ponytail: happy-dom exposes navigator.onLine as a prototype getter, so the
// instance has to be shadowed. Restored after every test.
const setOnline = (value) =>
    Object.defineProperty(window.navigator, "onLine", {
        value,
        configurable: true,
    });
afterEach(() => setOnline(true));

const routerMock = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("@inertiajs/react", () => ({ router: routerMock }));
vi.mock("@/utils/sounds", () => ({
    playSuccessSound: vi.fn(),
    playFeedbackSound: vi.fn(),
    playMispronounceFeedback: vi.fn(),
}));

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

// ponytail: the one connectivity subscription, tested as behaviour not file
// text. It exists so the mic and the TapToStartOverlay can say "No Connection"
// — the modal deliberately does NOT react to it.
describe("online state tracks the browser connectivity events", () => {
    const mount = () =>
        renderHook(() =>
            useGameplayCore({
                words: WORDS,
                totalWords: WORDS.length,
                moduleId: 7,
                saveEndpoint: "/student/saveWordProgress",
            }),
        );

    test("mounts online", () => {
        expect(mount().result.current.online).toBe(true);
    });

    test("flips to false on the offline event and back on online", () => {
        const { result } = mount();
        act(() => {
            setOnline(false);
            window.dispatchEvent(new Event("offline"));
        });
        expect(result.current.online).toBe(false);
        act(() => {
            setOnline(true);
            window.dispatchEvent(new Event("online"));
        });
        expect(result.current.online).toBe(true);
    });

    test("unsubscribes on unmount", () => {
        const remove = vi.spyOn(window, "removeEventListener");
        const { unmount } = mount();
        unmount();
        const events = remove.mock.calls.map((c) => c[0]);
        expect(events).toContain("online");
        expect(events).toContain("offline");
        remove.mockRestore();
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
        expect(src.indexOf("handleFatalError();")).toBeGreaterThan(-1);
        expect(src.indexOf("handleFatalError();")).toBeLessThan(
            src.indexOf("refillRoundClock();"),
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
    ])("%s releases micLive when leaving ACTIVE", (_name, src) => {
        // sounds.js early-returns the /student click listener on micLive —
        // leaving it true after the round kills BGM and every SFX.
        expect(src).toMatch(
            /if \(gameState === "ACTIVE"\) \{[\s\S]*?\} else \{[\s\S]*?setMicLive\(false\);/,
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

    test("the ASR hook bails when offline and re-arms on 'online'", () => {
        // Without the online listener the bail strands the round for the full
        // 60s — every ladder rung is a no-op while the link is down.
        expect(deepgram).toContain("if (!navigator.onLine) return;");
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
        const bail = deepgram.indexOf("if (!navigator.onLine) return;", closeStart);
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
        expect(guard).toContain("useState(() => !navigator.onLine)");
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
        // No dispatch, no modal, no state change — just a bail.
        expect(src).toMatch(/if \(navigator\.onLine === false\) return;/);
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s gates inside handleMicrophoneClick, before any startGame", (_name, src) => {
        // Above the tutorial branch too, or the guide's mic step slips past it.
        const fn = src.indexOf("const handleMicrophoneClick");
        const gate = src.indexOf("if (navigator.onLine === false) return;");
        const firstStart = src.indexOf("startGame()");
        expect(fn).toBeGreaterThan(-1);
        expect(gate).toBeGreaterThan(fn);
        expect(gate).toBeLessThan(firstStart);
    });

    test.each([
        ["GameplayReadMode", readMode],
        ["GameplaySpeakMode", speakMode],
    ])("%s uses === false, never a truthiness gate", (_name, src) => {
        // navigator.onLine is undefined under Node/SSR; an `if (!navigator.onLine`
        // gate would block the round there and kill the watchdog verdict path.
        expect(src).toContain("navigator.onLine === false");
        expect(src).not.toContain("if (!navigator.onLine");
    });

    test("useGameplayCore owns the one connectivity subscription and fails open", () => {
        // Both pages reach this hook (Story Quest via useStoryQuestEngine's
        // `...core` spread), so this is the only place the listeners may live.
        expect(core).toContain('window.addEventListener("online", sync)');
        expect(core).toContain('window.addEventListener("offline", sync)');
        expect(core).toContain('window.removeEventListener("online", sync)');
        // !== false, not navigator.onLine: undefined under Node/SSR must read
        // as online, matching the click gate's fail-open.
        expect(core).toContain("useState(() => navigator.onLine !== false)");
        expect(core).toContain("setOnline(navigator.onLine !== false)");
        expect(core).not.toContain("useState(() => navigator.onLine)");
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
        const bail = deepgram.indexOf("if (!navigator.onLine) return;", set - 400);
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
            "if (navigator.onLine === false) return;",
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
