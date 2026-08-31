import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useGameplayEngine } from "@/hooks/Student/useGameplayEngine";
import { useDeepgramRecognition } from "@/hooks/Student/useDeepgramRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { pauseBackgroundMusic, setMicLive } from "@/utils/sounds";
import { normalizeText } from "@/lib/speechUtils";

const GUIDE_STEPS = [
    { title: "READ THE SENTENCE", message: "Say the whole sentence clearly, not just one word!", emoji: "menu_book", color: "quest" },
    { title: "WATCH IT LIGHT UP", message: "Each word highlights as it's recognized. Follow along!", emoji: "auto_awesome", color: "quest" },
    { title: "TAP TO PLAY!", message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!", emoji: "mic", color: "quest" },
];

export default function GameplaySpeakMode({ module, tutorialComplete = true }) {
    const { auth } = usePage().props;
    const isTutorial = !!module?.is_tutorial && !tutorialComplete;
    const isTutorialModule = !!module?.is_tutorial;
    const speechRecognitionWords = useMemo(() => module?.words?.map((w) => w.word) ?? [], [module?.words]);

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
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
        handleFatalError,
    } = useGameplayEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        moduleId: module?.id,
        saveEndpoint: "/student/saveParagraphProgress",
        onWordRecognized: (wordObj) => {
            if (wordObj && !isTutorialModule) {
                axios.post("/student/updateParagraphMastery", {
                    paragraph_word_id: wordObj.id,
                    status: "mastered",
                }).catch(console.warn);
            }
        },
        onMispronounce: (wordObj) => {
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
    const [guideDone, setGuideDone] = useState(() => !isTutorial || isResume);

    useEffect(() => {
        if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState, setGameState]);

    const handlePermissionDenied = useCallback(() => {
        setGameState("DENIED");
    }, [setGameState]);

    const handleMicrophoneClick = useCallback(async () => {
        if (isTutorial && !guideDone) return;
        if (gameState === "IDLE") {
            if (permissionState === "prompt") {
                const granted = await requestPermission();
                if (!granted) return;
            }
            startGame();
        }
    }, [isTutorial, guideDone, gameState, permissionState, requestPermission, startGame]);

    useEffect(() => {
        if (gameState === "ACTIVE") {
            pauseBackgroundMusic();
            setMicLive(true);
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

    useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE",
        targetWord: targetWord,
        keyterms: speakKeyterms,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
        onRestartFailed: handleFatalError,
        matchMode: "sentence",
    });
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [coachActive, setCoachActive] = useState(false);
    const [coachLeaving, setCoachLeaving] = useState(false);

    useEffect(() => {
        if (isTutorial && isMispronounced) {
            setCoachLeaving(false);
            setCoachActive(true);
        }
    }, [isTutorial, isMispronounced]);

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

    const advanceGuide = () => {
        if (guideStep < GUIDE_STEPS.length - 1) {
            setGuideStep(guideStep + 1);
        } else {
            setGuideDone(true);
        }
    };

    const headerProps = {
        level: module ? `${module.level} - ${module.title}` : "",
        isActive: gameState === "ACTIVE",
        wordsSmashed: wordsSmashed,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback,
        pointsFeedbackValue,
        streakShake,
        timeLeft,
        mode: "speak",
    };

    return (
        <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-x-hidden">
            <DeniedModal gameState={gameState} />
            {isTutorial && !guideDone && bodyUrl && (
                <div className="fixed top-6 left-1/2 -translate-x-1/2 z-[60] flex gap-3">
                    {GUIDE_STEPS.map((_, i) => (
                        <div key={i} className={`w-3 h-3 rounded-full transition-all duration-500 ${i === guideStep ? "bg-quest scale-125" : i < guideStep ? "bg-quest/50" : "bg-on-surface/20"}`} />
                    ))}
                </div>
            )}
            <GameplayHeader {...headerProps} />
            {gameState === "IDLE" && guideDone && !isResume && (
                <TapToStartOverlay color="quest" permissionState={permissionState} />
            )}
            {isTutorial && !guideDone && bodyUrl && (
                <AvatarSpeechBubble
                    emoji={GUIDE_STEPS[guideStep].emoji}
                    title={GUIDE_STEPS[guideStep].title}
                    message={GUIDE_STEPS[guideStep].message}
                    bodyUrl={bodyUrl}
                    color="quest"
                    onClick={advanceGuide}
                    position="bottom-right"
                    footerText={coachActive ? null : (guideStep < GUIDE_STEPS.length - 1 ? "Tap here to continue →" : "Tap to finish!")}
                />
            )}
            {isTutorial && coachActive && bodyUrl && (
                <AvatarSpeechBubble
                    emoji="sentiment_very_satisfied"
                    title="NICE TRY!"
                    message="That's okay — you're doing great!"
                    bodyUrl={bodyUrl}
                    color="quest"
                    position="bottom-right"
                    footerText={null}
                    className={coachLeaving ? "opacity-0 transition-opacity duration-300" : ""}
                />
            )}
            <SpeakModeMainContent
                words={speechRecognitionWords}
                currentIndex={Math.max(0, Math.min(currentWordIndex, totalWords - 1))}
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
            <div className="flex-shrink-0 relative z-50">
                <Microphone
                    isListening={gameState === "ACTIVE"}
                    disabled={gameState === "COUNTDOWN"}
                    onClick={handleMicrophoneClick}
                    color="quest"
                />
            </div>
        </div>
    );
}
