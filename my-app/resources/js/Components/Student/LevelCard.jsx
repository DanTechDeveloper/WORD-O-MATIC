import { Link } from "@inertiajs/react"
import ProgressBar from "./ProgressBar"

// ponytail: solid arcade chrome tints, no harsh gradients — one of four muted solids per level
const COVER_TINTS = [
    "bg-primary-container/30",
    "bg-accent/15",
    "bg-tertiary-container/25",
    "bg-quest/15",
]

const LEVEL_ICONS = [
    "menu_book", "palette", "rocket_launch", "waves", "local_fire_department", "star",
    "wb_sunny", "sports_esports", "celebration", "castle", "emoji_nature", "local_florist",
    "local_pizza", "music_note", "sports_soccer", "pets", "auto_awesome", "eco",
]

export default function LevelCard({ module, emoji, gameUrl, index, highlightTutorial, tutorialColor, hasResume, isDeadlineClosed = false, disabled = false }) {
    const totalPoints = module.total_points || 0
    const wordsSmashed = module.words_smashed || 0
    const progress =
        totalPoints > 0 ? Math.min((wordsSmashed / totalPoints) * 100, 100) : 0
    const isPlayable =
        module.status === "in_progress" || module.status === "current"
    const tint = COVER_TINTS[(module.level - 1) % COVER_TINTS.length]
    const displayIcon = emoji || LEVEL_ICONS[(module.level - 1) % LEVEL_ICONS.length]

    if (module.status === "locked") {
        return (
            <div
                className="relative rounded-2xl border-2 border-dashed border-surface-variant/40 select-none overflow-hidden bg-surface-container-low"
                style={{ animationDelay: `${index * 80}ms` }}
            >
                <div className={`absolute inset-0 ${tint}`} />
                <div className="relative z-10 p-5 flex flex-col items-center text-center gap-3">
                    <span className="material-symbols-outlined text-5xl text-on-surface-variant">lock</span>
                    <div>
                        <p className="text-on-surface-variant font-black uppercase text-lg">
                            Level {module.level}
                        </p>
                        <p className="text-on-surface-variant font-bold text-sm">
                            {module.title}
                        </p>
                        <p className="text-on-surface-variant font-bold text-xs mt-2">
                            Complete previous level first
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const isCompleted = module.status === "completed"
    const isCurrent = module.status === "current"

    const cover = (
        <div
            className={`absolute inset-0 ${tint} ${
                isCompleted
                    ? "opacity-60"
                    : isPlayable
                    ? "opacity-80 group-hover:opacity-100 transition-opacity"
                    : "opacity-50"
            }`}
        />
    )

    // ponytail: no shimmer glass on student — calm pulse on PLAY button only when resume, gated to motion
    const shimmer = null

    const inner = (
        <div className="relative z-10 p-4 sm:p-5">
            {/* Level badge */}
            <div className="flex items-center justify-between mb-2 sm:mb-3 gap-2">
                <span className={`text-[10px] sm:text-xs font-black uppercase px-2 sm:px-2.5 py-1 rounded-full border shrink-0
                    ${isCompleted ? "bg-accent/20 text-accent border-accent/30" : ""}
                    ${isCurrent ? "bg-secondary-container/20 text-secondary-container border-secondary-container/30" : ""}
                    ${isPlayable && !isCurrent && !isCompleted ? "bg-surface-container-high/50 text-on-surface-variant border-surface-variant/50" : ""}
                `}>
                    {isCompleted ? "COMPLETE" : `LEVEL ${module.level}`}
                </span>
                <span className="material-symbols-outlined text-2xl sm:text-3xl shrink-0">{displayIcon}</span>
            </div>

            {/* Title */}
            <h3 className="text-on-surface font-black text-base sm:text-lg mb-1 truncate">
                {module.title}
            </h3>

            {/* Play button / Completed indicator — practice: still PLAY even past deadline */}
            <div className="mt-4">
                {isCompleted ? (
                    <span className="inline-flex items-center gap-1.5 bg-accent text-surface-container-lowest font-black px-4 py-2 rounded-lg text-sm border-b-[6px] border-accent-deep group-active:border-b-[2px] group-active:translate-y-1 transition-all">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>replay</span>
                        PLAY AGAIN
                    </span>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-accent text-surface-container-lowest font-black px-4 py-2 rounded-lg text-sm border-b-[6px] border-accent-deep group-active:border-b-[2px] group-active:translate-y-1 transition-all">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        {hasResume ? "CONTINUE" : "PLAY"}
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
                <ProgressBar value={progress} trackClassName="bg-background/40" heightClassName="h-2" durationClassName="duration-1000" />
                <p className="text-on-surface-variant font-bold text-xs mt-1.5">
                    {wordsSmashed} / {totalPoints} words
                </p>
            </div>
        </div>
    )

    // ponytail: bounded highlight — static ring, no pulse per DESIGN.md §3 celebration
    const highlightRing = highlightTutorial
        ? tutorialColor === "accent"
            ? "ring-4 ring-accent ring-offset-4 ring-offset-background scale-[1.03]"
            : "ring-4 ring-quest ring-offset-4 ring-offset-background scale-[1.03]"
        : ""
    const wrapperClass = `group relative block rounded-2xl border-2 transition-all duration-200 overflow-hidden animate-fade-in
        ${isCompleted ? "border-accent-deep bg-accent/5" : ""}
        ${isCurrent ? "border-secondary-container ring-2 ring-secondary-container/50" : ""}
        ${isPlayable && !isCurrent && !isCompleted ? "border-surface-variant/30 hover:border-secondary-container/50" : ""}
        ${isPlayable || isCompleted ? "hover:scale-[1.03] hover:-translate-y-1 active:scale-[1.01] cursor-pointer" : "cursor-default"}
        ${disabled ? "opacity-50 cursor-not-allowed" : ""}
        ${highlightRing}`

    // ponytail: past deadline = practice — Level Page stays open, all aspects readonly (see StudentController finishRound isPractice)
    const isClickable = !disabled && (isPlayable || isCompleted)

    return (
        isClickable ? (
            <Link
                href={`/${gameUrl}/${module.level}`}
                className={wrapperClass}
                style={{ animationDelay: `${index * 80}ms` }}
                data-sfx="major"
            >
                {cover}
                {shimmer}
                {inner}
            </Link>
        ) : (
            <div className={wrapperClass} style={{ animationDelay: `${index * 80}ms` }}>
                {cover}
                {shimmer}
                {inner}
            </div>
        )
    )
}
