import { Link } from "@inertiajs/react"
import DashboardLayout from "../../Layouts/Student/DashboardLayout"
import LevelCard from "../../Components/Student/LevelCard"

const LEVEL_ICONS = [
    "menu_book", "palette", "rocket_launch", "waves", "local_fire_department", "star",
    "wb_sunny", "sports_esports", "celebration", "castle", "emoji_nature", "local_florist",
    "local_pizza", "music_note", "sports_soccer", "pets", "auto_awesome", "eco",
]

export default function LevelsPage({ modules, mode }) {
    const totalStars =
        modules?.reduce((sum, m) => {
            if (m.status !== "locked") return sum + (m.words_smashed || 0)
            return sum
        }, 0) || 0

    const gameUrl =
        mode === "read" ? "student/gameplayReadMode" : "student/gameplaySpeakMode"

    const isRead = mode === "read"

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 pt-2">
                <Link
                    href="/student/dashboard"
                    aria-label="Back to dashboard"
                    className="bg-surface-container-high border-2 border-surface-variant/50 p-2.5 rounded-full text-on-surface flex items-center justify-center hover:bg-surface-variant transition-all aspect-square shadow-[4px_4px_0_0_#4c1d95] flex-shrink-0"
                >
                    <span className="material-symbols-outlined text-2xl" aria-hidden="true">arrow_back</span>
                </Link>
                <div className="flex-1 min-w-0">
                    <h2 className="text-on-surface text-2xl md:text-3xl font-black uppercase truncate flex items-center gap-2">
                        <span className={`material-symbols-outlined text-3xl ${isRead ? "text-accent" : "text-quest"}`} style={{ fontVariationSettings: "'FILL' 1" }}>{isRead ? "menu_book" : "mic"}</span>
                        <span>{isRead ? "Word Blast" : "Story Quest"}</span>
                    </h2>
                    <p className="text-on-surface-variant font-black uppercase tracking-wide text-xs md:text-sm">
                        Select a level to play
                    </p>
                </div>
                <div className={`${isRead ? "bg-accent text-surface-container-lowest border-b-2 border-accent-deep" : "bg-quest text-surface-container-lowest border-b-2 border-quest-deep"} px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-black text-sm md:text-base flex items-center gap-1.5 flex-shrink-0`}>
                    <span className="material-symbols-outlined text-base md:text-lg" style={{ fontVariationSettings: "'FILL' 1" }}>star</span>
                    {totalStars}
                </div>
            </div>

            {/* Level Cards Grid */}
            {(!modules || modules.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="material-symbols-outlined text-6xl mb-4 text-on-surface-variant">inbox</span>
                    <p className="text-on-surface-variant font-bold text-lg">No levels available yet</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                    {modules.map((module, index) => (
                        <LevelCard
                            key={module.id}
                            module={module}
                            emoji={LEVEL_ICONS[(module.level - 1) % LEVEL_ICONS.length]}
                            gameUrl={gameUrl}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    )
}
