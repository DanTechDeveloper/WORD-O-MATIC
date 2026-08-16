import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { router } from "@inertiajs/react";
import { useRef } from "react";

const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];

export default function Badges({
    badges,
    topEarners,
    totalStudents,
    totalBadges,
    totalEarned,
    mostEarnedBadge,
    sections = [],
    filters = {},
    auth,
}) {
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    function navigate(params) {
        router.get(
            "/teacher/badges",
            { ...filters, ...params },
            { preserveState: true, preserveScroll: true },
        );
    }

    function handleSearch(e) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({ search: e.target.value });
        }, 300);
    }

    function handleSection(e) {
        navigate({ section: e.target.value });
    }

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

    const filtered = topEarners ?? [];

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
                    <div
                        key={i}
                        className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617]"
                    >
                        <span
                            className={`material-symbols-outlined text-3xl ${card.color} mb-4 block`}
                        >
                            {card.icon}
                        </span>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                            {card.label}
                        </h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter">
                            {card.value}
                        </p>
                        {card.sub && (
                            <p className="text-xs text-slate-500 font-semibold mt-1">
                                {card.sub}
                            </p>
                        )}
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] mb-10">
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
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                    <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-400">
                            leaderboard
                        </span>
                        Top Badge Earners
                    </h2>
                    <div className="flex gap-3 w-full md:w-auto">
                        <select
                            value={filters.section ?? ""}
                            onChange={handleSection}
                            className="appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-2 text-white font-black focus:outline-none focus:border-lime-500 cursor-pointer text-sm flex-1 md:flex-none"
                        >
                            <option value="">All Sections</option>
                            {sections.map((s) => (
                                <option key={s} value={s}>
                                    {s}
                                </option>
                            ))}
                        </select>

                        <div className="relative w-56">
                            <input
                                ref={searchRef}
                                type="text"
                                placeholder="Search name..."
                                defaultValue={filters.search ?? ""}
                                onChange={handleSearch}
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-10 pr-4 py-2 text-white font-bold focus:outline-none focus:border-lime-500 text-sm"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                                search
                            </span>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-4 border-slate-800">
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    Rank
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    Student
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    Section
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest text-center">
                                    Badges
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    Last Earned
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/50">
                            {filtered.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="5"
                                        className="px-6 py-10 text-center text-slate-500 font-black uppercase tracking-widest text-sm"
                                    >
                                        No students match the current filters
                                    </td>
                                </tr>
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
                                                <div className="w-10 h-10 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden">
                                                    {student.avatar ? (
                                                        <img
                                                            src={student.avatar}
                                                            alt={student.name}
                                                            className="w-full h-full object-cover"
                                                        />
                                                    ) : (
                                                        <span className="material-symbols-outlined text-slate-500">
                                                            person
                                                        </span>
                                                    )}
                                                </div>
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
            </div>
        </DashboardLayout>
    );
}
