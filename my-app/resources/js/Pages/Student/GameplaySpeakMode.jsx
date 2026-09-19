import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { usePage } from "@inertiajs/react";
import axios from "axios";
import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble";
import DeniedModal from "@/Components/Student/DeniedModal";
import TapToStartOverlay from "@/Components/Student/TapToStartOverlay";
import { useCallback, useEffect, useMemo, useState } from "react";

import { useStoryQuestEngine } from "@/hooks/Student/useStoryQuestEngine";
import { useDeepgramRecognition } from "@/hooks/Student/useDeepgramRecognition";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { pauseBackgroundMusic, setMicLive } from "@/utils/sounds";
import { normalizeText } from "@/lib/speechUtils";

const GUIDE_STEPS = [
    { title: "READ THE SENTENCE", message: "Say the whole sentence clearly, not just one word!", emoji: "menu_book", color: "quest" },
    { title: "WATCH IT LIGHT UP", message: "Each word highlights as it's recognized. Follow along!", emoji: "auto_awesome", color: "quest" },
    { title: "TAP TO PLAY!", message: "Tap the mic below when you're ready. 3-2-1 countdown, then go!", emoji: "mic", color: "quest" },
];

export default function GameplaySpeakMode({ module, tutorialComplete = true, wordTutorialDone = false }) {
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
        countdownValue,
        targetWord,
        timeLeft,
        isResume,
        handleTimeUp,
        startGame,
        handleWordRecognized,
        handleMispronounce,
        handleFatalError,
        verdicts,
        sentenceFeedback,
        sentenceBreak,
        sentenceEpoch,
        breakJustEnded,
    } = useStoryQuestEngine({
        words: module?.words,
        totalWords: module?.words?.length ?? 0,
        moduleId: module?.id,
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
    const [guideDone, setGuideDone] = useState(() => !isTutorial || wordTutorialDone || isResume);

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

    useDeepgramRecognition({
        isActive: gameState === "ACTIVE",
        preload: gameState === "COUNTDOWN" || gameState === "ACTIVE",
        muted: sentenceBreak,
        targetWord: targetWord,
        keyterms: speakKeyterms,
        lookahead: speakLookahead,
        onProgress: handleSpeakProgress,
        onWordRecognized: handleWordRecognized,
        onPermissionDenied: handlePermissionDenied,
        onMispronounced: handleMispronounce,
        onRecognitionError: undefined,
        onRestartFailed: handleFatalError,
        matchMode: "sentence",
        resetKey: sentenceEpoch,
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
        currentIndex: currentWordIndex,
        totalWords: totalWords,
        onTimeUp: handleTimeUp,
        scoreEmphasize,
        showPointsFeedback: false,
        pointsFeedbackValue: 0,
        streakShake: null,
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
            {coachActive && bodyUrl && (
                <AvatarSpeechBubble
                    emoji="sentiment_very_satisfied"
                    title="NICE TRY!"
                    message="That's okay — you're doing great!"
                    bodyUrl={bodyUrl}
                    color="quest"
                    position="bottom-right"
                    variant="mini"
                    footerText={null}
                    className={coachLeaving ? "opacity-0 transition-opacity duration-300" : ""}
                />
            )}
            {sentenceBreak && sentenceFeedback && bodyUrl && (
                <AvatarSpeechBubble
                    emoji={sentenceFeedback.score >= sentenceFeedback.total ? "celebration" : "sentiment_very_satisfied"}
                    title={sentenceFeedback.message}
                    message={`Sentence Score: ${sentenceFeedback.score} / ${sentenceFeedback.total} — ${sentenceFeedback.note ?? "Nice try!"}`}
                    bodyUrl={bodyUrl}
                    color="quest"
                    position="bottom-right"
                    variant="mini"
                    footerText={null}
                />
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
                breakJustEnded={breakJustEnded}
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
