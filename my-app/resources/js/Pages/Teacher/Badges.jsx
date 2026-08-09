import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { useState } from "react";
import StatCard from "@/Components/Teacher/StatCard";
import Card from "@/Components/Teacher/Card";
import SelectField from "@/Components/Teacher/SelectField";
import SearchInput from "@/Components/Teacher/SearchInput";
import TableTh from "@/Components/Teacher/TableTh";
import TableEmptyRow from "@/Components/Teacher/TableEmptyRow";
import AvatarChip from "@/Components/Teacher/AvatarChip";

const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];

export default function Badges({
    badges,
    topEarners,
    totalStudents,
    totalBadges,
    totalEarned,
    mostEarnedBadge,
    sections = [],
    auth,
}) {
    const [search, setSearch] = useState("");
    const [selectedSection, setSelectedSection] = useState("");

    const formatRelativeTime = (isoString) => {
        if (!isoString) return "—";
        const d = new Date(isoString);
        const now = new Date();
        const diffHrs = (now - d) / (1000 * 60 * 60);
        if (diffHrs < 1) return `${Math.round(diffHrs * 60)}m ago`;
        if (diffHrs < 24) return `${Math.round(diffHrs)}h ago`;
        if (diffHrs < 48) return "Yesterday";
        return `${Math.round(diffHrs / 24)}d ago`;
    };

    const filtered = (topEarners ?? [])
        .filter((s) => !selectedSection || s.section === selectedSection)
        .filter(
            (s) =>
                !search || s.name.toLowerCase().includes(search.toLowerCase()),
        );

    const summaryCards = [
        {
            label: "Total Badges",
            value: totalBadges,
            icon: "military_tech",
            color: "text-purple-400",
        },
        {
            label: "Total Earned",
            value: totalEarned,
            icon: "emoji_events",
            color: "text-yellow-400",
        },
        {
            label: "Most Earned",
            value: mostEarnedBadge?.name || "N/A",
            sub: mostEarnedBadge
                ? `${mostEarnedBadge.earned_count}/${totalStudents}`
                : "",
            icon: "local_fire_department",
            color: "text-rose-400",
        },
        {
            label: "Zero Badge Students",
            value: filtered.filter((s) => s.badge_count === 0).length,
            icon: "warning",
            color: "text-sky-400",
        },
    ];

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Badges
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    {auth?.user?.name || "Teacher"} • Monitor badge distribution
                    across {totalStudents} students
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-10">
                {summaryCards.map((card, i) => (
                    <StatCard key={i} {...card} />
                ))}
            </div>

            <Card className="mb-10">
                <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3 mb-6">
                    <span className="material-symbols-outlined text-yellow-400">
                        workspace_premium
                    </span>
                    Badge Catalog
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {badges.map((badge) => {
                        const pct =
                            totalStudents > 0
                                ? Math.round(
                                      (badge.earned_count / totalStudents) *
                                          100,
                                  )
                                : 0;
                        const barColor =
                            pct >= 60
                                ? "bg-lime-400"
                                : pct >= 30
                                  ? "bg-yellow-400"
                                  : "bg-rose-400";
                        return (
                            <div
                                key={badge.id}
                                className="bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-center group"
                            >
                                <div className="w-12 h-12 mx-auto mb-2 flex items-center justify-center">
                                    <span className="material-symbols-outlined text-3xl text-slate-300">
                                        {badge.icon || "star"}
                                    </span>
                                </div>
                                <h3 className="text-white font-black uppercase italic text-xs mb-1 truncate">
                                    {badge.name}
                                </h3>
                                <p className="text-slate-500 font-black uppercase text-[10px] tracking-widest">
                                    {badge.earned_count}/{totalStudents}
                                </p>
                                <div className="w-full h-2.5 bg-slate-900 rounded-full border border-slate-800 overflow-hidden mt-2">
                                    <div
                                        className={`h-full ${barColor} rounded-full transition-all`}
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Card>

            <Card>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-400">
                            leaderboard
                        </span>
                        Top Badge Earners
                    </h2>
                    <div className="flex gap-3 w-full md:w-auto items-center">
                        <SelectField
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            padSelect="py-2"
                            wrapperClassName="flex-1 md:flex-none"
                        >
                            <option value="">All Sections</option>
                            {sections.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </SelectField>

                        <SearchInput
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Search name..."
                            pad="py-2"
                            inputIconPad="pl-10 pr-4"
                            iconClassName="text-slate-500 text-lg"
                            wrapperClassName="w-56"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-4 border-slate-800">
                                <TableTh>Rank</TableTh>
                                <TableTh>Student</TableTh>
                                <TableTh>Section</TableTh>
                                <TableTh align="center">Badges</TableTh>
                                <TableTh>Last Earned</TableTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/50">
                            {filtered.length === 0 && (
                                <TableEmptyRow colSpan="5">
                                    No students match the current filters
                                </TableEmptyRow>
                            )}
                            {filtered.map((student, i) => {
                                const rank = i + 1;
                                const isTop3 = rank <= 3;
                                return (
                                    <tr
                                        key={student.id}
                                        className={`hover:bg-slate-900/50 transition-colors ${
                                            student.badge_count === 0
                                                ? "opacity-60"
                                                : ""
                                        }`}
                                    >
                                        <td className="px-6 py-4">
                                            <span className="flex items-center justify-center w-8 h-8">
                                                {isTop3 ? (
                                                    <span
                                                        className="material-symbols-outlined text-3xl"
                                                        style={{
                                                            color: RANK_COLORS[
                                                                rank - 1
                                                            ],
                                                            fontVariationSettings:
                                                                "'FILL' 1",
                                                        }}
                                                    >
                                                        emoji_events
                                                    </span>
                                                ) : (
                                                    <span className="text-xl font-black text-slate-400">
                                                        #{rank}
                                                    </span>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <AvatarChip
                                                    src={student.avatar}
                                                    alt={student.name}
                                                    size="w-10 h-10"
                                                />
                                                <span className="font-black text-white">
                                                    {student.name}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 font-semibold">
                                                {student.section || "—"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <span
                                                className={`font-black text-xl ${
                                                    student.badge_count === 0
                                                        ? "text-slate-500"
                                                        : student.badge_count >=
                                                            5
                                                          ? "text-lime-400"
                                                          : student.badge_count >=
                                                              3
                                                            ? "text-yellow-400"
                                                            : "text-rose-400"
                                                }`}
                                            >
                                                {student.badge_count}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="text-slate-500 font-semibold text-sm">
                                                {formatRelativeTime(
                                                    student.last_earned_at,
                                                )}
                                            </span>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </Card>
        </DashboardLayout>
    );
}