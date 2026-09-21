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
import { normalizeText } from "@/lib/speechUtils";

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
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
        handleFatalError,
        persistProgress,
        targetWordFalsy,
    } = useWordBlastEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        moduleId: module?.id,
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

    useDeepgramRecognition({
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
        onRecognitionError: (err) => console.error("Recognition error:", err),
        onRestartFailed: handleFatalError,
    });
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [coachActive, setCoachActive] = useState(false);
    const [coachLeaving, setCoachLeaving] = useState(false);
    const [cheerActive, setCheerActive] = useState(false);

    useEffect(() => {
        if (isMispronounced) {
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
                words={module?.words}
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
                    footerText="Tap to continue →"
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
                            footerText={null}
                        />
                    )}
                </>
            )}
            {coachActive && bodyUrl && (
                <AvatarSpeechBubble
                    emoji="sentiment_very_satisfied"
                    title="NICE TRY!"
                    message="That's okay — you're doing great!"
                    bodyUrl={bodyUrl}
                    color="accent"
                    position="bottom-right"
                    variant="mini"
                    footerText={null}
                    className={coachLeaving ? "opacity-0 transition-opacity duration-300" : ""}
                />
            )}
            {gameState === "IDLE" && !isResume && !isTutorialCompletePending && (!guideArmed || guideStepObj?.action === "tap-mic") && (
                <TapToStartOverlay
                    color="accent"
                    permissionState={permissionState}
                    spotlight={guideArmed}
                />
            )}
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN" || isSaving}
                    onClick={handleMicrophoneClick}
                    color="accent"
                    spotlight={guideArmed && guideStepObj?.spotlight === "mic"}
                />
            </div>
        </div>
    );
}
