import { Link } from "@inertiajs/react"

const COVER_GRADIENTS = [
    "from-purple-600/40 to-pink-600/20",
    "from-lime-500/40 to-teal-600/20",
    "from-amber-500/40 to-orange-600/20",
    "from-cyan-500/40 to-blue-600/20",
    "from-rose-500/40 to-red-600/20",
    "from-violet-500/40 to-indigo-600/20",
]

const LEVEL_EMOJIS = [
    "📖", "🎨", "🚀", "🌊", "🔥", "⭐",
    "🌈", "🎯", "🎪", "🏰", "🦋", "🌻",
    "🍕", "🎸", "⚽", "🐉", "🦄", "🍀",
]

export default function LevelCard({ module, emoji, gameUrl, index }) {
    const totalPoints = module.total_points || 0
    const wordsSmashed = module.words_smashed || 0
    const progress =
        totalPoints > 0 ? Math.min((wordsSmashed / totalPoints) * 100, 100) : 0
    const isPlayable =
        module.status === "in_progress" || module.status === "current"
    const gradient = COVER_GRADIENTS[(module.level - 1) % COVER_GRADIENTS.length]
    const displayEmoji = emoji || LEVEL_EMOJIS[(module.level - 1) % LEVEL_EMOJIS.length]

    if (module.status === "locked") {
        return (
            <div
                className="relative rounded-2xl border-2 border-dashed border-surface-variant/40 select-none overflow-hidden bg-surface-container-low"
                style={{ animationDelay: `${index * 80}ms` }}
            >
                <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-30`} />
                <div className="relative z-10 p-5 flex flex-col items-center text-center gap-3">
                    <span className="text-5xl grayscale">🔒</span>
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
            className={`absolute inset-0 bg-gradient-to-br ${gradient} ${
                isCompleted
                    ? "opacity-60"
                    : isPlayable
                    ? "opacity-80 group-hover:opacity-100 transition-opacity"
                    : "opacity-50"
            }`}
        />
    )

    const shimmer = isCurrent ? (
        <div
            className="absolute inset-0 pointer-events-none"
            style={{
                background: "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.1) 50%, transparent 100%)",
                animation: "shimmer 2.5s ease-in-out infinite",
            }}
        />
    ) : null

    const inner = (
        <div className="relative z-10 p-5">
            {/* Level badge */}
            <div className="flex items-center justify-between mb-3">
                <span className={`text-xs font-black uppercase px-2.5 py-1 rounded-full border
                    ${isCompleted ? "bg-accent/20 text-accent border-accent/30" : ""}
                    ${isCurrent ? "bg-secondary-container/20 text-secondary-container border-secondary-container/30" : ""}
                    ${isPlayable && !isCurrent && !isCompleted ? "bg-surface-container-high/50 text-on-surface-variant border-surface-variant/50" : ""}
                `}>
                    {isCompleted ? "COMPLETE" : `LEVEL ${module.level}`}
                </span>
                <span className="text-3xl">{displayEmoji}</span>
            </div>

            {/* Title */}
            <h3 className="text-on-surface font-black text-lg mb-1 truncate">
                {module.title}
            </h3>

            {/* Play button / Completed indicator */}
            <div className="mt-4">
                {isCompleted ? (
                    <div className="flex items-center gap-2 text-accent font-black text-sm">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>check_circle</span>
                        DONE
                    </div>
                ) : (
                    <span className="inline-flex items-center gap-1.5 bg-accent text-surface-container-lowest font-black px-4 py-2 rounded-lg text-sm border-b-[6px] border-accent-deep group-active:border-b-[2px] group-active:translate-y-1 transition-all">
                        <span className="material-symbols-outlined text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>play_arrow</span>
                        PLAY
                    </span>
                )}
            </div>

            {/* Progress bar */}
            <div className="mt-3">
                <div className="w-full bg-background/40 rounded-full h-2 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? "bg-accent" : "bg-gradient-to-r from-accent to-accent-hover"}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-on-surface-variant font-bold text-xs mt-1.5">
                    {wordsSmashed} / {totalPoints} words
                </p>
            </div>
        </div>
    )

    const wrapperClass = `group relative block rounded-2xl border-2 transition-all duration-200 overflow-hidden animate-fade-in
        ${isCompleted ? "border-accent-deep bg-accent/5" : ""}
        ${isCurrent ? "border-secondary-container ring-2 ring-secondary-container/50" : ""}
        ${isPlayable && !isCurrent && !isCompleted ? "border-surface-variant/30 hover:border-secondary-container/50" : ""}
        ${isPlayable ? "hover:scale-[1.03] hover:-translate-y-1 active:scale-[1.01] cursor-pointer" : "cursor-default"}`

    if (isCompleted) {
        return (
            <div className={wrapperClass} style={{ animationDelay: `${index * 80}ms` }}>
                {cover}
                {shimmer}
                {inner}
            </div>
        )
    }

    return (
        <Link
            href={`/${gameUrl}/${module.id}`}
            className={wrapperClass}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {cover}
            {shimmer}
            {inner}
        </Link>
    )
}
