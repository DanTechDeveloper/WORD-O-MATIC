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
            <div className="mb-4 pt-2">
                <BackButton />
            </div>
            <div className="max-w-4xl mx-auto pt-2">
                <DeadlineBanner isDeadlineClosed={isDeadlineClosed} />

                <PageHeader icon="emoji_events" title="Leaderboard" as="h1" />

                {/* Current user highlight */}
                {currentEntry && (
                    <div
                        className="mb-6 bg-lime-400/10 border-2 border-lime-400/50 rounded-xl p-4 sm:p-5 flex items-center justify-between gap-3"
                        style={{ boxShadow: "0 0 20px rgba(163,230,53,0.1)" }}
                    >
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0">
                            <StudentAvatar
                                url={currentEntry.avatar}
                                alt=""
                                size="lg"
                            />
                            <div className="min-w-0">
                                <p className="text-xl sm:text-2xl font-black text-lime-400 truncate">
                                    {currentUserName}
                                </p>
                                <p className="text-xs sm:text-sm text-on-surface-variant font-bold">
                                    That's you!
                                </p>
                            </div>
                        </div>
                        <div className="text-right shrink-0">
                            <p className="text-2xl sm:text-3xl font-black text-lime-400">
                                {currentEntry.points}
                            </p>
                            <p className="text-xs text-on-surface-variant font-bold uppercase">
                                pts
                            </p>
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
                            const isCurrentUser =
                                entry.user_id === currentUserId;
                            const isTop3 = rank <= 3;
                            const medalColors = [
                                "text-tertiary",
                                "text-slate-300",
                                "text-amber-700",
                            ];

                            return (
                                <div
                                    key={entry.user_id}
                                    className={`flex items-center justify-between p-4 sm:p-6 rounded-xl border-2 transition-all gap-3 ${
                                        isCurrentUser
                                            ? "bg-lime-400/10 border-lime-400/50"
                                            : "bg-surface-container border-surface-variant/20"
                                    }`}
                                >
                                    <div className="flex items-center gap-4 sm:gap-8 min-w-0">
                                        <span className="w-10 sm:w-14 flex items-center justify-center shrink-0">
                                            {isTop3 ? (
                                                <span
                                                    className={`material-symbols-outlined text-2xl sm:text-4xl ${medalColors[i]}`}
                                                    style={{
                                                        fontVariationSettings:
                                                            "'FILL' 1",
                                                    }}
                                                >
                                                    emoji_events
                                                </span>
                                            ) : (
                                                <span className="text-2xl sm:text-4xl font-black">{`#${rank}`}</span>
                                            )}
                                        </span>
                                        <StudentAvatar
                                            url={entry.avatar}
                                            alt=""
                                        />
                                        <div className="min-w-0">
                                            <p
                                                className={`font-black text-base sm:text-lg truncate ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}
                                            >
                                                {isCurrentUser
                                                    ? currentUserName
                                                    : `${entry.user.name}`}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p
                                            className={`font-black text-xl sm:text-2xl ${isCurrentUser ? "text-lime-400" : "text-on-surface"}`}
                                        >
                                            {entry.points}
                                        </p>
                                        <p className="text-xs text-on-surface-variant font-bold uppercase">
                                            pts
                                        </p>
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
                        <span
                            className="material-symbols-outlined text-xl"
                            style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                            sports_esports
                        </span>
                        Back to Games
                    </Link>
                </div>
            </div>
        </DashboardLayout>
    );
}
