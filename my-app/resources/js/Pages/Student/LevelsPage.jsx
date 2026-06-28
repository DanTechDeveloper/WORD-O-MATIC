import { Link } from "@inertiajs/react"
import DashboardLayout from "../../Layouts/Student/DashboardLayout"
import LevelCard from "../../Components/Student/LevelCard"

const LEVEL_EMOJIS = [
    "📖", "🎨", "🚀", "🌊", "🔥", "⭐",
    "🌈", "🎯", "🎪", "🏰", "🦋", "🌻",
    "🍕", "🎸", "⚽", "🐉", "🦄", "🍀",
]

export default function LevelsPage({ modules, mode }) {
    const totalStars =
        modules?.reduce((sum, m) => {
            if (m.status !== "locked") return sum + (m.words_smashed || 0)
            return sum
        }, 0) || 0

    const gameUrl =
        mode === "read" ? "student/gameplayReadMode" : "student/gameplaySpeakMode"

    return (
        <DashboardLayout minimal={true}>
            {/* Header — sits directly on layout background */}
            <div className="flex items-center gap-3 md:gap-4 mb-6 pt-6 lg:pt-10 mt-6">
                <Link
                    href="/student/dashboard"
                    className="bg-surface-container-high border-4 border-surface-variant p-2 rounded-full text-on-surface flex items-center justify-center hover:bg-surface-variant active-3d transition-all aspect-square shadow-lg flex-shrink-0"
                >
                    <span className="material-symbols-outlined text-3xl md:text-4xl">
                        arrow_back
                    </span>
                </Link>
                <div className="flex-1 min-w-0">
                    <h2 className="text-on-surface text-2xl md:text-3xl font-black uppercase italic truncate">
                        {mode === "read" ? "📖 Word Blast Mode" : "🎤 Story Quest Mode"}
                    </h2>
                    <p className="text-on-surface-variant font-bold text-xs md:text-sm">
                        Pick a level to practice!
                    </p>
                </div>
                <div className="bg-lime-400 text-slate-950 px-3 md:px-4 py-1.5 md:py-2 rounded-lg font-black text-sm md:text-base border-b-2 border-lime-700 flex items-center gap-1.5 flex-shrink-0">
                    <span
                        className="material-symbols-outlined text-base md:text-lg"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        star
                    </span>
                    {totalStars}
                </div>
            </div>

            {/* Level Cards Grid */}
            {(!modules || modules.length === 0) ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <span className="text-6xl mb-4">📭</span>
                    <p className="text-on-surface-variant font-bold text-lg">
                        No levels available yet
                    </p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                    {modules.map((module, index) => (
                        <LevelCard
                            key={module.id}
                            module={module}
                            emoji={
                                LEVEL_EMOJIS[
                                    (module.level - 1) % LEVEL_EMOJIS.length
                                ]
                            }
                            gameUrl={gameUrl}
                            index={index}
                        />
                    ))}
                </div>
            )}
        </DashboardLayout>
    )
}
