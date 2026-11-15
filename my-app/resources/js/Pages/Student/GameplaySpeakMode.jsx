import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { usePage, router } from "@inertiajs/react";
import axios from "axios";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import TutorialGuide, { nextStepIndex } from "@/Components/Student/TutorialGuide";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStoryQuestEngine } from "@/hooks/Student/useStoryQuestEngine";
import { useDeepgramRecognition } from "@/hooks/Student/useDeepgramRecognition";
import ArcadeBackground from "@/Components/Shared/ArcadeBackground";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { pauseBackgroundMusic, setMicLive } from "@/utils/sounds";
import { probe as probeConnection, markUnreachable } from "@/utils/connection";
import { normalizeText } from "@/lib/speechUtils";

// ponytail: SQ mechanics ONLY — score/timer/streak/mic-basics/pronounced/
// mispronounced were already taught in Word Blast and are NOT re-introduced.
// One read of the WHOLE paragraph: no step, and no spotlight, is per-sentence
// (`spotlight` is read only as `=== "mic"`, so the read steps declare none).
const GUIDE_STEPS = [
    { id: "read-it-all", title: "READ IT ALL", message: "Read straight through to the end!", emoji: "menu_book", color: "quest", action: "tap-continue" },
    // ponytail: the color words carry their own verdict colors (quest/accent/
    // rose-400 — same as the karaoke borders), so the bubble IS the legend.
    // Kept to one short line so the mini bubble never covers the preview.
    { id: "light-up", title: "COLORS TALK!", message: (<> <span className="text-quest font-black">BLUE</span> = your word. <span className="text-accent font-black">GREEN</span> = right! <span className="text-rose-400 font-black">RED</span> = try again. </>), emoji: "auto_awesome", color: "quest", action: "tap-continue" },
    { id: "score-card", title: "SCORE CARD", message: "At the end you get a score card for the whole paragraph!", emoji: "celebration", color: "quest", action: "tap-continue" },
    { id: "tap-mic", title: "TAP TO PLAY!", message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!", emoji: "mic", color: "quest", action: "tap-mic", spotlight: "mic" }
];

export default function GameplaySpeakMode({ module, tutorialComplete = true, tutorialSkipped = false, wordTutorialDone = false, speakTutorialDone = false }) {
    const { auth } = usePage().props;
    const isTutorial = !!module?.is_tutorial && !tutorialComplete;
    const isTutorialModule = !!module?.is_tutorial;
    const speechRecognitionWords = useMemo(() => module?.words?.map((w) => w.word) ?? [], [module?.words]);

    const [progressCount, setProgressCount] = useState(0);

    const {
        totalWords,
        gameState,
        setGameState,
        currentWordIndex,
        wordsSmashed,
        isMispronounced,
        isNoSpeech,
        scoreEmphasize,
        feedbackType,
        showPointsFeedback,
        pointsFeedbackValue,
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
        handleSentenceVerdict,
        handleFatalError,
        persistProgress,
        refillRoundClock,
        clearResume,
        verdicts,
        sentenceFeedback,
        sentenceBreak,
    } = useStoryQuestEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        moduleId: module?.id,
        deferPersist: isTutorial,
        onWordRecognized: (wordObj) => {
            if (wordObj && !isTutorialModule) {
                axios.post("/student/updateParagraphMastery", {
                    paragraph_word_id: wordObj.id,
                    status: "mastered",
                }).catch(console.warn);
            }
        },
        onMispronounce: (wordObj) => {
            setProgressCount(0);
            if (wordObj && !isTutorialModule) {
                axios.post("/student/updateParagraphMastery", {
                    paragraph_word_id: wordObj.id,
                    status: "training",
                }).catch(console.warn);
            }
        },
    });

    const { permissionState, requestPermission, markDenied } = useMicrophonePermission();

    const [guideStep, setGuideStep] = useState(0);
    // ponytail: SQ tour gates on speakTutorialDone ONLY — finishing Word Blast
    // must not skip it (karaoke/score-card mechanics differ entirely).
    // wordTutorialDone stays in props (backend sends it) but no longer gates.
    const [guideDone, setGuideDone] = useState(() => !isTutorial || speakTutorialDone || isResume);
    const guideStepObj = GUIDE_STEPS[guideStep];
    const guideArmed = isTutorial && !guideDone;

    // ponytail: Bubble → Action → Bubble — same machine as Word Blast.
    const completeGuideEvent = useCallback((event) => {
        if (!isTutorial || guideDone) return;
        const next = nextStepIndex(GUIDE_STEPS, guideStep, event);
        if (next >= GUIDE_STEPS.length) {
            setGuideDone(true);
        } else if (next !== guideStep) {
            setGuideStep(next);
        }
    }, [isTutorial, guideDone, guideStep]);

    const tapGuide = () => completeGuideEvent("tap");

    // ponytail: same as Word Blast — when targetWord is falsy (COMPLETED/
    // GAMEOVER) hold the persist for a short final bubble before GameResults.
    const isTutorialCompletePending = isTutorial && (gameState === "COMPLETED" || gameState === "GAMEOVER");
    const handleFinalTutorialContinue = useCallback(() => {
        persistProgress();
    }, [persistProgress]);

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
            return;
        }
        // ponytail: the REVERSE edge — same as GameplayReadMode.jsx. Without it
        // gameState latched at DENIED forever (overlay and mic click are both
        // IDLE-only), so the modal had no way out even after re-granting.
        // refillRoundClock keeps word position + verdicts, so the kid resumes
        // rather than losing the round. Guarded on DENIED so an already-granted
        // mount cannot touch gameState.
        if (permissionState === "granted" && gameState === "DENIED") {
            refillRoundClock();
        }
    }, [permissionState, gameState, setGameState, refillRoundClock]);

    const handlePermissionDenied = useCallback(() => {
        // ponytail: mid-round NotAllowedError path — sync the hook's own state so
        // it matches gameState and the recovery edge above can see it.
        markDenied();
        setGameState("DENIED");
    }, [setGameState, markDenied]);

    const handleMicrophoneClick = useCallback(async () => {
        // ponytail: refuse to START a round the server cannot serve. Without
        // this the round begins, the token fetch fails three times, and the kid
        // stares at 60s of nothing before handleTimeUp persists 0/0 — which
        // StudentController:558-562 has no zero-guard for, so it banks a junk
        // 0-score GameSession plus a 0-smashed progress row.
        //
        // The store's probe, NOT navigator.onLine: a WiFi link with no uplink
        // (captive portal, dead router, weak LTE) reads as online, so the old
        // gate waved the round through onto a dead link. One GET /up
        // (~0.1-0.2s on Aiven sfo) decides it BEFORE the countdown, so a dead
        // link never opens a round and nothing can be persisted. Imperative, not
        // `online`: click-time truth, no render lag.
        //
        // SILENT on purpose: the probe already flipped the store, so the mic
        // and the TapToStartOverlay read "No Connection" from `online` and the
        // kid sees why on the control he tapped. Dispatching a modal here
        // instead read as a broken app — he asked to PLAY, not to check the
        // network. Must stay above the tutorial branch and above the first
        // startGame call (locked by gameplayRecovery.test.js).
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
            // ponytail: micLive early-returns the /student click listener
            // (sounds.js) — leaving it true after the round kills BGM + SFX.
            setMicLive(false);
        }
    }, [gameState]);

    useEffect(() => {
        return () => setMicLive(false);
    }, []);

    // ponytail: YAGNI — keyterm batch only (sentence words at open, no reconnect per word)
    const speakKeyterms = useMemo(
        () => [...new Set((module?.words ?? []).map((w) => normalizeText(w.word)).filter(Boolean))].slice(0, 10),
        [module?.words],
    );

    const speakLookahead = useMemo(() => {
        const words = module?.words ?? [];
        return words
            .slice(currentWordIndex, currentWordIndex + 6)
            .map((w) => normalizeText(w.word))
            .filter(Boolean)
            .join(" ");
    }, [module?.words, currentWordIndex]);

    useEffect(() => {
        setProgressCount(0);
    }, [currentWordIndex, module?.id]);

    const handleSpeakProgress = useCallback((n) => {
        setProgressCount(n);
    }, []);

    // ponytail: derived, not stored — speech has started if interim matched
    // anything or any verdict locked. Drives the karaoke mount states.
    const hasSpoken = progressCount > 0 || Object.keys(verdicts).length > 0;

    // ponytail: pause state must be declared BEFORE the ASR hook reads it
    // (`preload` keeps the socket warm while paused) — a later `const` is a
    // temporal-dead-zone crash on every render.
    const [isPaused, setIsPaused] = useState(false);
    const [showExitConfirm, setShowExitConfirm] = useState(false);
    const exitGuardRef = useMemo(() => ({ current: false }), []);

    const handlePause = useCallback(() => {
        if (gameState !== "ACTIVE") return;
        setIsPaused(true);
        setGameState("PAUSED");
    }, [gameState, setGameState]);

    const handleResume = useCallback(() => {
        setShowExitConfirm(false);
        setIsPaused(false);
        setGameState("COUNTDOWN");
    }, [setGameState]);

    const handleExitRequest = useCallback(() => setShowExitConfirm(true), []);
    const handleExitCancel = useCallback(() => setShowExitConfirm(false), []);
    const handleExitConfirm = useCallback(() => {
        if (exitGuardRef.current) return;
        exitGuardRef.current = true;
        setShowExitConfirm(false);
        setIsPaused(false);
        // Exit abandons the round: drop the tab resume record so LevelsPage
        // offers PLAY. The pending key is deliberately untouched — it may be a
        // failed final POST still awaiting replay.
        clearResume();
        router.visit("/student/dashboard");
    }, [clearResume]);

    const { reconnecting } = useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE" || isPaused,
        muted: isPaused || sentenceBreak,
        targetWord: targetWord,
        targetIndex: currentWordIndex,
        keyterms: speakKeyterms,
        lookahead: speakLookahead,
        onProgress: handleSpeakProgress,
        onWordRecognized: handleWordRecognized,
        onSentenceVerdict: handleSentenceVerdict,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        // ponytail: token_failed is the ASR saying the uplink is dead — the
        // socket never opened, so the round has no score to bank and nothing
        // real was learned. refillRoundClock is the one recovery path that does
        // NOT persist (handleFatalError would POST the 0/0), and it returns the
        // kid to IDLE in ~4s instead of 60s. The overlay already reads "No
        // Connection" because markUnreachable flipped the store.
        onRecognitionError: (err) => {
            if (err !== "token_failed") return;
            markUnreachable("server");
            if (!isResume && !isTutorial) refillRoundClock();
        },
        // ponytail: order is load-bearing — handleFatalError (the SQ wrapper,
        // which also clearBreak()s the celebration timers) persists FIRST, then
        // refillRoundClock returns to IDLE. Reversed = the score is lost.
        // Same three guards as Word Blast; see GameplayReadMode.jsx.
        onRestartFailed: () => {
            handleFatalError();
            if (!isResume && !isTutorial && navigator.onLine) refillRoundClock();
        },
        matchMode: "sentence",
    });

    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [coachActive, setCoachActive] = useState(false);
    const [coachLeaving, setCoachLeaving] = useState(false);
    const [coachHint, setCoachHint] = useState("");
    // ponytail: monotonic, NOT the hint — 3 random hints repeat 1/3 of the
    // time and React bails out of an identical setState, so a key off coachHint
    // would leave a repeat mispronounce with zero visual delta.
    const [coachSeq, setCoachSeq] = useState(0);
    const coachTimerRef = useMemo(() => ({ current: null }), []);

    // hint rolls per trigger via Math.random
    const HINTS = useMemo(
        () => ["Try to come closer to the mic!", "Try louder!", "That's okay, you're doing great!"].map((h) => `HINT: ${h}`),
        [],
    );
    const NO_SPEECH_HINTS = useMemo(
        () => [
            "HINT: I can't hear you yet try speaking!",
            "HINT: Speak up, I'm listening!",
            "HINT: Let's say the word together!",
            "HINT: Your turn say it out loud!",
            "HINT: I'm ready when you are!",
        ],
        [],
    );

    // ponytail: fires on every isMispronounced rising edge — the same shape as
    // GameplayReadMode. The ref latch this replaced was written for the
    // per-sentence-break design d3a540a removed: its only consumer depended on
    // [sentenceBreak, gameState, HINTS], and a ref has no dep, so nothing ever
    // re-ran it. sentenceBreak now flips true only at the END of the paragraph,
    // where that effect's own guard bails — so the bubble never appeared
    // outside the tutorial at all.
    useEffect(() => {
        if (!isMispronounced) return;
        setCoachLeaving(false);
        if (isNoSpeech) setCoachHint(NO_SPEECH_HINTS[Math.floor(Math.random() * NO_SPEECH_HINTS.length)]);
        else setCoachHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
        setCoachSeq((n) => n + 1);
        setCoachActive(true);
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
        coachTimerRef.current = setTimeout(() => setCoachActive(false), isNoSpeech ? 2500 : 1800);
    }, [isMispronounced, isNoSpeech, HINTS, NO_SPEECH_HINTS]);
    useEffect(() => () => {
        if (coachTimerRef.current) clearTimeout(coachTimerRef.current);
    }, []);

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
        mode: "speak",
        spotlight: null,
        isPaused,
        showExitConfirm,
        onPause: handlePause,
        onResume: handleResume,
        onExitRequest: handleExitRequest,
        onExitCancel: handleExitCancel,
        onExitConfirm: handleExitConfirm,
    };

    return (
        <div className="bg-background text-on-background font-body-md h-dvh flex flex-col overflow-hidden relative isolate">
            <ArcadeBackground />
            <DeniedModal gameState={gameState} onRetry={requestPermission} />
            <GameplayHeader {...headerProps} />
            {isTutorialCompletePending && bodyUrl ? (
                <AvatarSpeechBubble
                    emoji="celebration"
                    title="TUTORIAL DONE!"
                    message="Both modes complete!"
                    bodyUrl={bodyUrl}
                    color="quest"
                    position="center"
                    onClick={handleFinalTutorialContinue}
                    variant="mini"
                />
            ) : (
                <>
                    {gameState === "IDLE" && !isResume && (!guideArmed || guideStepObj?.action === "tap-mic") && (
                        <TapToStartOverlay color="quest" permissionState={permissionState} spotlight={guideArmed} noConnection={!online} />
                    )}
                    {/* ponytail: no-clash priority — the mispronounce coach
                        outranks the guide; the guide hides and the step is
                        kept. Straight-through: no mid-round break exists, the
                        only break left is the final celebration. */}
                    <TutorialGuide
                        steps={GUIDE_STEPS}
                        stepIndex={guideStep}
                        color="quest"
                        bodyUrl={bodyUrl}
                        hidden={!guideArmed}
                        hideBubble={coachActive}
                        onTap={tapGuide}
                        variant="mini"
                    />
                    {coachActive && bodyUrl && (
                        <AvatarSpeechBubble
                            key={coachSeq}
                            emoji="sentiment_very_satisfied"
                            title={NO_SPEECH_HINTS.includes(coachHint) ? "NO SPEAKING!" : "NICE TRY!"}
                            message={coachHint}
                            bodyUrl={bodyUrl}
                            color="quest"
                            position="bottom-right"
                            variant="mini"
                            pulseMessage
                            className={coachLeaving ? "opacity-0 transition-opacity duration-300" : ""}
                        />
                    )}
                </>
            )}
            <SpeakModeMainContent
                words={speechRecognitionWords}
                currentIndex={Math.max(0, Math.min(currentWordIndex, totalWords - 1))}
                verdicts={verdicts}
                sentenceFeedback={sentenceFeedback}
                sentenceBreak={sentenceBreak}
                highlightCount={progressCount}
                gameState={gameState}
                countdownValue={countdownValue}
                isResume={isResume}
                hasSpoken={hasSpoken}
                previewWords={speechRecognitionWords}
            />
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN" || isSaving}
                    offline={!online}
                    reconnecting={reconnecting}
                    onClick={handleMicrophoneClick}
                    color="quest"
                    spotlight={guideArmed && guideStepObj?.spotlight === "mic"}
                />
            </div>
        </div>
    );
}
