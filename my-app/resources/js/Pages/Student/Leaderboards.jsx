import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { Link, usePage } from "@inertiajs/react";
import DeadlineBanner from "@/Components/DeadlineBanner";
import BackButton from "@/Components/Student/BackButton";
import PageHeader from "@/Components/Student/PageHeader";
import EmptyState from "@/Components/Student/EmptyState";
import StudentAvatar from "@/Components/Student/StudentAvatar";
import useDeadlineStatus from "@/hooks/Student/useDeadlineStatus";

export default function Leaderboards({ leaderboard, totalStudents }) {
    const { auth } = usePage().props;
    const isDeadlineClosed = useDeadlineStatus();
    const currentUserId = auth.user?.id;
    const currentUserName = auth.user?.name ?? "You";
    const currentEntry = leaderboard.find((e) => e.user_id === currentUserId);

    return (
        <DashboardLayout>
            <div className="max-w-4xl mx-auto pt-2">
                <div className="mb-4">
                    <BackButton />
                </div>

                <DeadlineBanner isDeadlineClosed={isDeadlineClosed} />

                <PageHeader icon="emoji_events" title="Leaderboard" as="h1" />

                {/* Current user highlight */}
                {currentEntry && (
                    <div className="mb-6 bg-lime-400/10 border-2 border-lime-400/50 rounded-xl p-5 flex items-center justify-between"
                        style={{ boxShadow: "0 0 20px rgba(163,230,53,0.1)" }}
                    >
                        <div className="flex items-center gap-6">
                            <StudentAvatar url={currentEntry.avatar} alt="" size="lg" />
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
                    <EmptyState
                        icon="rocket_launch"
                        title="No explorers yet"
                        message="Complete your first exercise to appear on the board!"
                    />
                )}

                {totalStudents > 0 && (
                    <div className="space-y-4 mb-12">
                        {leaderboard.map((entry, i) => {
                            const rank = i + 1;
                            const isCurrentUser = entry.user_id === currentUserId;
                            const isTop3 = rank <= 3;
                            const medalColors = ["text-tertiary", "text-slate-300", "text-amber-700"];

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
                                        <span className="w-14 flex items-center justify-center">
                                            {isTop3 ? (
                                                <span className={`material-symbols-outlined text-4xl ${medalColors[i]}`} style={{ fontVariationSettings: "'FILL' 1" }}>emoji_events</span>
                                            ) : (
                                                <span className="text-4xl font-black">{`#${rank}`}</span>
                                            )}
                                        </span>
                                        <StudentAvatar url={entry.avatar} alt="" />
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
                        <span className="material-symbols-outlined text-xl" style={{ fontVariationSettings: "'FILL' 1" }}>sports_esports</span>
                        Back to Games
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
