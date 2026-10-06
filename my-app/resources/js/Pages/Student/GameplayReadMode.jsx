import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";   
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import TutorialGuide, { nextStepIndex } from "@/Components/Student/TutorialGuide";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useEffect, useCallback, useState, useMemo } from "react";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import { useWordBlastEngine } from "@/hooks/Student/useWordBlastEngine";
import { useDeepgramRecognition } from "@/hooks/Student/useDeepgramRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { pauseBackgroundMusic, setMicLive } from "@/utils/sounds";
import { probe as probeConnection, markUnreachable } from "@/utils/connection";
import { normalizeText } from "@/lib/speechUtils";
import { readResumeSession } from "@/utils/resumeStorage";

// ponytail: Word Blast plays in a per-visit shuffle (docs/MODULES.md — word
// modules are "randomized per gameplay"; paragraphs stay in authored order).
// Pure + exported so a unit test can hold the restore-exact property, the same
// trick TutorialGuide.jsx uses for nextStepIndex.
export function resolveWordOrder(baseWords = [], savedOrder = null) {
    const base = Array.isArray(baseWords) ? baseWords : [];
    if (base.length === 0) return base;
    // Restore by ID, not position: ids survive a teacher re-save, positions are
    // never renumbered. String-keyed because Inertia has been known to hand
    // back a numeric id as a string.
    if (Array.isArray(savedOrder) && savedOrder.length === base.length) {
        const byId = new Map(base.map((w) => [String(w.id), w]));
        const restored = savedOrder.map((id) => byId.get(String(id)));
        if (restored.every((w) => w != null)) return restored;
    }
    const shuffled = [...base];
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
}

