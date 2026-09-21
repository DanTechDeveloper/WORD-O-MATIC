import { Head, usePage } from "@inertiajs/react"
import { useState, useEffect } from "react"
import DashboardLayout from "../../Layouts/Student/DashboardLayout"
import LevelCard from "../../Components/Student/LevelCard"
import BackButton from "../../Components/Student/BackButton"
import AvatarSpeechBubble from "@/Components/Student/AvatarSpeechBubble"
import DeadlineBanner from "@/Components/DeadlineBanner"
import useDeadlineStatus from "@/hooks/Student/useDeadlineStatus"
import { readResumeSession } from "@/utils/resumeStorage"

const LEVEL_ICONS = [
    "menu_book", "palette", "rocket_launch", "waves", "local_fire_department", "star",
    "wb_sunny", "sports_esports", "celebration", "castle", "emoji_nature", "local_florist",
    "local_pizza", "music_note", "sports_soccer", "pets", "auto_awesome", "eco",
]

export default function LevelsPage({ modules, mode, tutorialComplete = true, tutorialSkipped = false, wordTutorialDone = false, speakTutorialDone = false }) {
    const { auth, flash } = usePage().props
    const isDeadlineClosed = useDeadlineStatus()
    const [error, setError] = useState(flash?.error ?? null)
    const avatarUrl = auth?.user?.student?.avatar
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png")
    const isTutorial = tutorialSkipped ? false : mode === "read" ? !tutorialComplete && !wordTutorialDone : !tutorialComplete && wordTutorialDone && !speakTutorialDone
    const tutorialMessage = mode === "read"
        ? "Tap Level 1 to start! 10 words to learn."
        : "Read the story aloud. You've got this!"

    const totalStars =
        modules?.reduce((sum, m) => {
            if (m.status !== "locked") return sum + (m.words_smashed || 0)
            return sum
        }, 0) || 0
    const totalPossibleStars =
        modules?.reduce((sum, m) => sum + (m.total_points || 0), 0) || 0

    const gameUrl =
        mode === "read" ? "student/gameplayReadMode" : "student/gameplaySpeakMode"

    const isRead = mode === "read"
    const [guideDone, setGuideDone] = useState(false)
    const [resumeModules, setResumeModules] = useState([]);
    useEffect(() => {
        const out = [];
        modules?.forEach((m) => {
            if (readResumeSession(m.id)) out.push(m.id);
        });
        setResumeModules(out);
    }, [modules]);

    return (
            <DashboardLayout disableNav={isTutorial}>
            <Head title={`${isRead ? "Word Blast" : "Story Quest"} Levels — Word-O-Matic`}>
                <meta name="description" content={`${isRead ? "Word Blast" : "Story Quest"} levels on Word-O-Matic. Select a level to play.`} />
            </Head>
            {error && (
                <div className="mb-6 bg-error text-on-error px-6 py-3 rounded-lg text-sm font-bold flex items-center gap-3 shadow-[4px_4px_0_0_#4c1d95]">
                    <span className="material-symbols-outlined text-xl">lock</span>
                    <span>{error}</span>
                    <button
                        type="button"
                        onClick={() => setError(null)}
                        className="ml-auto text-on-error/70 hover:text-on-error transition-colors"
                        aria-label="Dismiss"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
            )}
            {!isTutorial && <DeadlineBanner isDeadlineClosed={isDeadlineClosed} />}
            {/* Header */}
            <div className="flex items-center gap-2 sm:gap-3 md:gap-4 mb-6 pt-2">
                <BackButton />
                <div className="flex-1 min-w-0">
                    <h2 className="text-on-surface text-xl xs:text-2xl md:text-3xl font-black uppercase truncate flex items-center gap-1.5 sm:gap-2">
                        <span className={`material-symbols-outlined text-2xl sm:text-3xl ${isRead ? "text-accent" : "text-quest"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{isRead ? "menu_book" : "mic"}</span>
                        <span>{isRead ? "Word Blast" : "Story Quest"}</span>
                    </h2>
                    <p className="text-on-surface-variant font-black uppercase tracking-wide text-xs md:text-sm">
                        Select a level to play
                    </p>
                </div>
                <div className={`${isRead ? "bg-accent text-surface-container-lowest border-2 border-accent-deep/50" : "bg-quest text-surface-container-lowest border-2 border-quest-deep/50"} px-2 xs:px-2.5 sm:px-3 md:px-4 py-1 sm:py-1.5 md:py-2 rounded-lg font-black text-xs sm:text-sm md:text-base flex items-center gap-1 sm:gap-1.5 flex-shrink-0 whitespace-nowrap`} aria-label={`${totalStars} of ${totalPossibleStars} stars collected`}>
                    <span className="material-symbols-outlined text-sm sm:text-base md:text-lg shrink-0" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    <span className="flex items-baseline gap-1">
                        <span>{totalStars}</span>
                        <span className="opacity-70 font-bold text-[10px] xs:text-xs">of</span>
                        <span>{totalPossibleStars}</span>
                        <span className="hidden xs:inline opacity-80 font-bold text-[10px] xs:text-xs">stars</span>
                    </span>
                </div>
            </div>

            {/* Level Cards Grid — 2 col on student per DESIGN.md §6 no 3 cards, linear on small */}
            {(!modules || modules.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-12 sm:py-20 text-center px-4">
                    <span className="material-symbols-outlined text-5xl sm:text-6xl mb-4 text-on-surface-variant">inbox</span>
                    <p className="text-on-surface-variant font-bold text-base sm:text-lg">No levels available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 md:gap-5">
                    {modules.map((module, index) => (
                        <LevelCard
                            key={module.id}
                            module={module}
                            emoji={LEVEL_ICONS[(module.level - 1) % LEVEL_ICONS.length]}
                            gameUrl={gameUrl}
                            index={index}
                            highlightTutorial={isTutorial}
                            tutorialColor={isRead ? "accent" : "quest"}
                            hasResume={resumeModules.includes(module.id)}
                            isDeadlineClosed={isDeadlineClosed}
                            disabled={isTutorial && !guideDone}
                        />
                    ))}
                </div>
            )}
            {isTutorial && bodyUrl && !guideDone && (
                <AvatarSpeechBubble
                    emoji={mode === "read" ? "menu_book" : "mic"}
                    title={mode === "read" ? "Word Blast" : "Story Quest"}
                    message={tutorialMessage}
                    bodyUrl={bodyUrl}
                    color={mode === "read" ? "accent" : "quest"}
                    position="bottom-right"
                    onClick={() => setGuideDone(true)}
                />
            )}
        </DashboardLayout>
    )
}
