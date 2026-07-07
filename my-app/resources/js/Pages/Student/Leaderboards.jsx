import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";

export default function Leaderboards({ leaderboard, totalStudents }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user?.id;
    const currentUserName = auth.user?.name ?? "You";
    const currentEntry = leaderboard.find((e) => e.user_id === currentUserId);

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pt-2">
                <div className="mb-4">
                    <Link
                        href="/student/dashboard"
                        className="bg-surface-container-high border-2 border-surface-variant/50 p-2 rounded-full text-on-surface inline-flex items-center justify-center hover:bg-surface-variant transition-all shadow-lg w-12 h-12"
                    >
                        <span className="material-symbols-outlined text-2xl">arrow_back</span>
                    </Link>
                </div>

                <div className="text-center mb-8">
                    <h1 className="text-4xl lg:text-6xl font-black text-on-surface uppercase tracking-tight flex items-center justify-center gap-3">
                        <span>🏆</span> Leaderboard
                    </h1>
                </div>

                {/* Current user highlight */}
                {currentEntry && (
                    <div className="mb-6 bg-lime-400/10 border-2 border-lime-400/50 rounded-xl p-5 flex items-center justify-between"
                        style={{ boxShadow: "0 0 20px rgba(163,230,53,0.1)" }}
                    >
                        <div className="flex items-center gap-6">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-surface-container-high">
                                {currentEntry.avatar ? (
                                    <img src={currentEntry.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl">😊</span>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-lime-400">{currentUserName}</p>
                                <p className="text-sm text-on-surface-variant font-bold">That's you!</p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-lime-400">{currentEntry.points}</p>
                            <p className="text-xs text-on-surface-variant font-bold uppercase">pts</p>
                        </div>
                    </div>
                )}

                {totalStudents === 0 && (
                    <div className="text-center py-20">
                        <p className="text-4xl mb-4">🚀</p>
                        <p className="font-black uppercase tracking-widest text-base text-on-surface-variant">No explorers yet</p>
                        <p className="text-sm text-on-surface-variant/60 mt-2">Complete your first exercise to appear on the board!</p>
                    </div>
                )}

                {totalStudents > 0 && (
                    <div className="space-y-4 mb-12">
                        {leaderboard.map((entry, i) => {
                            const rank = i + 1;
                            const isCurrentUser = entry.user_id === currentUserId;
                            const isTop3 = rank <= 3;
                            const medals = ["🥇", "🥈", "🥉"];

                            return (
                                <div
                                    key={entry.user_id}
                                    className={`flex items-center justify-between p-6 rounded-xl border-2 transition-all ${
                                        isCurrentUser
                                            ? "bg-lime-400/10 border-lime-400/50"
                                            : "bg-surface-container border-surface-variant/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-8">
                                        <span className="text-4xl font-black w-14 text-center">
                                            {isTop3 ? medals[i] : `#${rank}`}
                                        </span>
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-surface-container-high">
                                            {entry.avatar ? (
                                                <img src={entry.avatar} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <span className="text-2xl">😊</span>
                                            )}
                                        </div>
                                        <div>
                                            <p className={`font-black text-lg ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}>
                                                {isCurrentUser ? currentUserName : `Explorer ${rank}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p className={`font-black text-2xl ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}>
                                            {entry.points}
                                        </p>
                                        <p className="text-xs text-on-surface-variant font-bold uppercase">pts</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                <div className="flex justify-center mb-12">
                    <Link
                        href="/student/dashboard"
                        className="inline-flex items-center gap-2 bg-lime-400 text-slate-950 font-black px-8 py-4 rounded-xl text-base border-b-2 border-lime-700 hover:border-b-[3px] transition-all shadow-lg shadow-lime-400/20 uppercase tracking-wider"
                    >
                        <span className="text-xl">🚀</span>
                        Back to Games
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
