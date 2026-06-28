import { Link } from "@inertiajs/react"

export default function LevelCard({ module, emoji, gameUrl, index }) {
    const totalPoints = module.total_points || 0
    const wordsSmashed = module.words_smashed || 0
    const progress =
        totalPoints > 0 ? Math.min((wordsSmashed / totalPoints) * 100, 100) : 0
    const isPlayable =
        module.status === "in_progress" || module.status === "current"

    if (module.status === "locked") {
        return (
            <div
                className="bg-surface-container-low rounded-3xl p-card-padding border-2 border-dashed border-surface-variant opacity-60 select-none"
                style={{ animationDelay: `${index * 80}ms` }}
            >
                <div className="flex items-center gap-4">
                    <span className="text-4xl">🔒</span>
                    <div>
                        <p className="text-on-surface-variant font-black uppercase text-lg">
                            Level {module.level}
                        </p>
                        <p className="text-on-surface-variant font-bold text-sm">
                            {module.title}
                        </p>
                        <p className="text-on-surface-variant/50 font-bold text-xs mt-1">
                            Complete previous level first
                        </p>
                    </div>
                </div>
            </div>
        )
    }

    const isCompleted = module.status === "completed"

    const isCurrent = module.status === "current"

    return (
        <Link
            href={isCompleted ? "#" : `/${gameUrl}/${module.id}`}
            onClick={(e) => {
                if (isCompleted) e.preventDefault()
            }}
            className={`group relative block bg-surface-container-high rounded-3xl p-card-padding border-4 transition-all duration-200 neo-3d-shadow animate-fade-in overflow-hidden
                ${isCompleted ? "border-lime-700 bg-lime-400/10 cursor-default" : ""}
                ${isCurrent ? "border-secondary-container ring-2 ring-secondary-container/50 animate-glow-pulse" : ""}
                ${isPlayable && !isCurrent && !isCompleted ? "border-surface-variant" : ""}
                ${isPlayable ? "hover:border-secondary-container/50 hover:scale-[1.02] active:translate-y-1 active:shadow-none cursor-pointer" : ""}
            `}
            style={{ animationDelay: `${index * 80}ms` }}
        >
            {/* Shimmer effect on current level */}
            {isCurrent && (
                <div
                    className="absolute inset-0 pointer-events-none"
                    style={{
                        background:
                            "linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.08) 50%, transparent 100%)",
                        animation: "shimmer 2.5s ease-in-out infinite",
                    }}
                />
            )}

            <div className="flex items-start justify-between gap-4 relative z-10">
                <div className="flex items-center gap-4 min-w-0">
                    <span className="text-4xl md:text-5xl flex-shrink-0">
                        {emoji}
                    </span>
                    <div className="min-w-0">
                        <p className="text-on-surface font-black uppercase text-lg md:text-xl">
                            Level {module.level}
                        </p>
                        <p className="text-on-surface-variant font-bold text-sm md:text-base truncate">
                            {module.title}
                        </p>
                    </div>
                </div>

                <div className="flex-shrink-0">
                    {isCompleted ? (
                        <span className="bg-lime-400 text-slate-950 font-black px-3 py-1.5 rounded-full text-xs border-b-2 border-lime-700 flex items-center gap-1">
                            <span
                                className="material-symbols-outlined text-sm"
                                style={{
                                    fontVariationSettings: "'FILL' 1",
                                }}
                            >
                                check_circle
                            </span>
                            DONE
                        </span>
                    ) : (
                        <span className="bg-secondary-container text-on-secondary-container font-black px-5 py-2 rounded-full text-sm border-b-2 border-slate-950/20 flex items-center gap-1 shadow-lg group-hover:scale-105 transition-transform">
                            {isCurrent && (
                                <span className="animate-bounce-slow text-base">
                                    ✨
                                </span>
                            )}
                            <span className="material-symbols-outlined text-lg">
                                play_arrow
                            </span>
                            PLAY
                        </span>
                    )}
                </div>
            </div>

            {/* Progress bar */}
            <div className="mt-4">
                <div className="w-full bg-slate-950/30 rounded-full h-3 overflow-hidden">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ease-out ${isCompleted ? "bg-lime-400" : "bg-gradient-to-r from-lime-400 to-lime-300"}`}
                        style={{ width: `${progress}%` }}
                    />
                </div>
                <p className="text-on-surface-variant font-bold text-xs mt-1.5">
                    {wordsSmashed} / {totalPoints} words
                </p>
            </div>
        </Link>
    )
}
