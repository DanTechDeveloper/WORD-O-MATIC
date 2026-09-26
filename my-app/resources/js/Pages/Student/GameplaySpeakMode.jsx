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
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { pauseBackgroundMusic, setMicLive } from "@/utils/sounds";
import { normalizeText } from "@/lib/speechUtils";

// ponytail: SQ mechanics ONLY — score/timer/streak/mic-basics/pronounced/
// mispronounced were already taught in Word Blast and are NOT re-introduced.
const GUIDE_STEPS = [
    { id: "read-sentence", title: "READ IT ALL", message: "Read straight through to the end — basahin nang diretso hanggang dulo!", emoji: "menu_book", color: "quest", action: "tap-continue", spotlight: "sentence" },
    { id: "light-up", title: "WATCH IT LIGHT UP", message: "Words glow BLUE as you say them. GREEN locks in — RED moves on, so keep reading!", emoji: "auto_awesome", color: "quest", action: "tap-continue", spotlight: "sentence" },
    { id: "sentence-score", title: "SCORE CARD", message: "At the end you get a score card for the whole paragraph!", emoji: "celebration", color: "quest", action: "tap-continue", spotlight: "sentence" },
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
        currentSentenceIndex,
        wordsSmashed,
        isMispronounced,
        scoreEmphasize,
        feedbackType,
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
    // must not skip it (karaoke/sentence-score mechanics differ entirely).
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
        // ponytail: refuse to START a round with no connection — same reason as
        // Word Blast: a round that begins offline never opens the mic, and its
        // 0/0 persist banks a junk 0-score GameSession (no server zero-guard at
        // StudentController:558-562). SILENT on purpose: the mic and the
        // TapToStartOverlay already read "No Connection" from `online`, so the
        // kid sees why on the control he tapped. Reads navigator.onLine, not
        // `online`: click-time truth, no render lag.
        // === false, not ! — fail open under Node/SSR.
        if (navigator.onLine === false) return;
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
        if (gameState === "ACTIVE") {
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

    useEffect(() => {
        // ponytail: KEEP READING step completes on first proof of speech —
        // interim highlight or a locked verdict. A full instant sentence also
        // ends here via the break, which suppresses the guide (no clash).
        if (guideArmed && GUIDE_STEPS[guideStep]?.action === "say-sentence-start" && hasSpoken) {
            setGuideDone(true);
        }
    }, [guideArmed, guideStep, hasSpoken]);

    const { reconnecting } = useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE",
        muted: sentenceBreak,
        targetWord: targetWord,
        targetIndex: currentWordIndex,
        resetKey: currentSentenceIndex,
        keyterms: speakKeyterms,
        lookahead: speakLookahead,
        onProgress: handleSpeakProgress,
        onWordRecognized: handleWordRecognized,
        onSentenceVerdict: handleSentenceVerdict,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
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

    // ponytail: per-word cheer is tutorial-only — in real rounds RED advances
    // immediately, so a bubble per mispronounce would spam mid-sentence and
    // violate no-per-word-feedback. Real-round encouragement lives in the
    // sentence-completion bubble below.
    useEffect(() => {
        if (isTutorial && isMispronounced) {
            setCoachLeaving(false);
            setCoachActive(true);
            const t = setTimeout(() => setCoachActive(false), isTutorial ? 1500 : 1200);
            return () => clearTimeout(t);
        }
    }, [isMispronounced, isTutorial]);

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
        showPointsFeedback: false,
        pointsFeedbackValue: 0,
        streakShake: null,
        timeLeft,
        mode: "speak",
        spotlight: null,
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
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
                    footerText="Tap to continue →"
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
                            emoji="sentiment_very_satisfied"
                            title="NICE TRY!"
                            message="That's okay. you're doing great!"
                            bodyUrl={bodyUrl}
                            color="quest"
                            position="bottom-right"
                            variant="mini"
                            footerText={null}
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