const GUIDE_STEPS = [
    { id: "read-word", title: "READ THE WORD", message: "Say each word aloud into the mic. Read it right to BLAST it!", emoji: "campaign", color: "accent", action: "tap-continue", spotlight: "word" },
    { id: "score", title: "BLAST & SCORE", message: "Each blast grows your score up top. Blast fast, score big!", emoji: "bolt", color: "accent", action: "tap-continue", spotlight: "score" },
    { id: "streak-timer", title: "STREAK + TIMER", message: "Chain hits to build your streak beat the 60-second clock!", emoji: "timer", color: "accent", action: "tap-continue", spotlight: "timer" },
    { id: "tap-mic", title: "TAP TO PLAY!", message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!", emoji: "mic", color: "accent", action: "tap-mic", spotlight: "mic" },
    { id: "say-it", title: "SAY IT!", message: "Read the word out loud now.", emoji: "campaign", color: "accent", action: "say-word", spotlight: "word" },
];

export default function GameplayReadMode({ module, tutorialComplete = true, tutorialSkipped = false }) {
    const { auth } = usePage().props;
    const isTutorial = !!module?.is_tutorial && !tutorialComplete;
    const isTutorialModule = !!module?.is_tutorial;
    const moduleId = module?.id;

    // ponytail: ONE order, TWO consumers. The engine below decides what the
    // microphone listens for; ReadModeMainContent renders words[currentIndex]
    // as the giant word. If they ever got different arrays the kid would be
    // reading one word while the mic waited for another — so both read this.
    // Not memoized: a Math.random() inside useMemo would reshuffle on any
    // re-render that invalidated it. Lazy useState = once per mount, the same
    // shape as the resume initializers in useGameplayCore.
    const [wordOrder] = useState(() =>
        resolveWordOrder(module?.words, readResumeSession(moduleId, "word")?.wordOrder),
    );

    const {
        totalWords,
        gameState,
        setGameState,
        currentWordIndex,
        wordsSmashed,
        currentStreak,
        isMispronounced,
        isExploding,
        showPointsFeedback,
        pointsFeedbackValue,
        scoreEmphasize,
        feedbackType,
        feedbackMessage,
        streakShake,
        countdownValue,
        targetWord,
        timeLeft,
        isResume,
        isSaving,
        online,
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
        handleFatalError,
        persistProgress,
        refillRoundClock,
        targetWordFalsy,
    } = useWordBlastEngine({
        words: wordOrder,
        totalWords: module?.words?.length ?? 0,
        moduleId,
        deferPersist: isTutorial,
        onWordRecognized: (wordObj) => {
            if (wordObj && !isTutorialModule) {
                axios.post("/student/updateWordMastery", {
                    word_id: wordObj.id,
                    status: "mastered",
                }).catch(console.warn);
            }
        },
        onMispronounce: (wordObj) => {
            if (wordObj && !isTutorialModule) {
                axios.post("/student/updateWordMastery", {
                    word_id: wordObj.id,
                    status: "training",
                }).catch(console.warn);
            }
        },
    });

    const { permissionState, requestPermission } = useMicrophonePermission();

    const [guideStep, setGuideStep] = useState(0);
    const [guideDone, setGuideDone] = useState(() => !isTutorial || isResume);
    const guideStepObj = GUIDE_STEPS[guideStep];
    const guideArmed = isTutorial && !guideDone;

    // ponytail: Bubble → Action → Bubble — tap only advances tour steps; the
    // mic tap and the correct read advance their own steps (no blind increment).
    const completeGuideEvent = useCallback((event) => {
        if (!isTutorial || guideDone) return;
        const next = nextStepIndex(GUIDE_STEPS, guideStep, event);
        if (next >= GUIDE_STEPS.length) {
            setGuideDone(true);
        } else if (next !== guideStep) {
            setGuideStep(next);
        }
    }, [isTutorial, guideDone, guideStep]);

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState, setGameState]);

    const handleMicrophoneClick = useCallback(async () => {
        // ponytail: refuse to START a round the server cannot serve. Without
        // this the round begins, the preload preconnect bails, and the kid
        // stares at 60s of unplayable word-drop before handleTimeUp persists
        // 0/0 — which StudentController:558-562 has no zero-guard for, so it
        // banks a junk 0-score GameSession + 0-smashed progress row.
        //
        // The store's probe, NOT navigator.onLine: that only reports the
        // interface is up, so a WiFi link with no uplink (captive portal, dead
        // router, weak LTE) read as online and waved the round onto a dead
        // link. One GET /up (~0.1-0.2s) decides it BEFORE the countdown, so a
        // dead link never opens a round. Imperative, not `online`: click-time
        // truth, no render lag.
        //
        // SILENT on purpose: the probe already flipped the store, so the mic
        // and the TapToStartOverlay already read "No Connection" from `online`,
        // so the kid sees why on the very control he tapped. Dispatching a modal
        // here instead read as a broken app — he asked to PLAY, not to check
        // the network.
        if (!(await probeConnection())) return;
        if (guideArmed) {
            // ponytail: the tour's mic step is the ONLY tour moment the mic is
            // live — the tap itself is the required action (tap-mic advances).
            if (guideStepObj?.action !== "tap-mic" || gameState !== "IDLE") return;
            if (permissionState === "prompt") {
                const granted = await requestPermission();
                if (!granted) return;
            }
            completeGuideEvent("tap-mic");
            startGame();
            return;
        }
        if (gameState === "IDLE") {
            if (permissionState === "prompt") {
                const granted = await requestPermission();
                if (!granted) return;
            }
            startGame();
        }
    }, [guideArmed, guideStepObj, gameState, permissionState, requestPermission, completeGuideEvent, startGame]);

    useEffect(() => {
        if (gameState === "COUNTDOWN" || gameState === "ACTIVE") {
            // ponytail: pause BGM at COUNTDOWN, not ACTIVE — mic access +
            // countdown SFX + BGM all fighting is the AUDIO→CALL→AUDIO blip
            // the phone hears when the mic permission dialog fires mid-BGM.
            pauseBackgroundMusic();
            setMicLive(true);
        } else {
            // ponytail: micLive is read by the /student click listener as an
            // early-return (sounds.js) — leaving it true after the round kills
            // BGM AND every SFX for the rest of this page's life.
            setMicLive(false);
        }
    }, [gameState]);

    useEffect(() => {
        return () => setMicLive(false);
    }, []);

    // ponytail: YAGNI — keyterm batch only (10 words at open, no reconnect per word)
    const readKeyterms = useMemo(
        () => [...new Set((module?.words ?? []).map((w) => normalizeText(w.word)).filter(Boolean))].slice(0, 10),
        [module?.words],
    );

    const cheerTimerRef = useMemo(() => ({ current: null }), []);

    const { reconnecting } = useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE",
        muted: isExploding,
        targetWord: targetWord,
        keyterms: readKeyterms,
        onWordRecognized: (count) => {
            // ponytail: capture before we flip guideDone — feedbackType arrives
            // one render later, by which guideArmed is already false.
            const shouldCheer = guideArmed && guideStepObj?.action === "say-word";
            handleWordRecognized(count);
            if (shouldCheer) {
                setCheerActive(true);
                clearTimeout(cheerTimerRef.current);
                cheerTimerRef.current = setTimeout(() => setCheerActive(false), 1500);
            }
            // ponytail: SAY IT step completes on the real BLAST — mispronounces
            // only raise the coach (no advance), so the kid reads it right once.
            // No-op in main entry (guideDone already true).
            completeGuideEvent("say-word");
        },
        onPermissionDenied: () => setGameState("DENIED"),
        onMispronounced: handleMispronounce,
        // ponytail: token_failed is the ASR saying the uplink is dead — the
        // socket never opened, so the round has no score to bank. refillRoundClock
        // is the one recovery path that does NOT persist (handleFatalError would
        // POST the 0/0), and it returns the kid to IDLE in ~4s instead of 60s.
        onRecognitionError: (err) => {
            console.error("Recognition error:", err);
            if (err !== "token_failed") return;
            markUnreachable("server");
            if (!isResume && !isTutorial) refillRoundClock();
        },
        // ponytail: order is load-bearing — handleFatalError persists the aborted
        // round FIRST (durable sessionStorage commit); refillRoundClock then wipes
        // hasSaved and sends us back to IDLE. Reversed = the score is lost.
        // Guards: onLine avoids an 8s dead-mic retry loop; !isTutorial keeps the
        // celebration bubble; !isResume avoids an IDLE round with no overlay to start.
        onRestartFailed: () => {
            handleFatalError();
            if (!isResume && !isTutorial && navigator.onLine) refillRoundClock();
        },
    });
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [coachActive, setCoachActive] = useState(false);
    const [coachLeaving, setCoachLeaving] = useState(false);
    const [cheerActive, setCheerActive] = useState(false);
    const [coachHint, setCoachHint] = useState("");
    // ponytail: monotonic, NOT the hint — 3 random hints repeat 1/3 of the
    // time and React bails out of an identical setState, so a key off coachHint
    // would leave a repeat mispronounce with zero visual delta.
    const [coachSeq, setCoachSeq] = useState(0);

    const HINTS = useMemo(
        () => ["Try to come closer to the mic!", "Try louder!", "That's okay, you're doing great!"].map((h) => `HINT: ${h}`),
        [],
    );

    useEffect(() => {
        if (isMispronounced) {
            setCoachLeaving(false);
            setCoachHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
            setCoachSeq((n) => n + 1);
            setCoachActive(true);
            const t = setTimeout(() => setCoachActive(false), isTutorial ? 1500 : 1200);
            return () => clearTimeout(t);
        }
    }, [isMispronounced, isTutorial, HINTS]);

    useEffect(() => {
        if (feedbackType === "correct" && coachActive) {
            setCoachLeaving(true);
            const t = setTimeout(() => {
                setCoachActive(false);
                setCoachLeaving(false);
            }, 300);
            return () => clearTimeout(t);
        }
    }, [feedbackType, coachActive]);

    useEffect(() => () => clearTimeout(cheerTimerRef.current), []);

    // ponytail: final tutorial presentation — when the TargetWord array is
    // falsy (all words done: currentWordIndex >= totalWords → targetWord ""),
    // don't jump straight to Dashboard. Hold COMPLETED/GAMEOVER, show a full
    // celebration bubble, then persist on tap.
    const isTutorialCompletePending = isTutorial && (gameState === "COMPLETED" || gameState === "GAMEOVER");

    const handleFinalTutorialContinue = useCallback(() => {
        persistProgress();
    }, [persistProgress]);

    const tapGuide = () => completeGuideEvent("tap");

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        currentIndex: currentWordIndex,
        totalWords: totalWords,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
        timeLeft,
        mode: "read",
        spotlight: guideArmed ? (guideStepObj?.spotlight ?? null) : null,
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
            <DeniedModal gameState={gameState} />
            <GameplayHeader {...headerProps} />
            <ReadModeMainContent
                words={wordOrder}
                currentIndex={Math.max(
                    0,
                    Math.min(currentWordIndex, totalWords - 1),
                )}
                gameState={gameState}
                countdownValue={countdownValue}
                isExploding={isExploding}
                isMispronounced={isMispronounced}
                showPointsFeedback={showPointsFeedback}
                pointsFeedbackValue={pointsFeedbackValue}
                streak={currentStreak}
                feedbackType={feedbackType}
                feedbackMessage={feedbackMessage}
                streakShake={streakShake}
            />
            {/* ponytail: final presentation blocks the guide */}
            {isTutorialCompletePending && bodyUrl ? (
                <AvatarSpeechBubble
                    emoji="celebration"
                    title="DONE!"
                    message="Next: Story Quest"
                    bodyUrl={bodyUrl}
                    color="accent"
                    position="center"
                    onClick={handleFinalTutorialContinue}
                    variant="mini"
                />
            ) : (
                <>
                    {/* ponytail: no-clash — guide yields to coach/cheer so exactly one
                        bubble shows; the step index is preserved while they are up. */}
                    <TutorialGuide
                    steps={GUIDE_STEPS}
                        stepIndex={guideStep}
                        color="accent"
                        bodyUrl={bodyUrl}
                        hidden={!guideArmed}
                        hideBubble={coachActive || cheerActive}
                        onTap={tapGuide}
                    />
                    {cheerActive && !coachActive && bodyUrl && (
                        <AvatarSpeechBubble
                            emoji="celebration"
                            title="AWESOME!"
                            message="You read it right — BLASTED!"
                            bodyUrl={bodyUrl}
                            color="accent"
                            position="bottom-right"
                            variant="mini"
                        />
                    )}
                </>
            )}
            {/* ponytail: isTutorialCompletePending gates this too, not just the
                guide branch below. handleTimeUp clears the engine's
                mispronounceTimer, so setIsMispronounced(false) never runs and
                coachActive survives its own 1.5s timer — a mispronounce inside
                that window used to mount DONE (center) and NICE TRY
                (bottom-right) at once. Render guard, not a state reset: the
                engine is shared with Story Quest and Speak. */}
            {coachActive && !isTutorialCompletePending && bodyUrl && (
                <AvatarSpeechBubble
                    key={coachSeq}
                    emoji="sentiment_very_satisfied"
                    title="NICE TRY!"
                    message={coachHint}
                    bodyUrl={bodyUrl}
                    color="accent"
                    position="bottom-right"
                    variant="mini"
                    pulseMessage
                    className={coachLeaving ? "opacity-0 transition-opacity duration-300" : ""}
                />
            )}
            {gameState === "IDLE" && !isResume && !isTutorialCompletePending && (!guideArmed || guideStepObj?.action === "tap-mic") && (
                <TapToStartOverlay
                    color="accent"
                    permissionState={permissionState}
                    spotlight={guideArmed}
                    noConnection={!online}
                />
            )}
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN" || isSaving}
                    offline={!online}
                    reconnecting={reconnecting}
                    onClick={handleMicrophoneClick}
                    color="accent"
                    spotlight={guideArmed && guideStepObj?.spotlight === "mic"}
                />
            </div>
        </div>
    );
}
