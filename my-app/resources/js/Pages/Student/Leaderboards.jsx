import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";

export default function Leaderboards({ leaderboard, totalStudents }) {
    const { auth } = usePage().props;
    const currentUserId = auth.user?.id;
    const currentUserName = auth.user?.name ?? "You";
    const currentEntry = leaderboard.find((e) => e.user_id === currentUserId);
   

    return (
        <DashboardLayout>
            <div className="max-w-full mx-auto px-margin mt-12 flex flex-col items-center">
                <div className="w-full max-w-4xl mb-4">
                    <Link
                        href="/student/dashboard"
                        className="bg-surface-container-high border-4 border-surface-variant p-2 rounded-full text-on-surface flex items-center justify-center hover:bg-surface-variant active-3d transition-all aspect-square shadow-lg w-12 h-12"
                    >
                        <span className="material-symbols-outlined text-3xl">
                            arrow_back
                        </span>
                    </Link>
                </div>
                 <div className="text-center mb-8">
                    <h1 className="text-5xl md:text-6xl font-black text-on-surface uppercase tracking-tight">
                        Leaderboard
                    </h1>
                </div>
                {currentEntry && (
                    <div
                        className="w-full max-w-4xl mb-6 bg-lime-400/10 border-2 border-lime-400 rounded-2xl p-6 flex items-center justify-between"
                        style={{
                            boxShadow: "4px 4px 0px 0px rgba(163,230,53,0.3)",
                        }}
                    >
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 rounded-xl overflow-hidden flex items-center justify-center bg-surface-container-high">
                                {currentEntry.avatar ? (
                                    <img src={currentEntry.avatar} alt="" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-3xl">😊</span>
                                )}
                            </div>
                            <div>
                                <p className="text-2xl font-black text-lime-400">
                                    {currentUserName}
                                </p>
                                <p className="text-sm text-on-surface-variant font-bold">
                                    That's you!
                                </p>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="text-3xl font-black text-lime-400">
                                {currentEntry.points}
                            </p>
                            <p className="text-xs text-on-surface-variant font-bold">
                                pts
                            </p>
                        </div>
                    </div>
                )}

               

                {totalStudents === 0 && (
                    <div className="text-zinc-500 text-center py-20">
                        <p className="text-4xl mb-4">🚀</p>
                        <p className="font-black uppercase tracking-widest text-sm">
                            No explorers yet
                        </p>
                        <p className="text-xs mt-2">
                            Complete your first exercise to appear on the board!
                        </p>
                    </div>
                )}

                {totalStudents > 0 && (
                    <div className="w-full max-w-4xl mb-12 space-y-3">
                        {leaderboard.map((entry, i) => {
                            const rank = i + 1;
                            const isCurrentUser =
                                entry.user_id === currentUserId;
                            const isTop3 = rank <= 3;
                            const medals = ["🥇", "🥈", "🥉"];

                            return (
                                <div
                                    key={entry.user_id}
                                    className={`flex items-center justify-between p-5 rounded-2xl border-2 transition-all ${
                                        isCurrentUser
                                            ? "bg-lime-400/15 border-lime-400"
                                            : "bg-surface-container border-surface-variant/30"
                                    }`}
                                    style={{
                                        boxShadow: isCurrentUser
                                            ? "4px 4px 0px 0px rgba(163,230,53,0.4)"
                                            : "4px 4px 0px 0px rgba(0,0,0,0.3)",
                                    }}
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="text-3xl font-black w-10 text-center">
                                            {isTop3 ? medals[i] : rank}
                                        </span>
                                        <div className="w-12 h-12 rounded-xl overflow-hidden flex items-center justify-center bg-surface-container-high">
                                            {entry.avatar ? (
                                                <img
                                                    src={entry.avatar}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-2xl">
                                                    😊
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p
                                                className={`font-bold text-xl ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}
                                            >
                                                {isCurrentUser
                                                    ? currentUserName
                                                    : `Explorer ${rank}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <p
                                            className={`font-black text-2xl ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}
                                        >
                                            {entry.points}
                                        </p>
                                        <p className="text-xs text-on-surface-variant font-bold">
                                            pts
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
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
