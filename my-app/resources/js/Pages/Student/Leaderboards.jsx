import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";

const motivationalQuotes = [
    "Every champion started somewhere. Focus on beating your personal best!",
    "Small steps lead to big wins. Keep showing up!",
    "Your only competition is the person you were yesterday.",
    "Progress, not perfection. Every point counts!",
    "Consistency beats talent. Keep going!",
    "The climb is what makes the view worth it.",
];

function getMotivationalMessage(rank, total) {
    if (rank === null) return "Start your journey and see yourself on the board!";
    if (rank === 1) return "You're leading the galaxy! Stay hungry, stay humble.";
    if (rank <= 3) return "Elite squad. You're among the best — keep soaring!";
    if (rank <= Math.ceil(total * 0.25)) return "Strong position! You're in the top tier — keep pushing!";
    if (rank <= Math.ceil(total * 0.5)) return "You're in the middle of the pack — the best climbing happens here!";
    return "Every point you earn is progress. The leaderboard is just a number — your growth is real!";
}

export default function Leaderboards({ leaderboard, currentUserRank, totalStudents, weeklyPoints }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user?.id;
    const currentUserPoints = auth.user?.student?.points ?? 0;

    const quote = motivationalQuotes[Math.floor(Math.random() * motivationalQuotes.length)];
    const message = getMotivationalMessage(currentUserRank, totalStudents);

    return (
        <DashboardLayout>
            <div className="max-w-full mx-auto px-margin mt-12 flex flex-col items-center">
                <div className="relative mb-4 text-center">
                    <h1 className="font-headline-xl text-5xl md:text-7xl leading-none uppercase italic text-white">
                        LEADERBOARDS
                    </h1>
                </div>

                <p className="text-zinc-400 text-sm md:text-base font-bold italic max-w-xl text-center mb-2 px-4">
                    &ldquo;{quote}&rdquo;
                </p>

                <div className="bg-zinc-800/50 border border-zinc-700 rounded-2xl px-6 py-3 mb-10 text-center max-w-md">
                    <p className="text-lime-400 font-black uppercase text-xs tracking-widest">
                        {message}
                    </p>
                </div>

                <div className="w-full max-w-4xl mb-10">
                    <div className="bg-zinc-800/40 border-4 border-zinc-700 rounded-[28px] p-6 md:p-8">
                        <h3 className="font-black uppercase text-xs tracking-widest text-zinc-400 mb-4">
                            Your Stats
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div className="bg-zinc-900/60 rounded-2xl p-4 text-center border border-zinc-700/50">
                                <p className="text-2xl font-black text-lime-400">{currentUserRank ?? "—"}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Rank</p>
                            </div>
                            <div className="bg-zinc-900/60 rounded-2xl p-4 text-center border border-zinc-700/50">
                                <p className="text-2xl font-black text-white">{currentUserPoints}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Total PTS</p>
                            </div>
                            <div className="bg-zinc-900/60 rounded-2xl p-4 text-center border border-zinc-700/50">
                                <p className="text-2xl font-black text-purple-400">{weeklyPoints}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">This Week</p>
                            </div>
                            <div className="bg-zinc-900/60 rounded-2xl p-4 text-center border border-zinc-700/50">
                                <p className="text-2xl font-black text-zinc-400">{totalStudents}</p>
                                <p className="text-[10px] text-zinc-500 font-black uppercase tracking-widest mt-1">Total Explorers</p>
                            </div>
                        </div>
                    </div>
                </div>

                {totalStudents === 0 && (
                    <div className="text-zinc-500 text-center py-20">
                        <p className="text-4xl mb-4">🚀</p>
                        <p className="font-black uppercase tracking-widest text-sm">No explorers yet</p>
                        <p className="text-xs mt-2">Complete your first exercise to appear on the board!</p>
                    </div>
                )}

                {totalStudents > 0 && (
                    <div className="w-full max-w-4xl bg-zinc-800/50 border-4 border-zinc-700 rounded-2xl p-4 md:p-8 mb-12">
                        <div className="flex items-center justify-between mb-6 border-b-4 border-zinc-700 pb-4">
                            <h3 className="font-black text-lg text-white flex items-center gap-2 uppercase tracking-tight">
                                <span className="text-lime-400">⬡</span>
                                Galaxy Rankings
                            </h3>
                            <span className="text-zinc-500 font-bold text-xs uppercase tracking-widest">
                                Top {totalStudents} Explorers
                            </span>
                        </div>

                        <div className="space-y-3">
                            {leaderboard.map((entry, i) => {
                                const rank = i + 1;
                                const isCurrentUser = entry.user_id === currentUserId;
                                const isTop3 = rank <= 3;
                                const medals = ["🥇", "🥈", "🥉"];
                                const medalColors = [
                                    "bg-amber-400/10 border-amber-400/30 text-amber-300",
                                    "bg-zinc-400/10 border-zinc-400/30 text-zinc-300",
                                    "bg-amber-700/10 border-amber-700/30 text-amber-500",
                                ];
                                const rowColors = [
                                    "bg-amber-400/5 border-amber-400/20",
                                    "bg-zinc-400/5 border-zinc-400/20",
                                    "bg-amber-700/5 border-amber-700/20",
                                ];
                                const medal = isTop3 ? medals[i] : null;
                                const medalColor = isTop3 ? medalColors[i] : null;
                                const rowColor = isTop3 ? rowColors[i] : "bg-zinc-800/30 border-transparent";

                                return (
                                    <div
                                        key={entry.user_id}
                                        style={{ animationDelay: `${i * 0.05}s` }}
                                        className={`flex items-center justify-between p-4 rounded-xl transition-all duration-200 animate-in fade-in slide-in-from-right-2 border-2 ${
                                            isCurrentUser
                                                ? "bg-lime-400/10 border-lime-400/50 shadow-[0_0_20px_rgba(163,230,53,0.1)]"
                                                : `${rowColor} hover:border-zinc-600 hover:translate-x-1`
                                        }`}
                                    >
                                        <div className="flex items-center gap-4">
                                            {isTop3 ? (
                                                <span className={`font-black w-8 h-8 flex items-center justify-center rounded-lg text-sm ${medalColor}`}>
                                                    {medal}
                                                </span>
                                            ) : (
                                                <span className={`font-black w-8 text-center ${isCurrentUser ? "text-lime-400" : "text-zinc-500"}`}>
                                                    {rank}
                                                </span>
                                            )}
                                            <div className={`w-10 h-10 rounded-lg overflow-hidden flex items-center justify-center ${
                                                isCurrentUser ? "bg-lime-400/20" : isTop3 ? "bg-amber-400/10" : "bg-zinc-700"
                                            }`}>
                                                {entry.avatar ? (
                                                    <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                                ) : (
                                                    <span className="text-lg opacity-50">⬡</span>
                                                )}
                                            </div>
                                            <div>
                                                {isCurrentUser ? (
                                                    <p className="font-bold text-lime-400">
                                                        {entry.user.name}
                                                    </p>
                                                ) : (
                                                    <p className={`font-bold ${isTop3 ? "text-zinc-400" : "text-zinc-400"}`}>
                                                        {isTop3 ? ["1st Place", "2nd Place", "3rd Place"][i] : `Explorer ${rank}`}
                                                    </p>
                                                )}
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className={`font-black ${isCurrentUser ? "text-lime-400" : "text-white"}`}>
                                                {entry.points}
                                            </p>
                                            <p className="text-xs text-zinc-500 uppercase font-bold tracking-wide">
                                                PTS
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                )}

                <div className="w-full flex justify-center mb-16">
                    <Link
                        href="/student/dashboard"
                        className="group relative px-12 py-6 bg-lime-400 border-4 border-[#3c6e00] rounded-2xl font-black text-lg text-[#0c2200] transition-all duration-75 uppercase italic flex items-center gap-4 shadow-[8px_8px_0_0_#3c6e00] active:translate-y-1 active:shadow-[4px_4px_0_0_#3c6e00]"
                    >
                        <span className="text-2xl">🚀</span>
                        Back to Home
                        <span className="text-2xl group-hover:translate-x-1 transition-transform">
                            →
                        </span>
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
