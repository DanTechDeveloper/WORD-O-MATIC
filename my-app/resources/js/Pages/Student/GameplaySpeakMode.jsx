import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { usePage } from "@inertiajs/react";
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
    { id: "light-up", title: "WATCH IT LIGHT UP", message: "BLUE is the word you're on. GREEN means you said it right! RED means try that one again.", emoji: "auto_awesome", color: "quest", action: "tap-continue" },
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

    const { permissionState, requestPermission } = useMicrophonePermission();

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
        }
    }, [permissionState, setGameState]);

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, [setGameState]);

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

    const { reconnecting } = useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE",
        muted: sentenceBreak,
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

    // hint rolls per trigger via Math.random
    const HINTS = useMemo(
        () => ["Try to come closer to the mic!", "Try louder!", "That's okay, you're doing great!"].map((h) => `HINT: ${h}`),
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
        setCoachHint(HINTS[Math.floor(Math.random() * HINTS.length)]);
        setCoachSeq((n) => n + 1);
        setCoachActive(true);
        const t = setTimeout(() => setCoachActive(false), 1800);
        return () => clearTimeout(t);
    }, [isMispronounced, HINTS]);

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
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden relative isolate">
            <ArcadeBackground />
            <DeniedModal gameState={gameState} />
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
                            title="NICE TRY!"
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
                showLegend={isTutorial}
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
