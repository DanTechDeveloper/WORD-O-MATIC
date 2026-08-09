import DashboardLayout from "../../Layouts/Teacher/DashboardLayout";
import { useState } from "react";

import {
    BarChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
    CartesianGrid,
    Bar,
    Cell
} from "recharts";
import StatCard from "@/Components/Teacher/StatCard";
import Card from "@/Components/Teacher/Card";
import StatusBadge from "@/Components/Teacher/StatusBadge";
import TabBar from "@/Components/Teacher/TabBar";
import TableTh from "@/Components/Teacher/TableTh";
import TableEmptyRow from "@/Components/Teacher/TableEmptyRow";
import SearchInput from "@/Components/Teacher/SearchInput";
import SelectField from "@/Components/Teacher/SelectField";

export default function Dashboard({
    totalStudents,
    avgReadAccuracy,
    avgSpeakAccuracy,
    totalClassPoints,
    sectionPerformance = [],
    chartCounts,
    topStudents = [],
    students = [],
    auth,
}) {
    const [selectedSection, setSelectedSection] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [activeMetric, setActiveMetric] = useState("points");
    const METRICS = [
        { value: "points", label: "Points", icon: "military_tech" },
        { value: "wordBlast", label: "Word Blast", icon: "auto_stories" },
        { value: "storyQuest", label: "Story Quest", icon: "record_voice_over" },
    ];
    const metricValueKey = {
        points: "points",
        wordBlast: "wordBlastAcc",
        storyQuest: "storyQuestAcc",
    };

    const stats = [
        {
            label: "Total Students",
            value: totalStudents,
            icon: "group",
            color: "text-blue-400",
        },
        {
            label: "Total AVG Word Blast Score",
            value: `${avgReadAccuracy}%`,
            icon: "auto_stories",
            color: "text-purple-400",
        },
        {
            label: "Total AVG Story Quest Score",
            value: `${avgSpeakAccuracy}%`,
            icon: "record_voice_over",
            color: "text-lime-400",
        },
        {
            label: "Total Class Points",
            value: totalClassPoints?.toLocaleString() ?? "0",
            icon: "military_tech",
            color: "text-yellow-400",
        },
    ];

    const activeMetricKey = activeMetric;
    const currentList = topStudents[activeMetricKey] ?? [];
    const filteredTopStudents = currentList
        .filter((s) => !nameFilter || s.name.toLowerCase().includes(nameFilter.toLowerCase()))
        .filter((s) => !selectedSection || s.section === selectedSection)
        .slice(0, 10)
        .map((s, i) => ({ ...s, rank: i + 1 }));

    const sectionListForFilter = [...new Set(currentList.map((s) => s.section).filter(Boolean))];

    const topBarKey = metricValueKey[activeMetricKey];

    const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];

    const STATUS_CATEGORIES = [
        { value: "notStarted", label: "Not Started", countKey: "notStarted", color: "#64748b", icon: "hourglass_empty" },
        { value: "in_progress", label: "In Progress", countKey: "in_progress", color: "#38bdf8", icon: "progress_activity" },
        { value: "atRisk", label: "At Risk", countKey: "atRisk", color: "#fb7185", icon: "error" },
        { value: "needsSupport", label: "Needs Support", countKey: "needsSupport", color: "#fbbf24", icon: "tips_and_updates" },
        { value: "onTrack", label: "On Track", countKey: "onTrack", color: "#a3e635", icon: "check_circle" },
    ];

    const chartData = STATUS_CATEGORIES.map((cat) => ({
        name: cat.label,
        value: chartCounts?.[cat.countKey] ?? 0,
        color: cat.color,
    }));

    const [selectedCategory, setSelectedCategory] = useState("notStarted");
    const [selectedHealthSection, setSelectedHealthSection] = useState("");

    const selectCategory = (key) => {
        setSelectedCategory(key === selectedCategory ? "" : key);
    };

    const statusSections = [...new Set(students.map((s) => s.section).filter(Boolean))];
    const tableStudents = students
        .filter((s) => !selectedCategory || s.status === selectedCategory)
        .filter((s) => !selectedHealthSection || s.section === selectedHealthSection);

    const ColoredBar = ({ payload, ...props }) => (
        <rect {...props} fill={payload?.color ?? "#a3e635"} />
    );

    const STATUS_BADGE_CLASS = {
        onTrack: "bg-green-900/50 text-green-400 border-green-500",
        needsSupport: "bg-amber-900/50 text-amber-400 border-amber-500",
        notStarted: "bg-slate-800/50 text-slate-500 border-slate-700",
        atRisk: "bg-rose-900/50 text-rose-400 border-rose-500",
        in_progress: "bg-sky-900/50 text-sky-400 border-sky-500",
    };

    const statusBadge = (status) => {
        const cfg = STATUS_CATEGORIES.find((c) => c.value === status);
        return (
            <StatusBadge color={STATUS_BADGE_CLASS[status] ?? STATUS_BADGE_CLASS.notStarted}>
                {cfg?.label ?? status}
            </StatusBadge>
        );
    };

    const labelFor = (key) =>
        METRICS.find((m) => m.value === key)?.label ?? key;

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Welcome back, {auth?.user?.name || "Teacher"}!
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    System status: Operational • Sector 7 monitoring active
                </p>
            </div>

            {/* Stats Cards — horizontal */}
            <div className="flex flex-col sm:flex-row gap-4 mb-10">
                {stats.map((stat, index) => (
                    <StatCard
                        key={index}
                        {...stat}
                        iconPosition="row"
                        className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default flex-1"
                    />
                ))}
            </div>

            {/* Class Health Distribution — bar graph */}
            <Card className="mb-10">
                <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                    <span className="material-symbols-outlined text-cyan-400 text-sm">
                        monitoring
                    </span>
                    Class Health Distribution
                </h3>
                <div className="h-[220px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            data={chartData}
                            margin={{ top: 10, right: 20, left: 0, bottom: 0 }}
                        >
                            <XAxis
                                dataKey="name"
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="#94a3b8"
                                fontSize={11}
                                tickLine={false}
                                axisLine={false}
                                allowDecimals={false}
                            />
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e293b"
                                vertical={false}
                            />
                            <Tooltip
                                contentStyle={{
                                    backgroundColor: "#0f172a",
                                    border: "2px solid #334155",
                                    borderRadius: "12px",
                                }}
                                itemStyle={{
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                }}
                                labelStyle={{
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "bold",
                                }}
                                formatter={(value) => [`${value} Students`, "Count"]}
                            />
                            <Bar dataKey="value" shape={<ColoredBar />} radius={[6, 6, 0, 0]} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Legend chips — clickable to filter the student table */}
                <div className="mt-4 flex flex-wrap gap-2">
                    {STATUS_CATEGORIES.map((cat) => (
                        <button
                            key={cat.value}
                            onClick={() => selectCategory(cat.value)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-black uppercase italic text-xs transition-all ${
                                selectedCategory === cat.value
                                    ? "bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                    : "bg-slate-950 border-2 border-slate-800 text-slate-400 hover:text-lime-300"
                            }`}
                        >
                            <span
                                className="material-symbols-outlined text-sm"
                                style={{ color: cat.color }}
                            >
                                {cat.icon}
                            </span>
                            {cat.label} ({chartCounts?.[cat.countKey] ?? 0})
                        </button>
                    ))}
                </div>

                {/* Student table (filtered by category + section) */}
                <div className="mt-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                        <h4 className="text-white font-black uppercase italic text-sm">
                            {selectedCategory
                                ? `Students: ${STATUS_CATEGORIES.find((c) => c.value === selectedCategory)?.label}`
                                : "All Students"}
                        </h4>
                        <SelectField
                            value={selectedHealthSection}
                            onChange={(e) => setSelectedHealthSection(e.target.value)}
                            icon="expand_more"
                            selectClassName="py-2"
                            wrapperClassName="min-w-[160px]"
                        >
                            <option value="">All Sections</option>
                            {statusSections.map((section) => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </SelectField>
                    </div>
                    <div className="border-2 border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-800 bg-slate-950">
                                    <TableTh className="px-4 py-2">Name</TableTh>
                                    <TableTh className="px-4 py-2 text-right">Word Blast</TableTh>
                                    <TableTh className="px-4 py-2 text-right">Story Quest</TableTh>
                                    <TableTh className="px-4 py-2">Status</TableTh>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {tableStudents.length === 0 ? (
                                    <TableEmptyRow colSpan="4">
                                        No students match the current filters
                                    </TableEmptyRow>
                                ) : (
                                    tableStudents.map((s) => (
                                        <tr
                                            key={s.id}
                                            className="hover:bg-slate-900/50 transition-colors"
                                        >
                                            <td className="px-4 py-3 text-white font-bold">{s.name}</td>
                                            <td className="px-4 py-3 text-purple-400 font-black italic text-right">{s.wordBlastAcc ?? 0}%</td>
                                            <td className="px-4 py-3 text-cyan-400 font-black italic text-right">{s.storyQuestAcc ?? 0}%</td>
                                            <td className="px-4 py-3">{statusBadge(s.status)}</td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </Card>

            {/* Section Performance Comparison Table */}
            <Card pad="10" className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                        <span className="material-symbols-outlined text-cyan-400">
                            analytics
                        </span>
                        Section Performance Overview
                    </h2>

                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="border-b-4 border-slate-800">
                                <TableTh>Section</TableTh>
                                <TableTh align="center">Total Students</TableTh>
                                <TableTh>AVG. WORD BLAST</TableTh>
                                <TableTh>AVG. STORY QUEST</TableTh>
                                <TableTh>FINAL STATUS</TableTh>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/50">
                            {sectionPerformance.map((item, idx) => (
                                <tr
                                    key={idx}
                                    className="hover:bg-slate-900/50 transition-all"
                                >
                                    <td className="px-6 py-4 text-white font-bold">
                                        {item.section}
                                    </td>
                                    <td className="px-6 py-4 text-white text-center font-bold">
                                        {item.student_count}
                                    </td>
                                    <td className="px-6 py-4 text-purple-400 font-black italic">
                                        {item.avg_read}%
                                    </td>
                                    <td className="px-6 py-4 text-lime-400 font-black italic">
                                        {item.avg_speak}%
                                    </td>
                                    <td className="px-6 py-4">
                                        <StatusBadge
                                            color={
                                                item.status === "On Track"
                                                    ? "green"
                                                    : item.status === "Needs Support"
                                                      ? "amber"
                                                      : item.status === "Not Started"
                                                        ? "slate"
                                                        : "rose"
                                            }
                                        >
                                            {item.status}
                                        </StatusBadge>
                                    </td>
                                </tr>
                            ))}
                            {sectionPerformance.length === 0 && (
                                <TableEmptyRow colSpan="6">
                                    No section data available
                                </TableEmptyRow>
                            )}
                        </tbody>
                    </table>
                </div>
            </Card>

            {/* Top Performing Students */}
            <Card pad="10" className="mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                            <span className="material-symbols-outlined text-yellow-400">
                                leaderboard
                            </span>
                            Top Performing Students
                        </h2>
                        <TabBar
                            tabs={METRICS}
                            active={activeMetricKey}
                            onSelect={setActiveMetric}
                            className="flex items-center gap-1 bg-slate-950 border-2 border-slate-800 rounded-xl p-1"
                            itemClassName="flex items-center gap-1.5 px-4 py-2 rounded-lg font-black uppercase italic text-xs transition-all"
                            activeClassName="bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                            inactiveClassName="text-slate-500 hover:text-lime-300"
                        />
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 items-center">
                        <SearchInput
                            value={nameFilter}
                            onChange={(e) => setNameFilter(e.target.value)}
                            placeholder="Search name..."
                        />
                        <SelectField
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                            icon="expand_more"
                            selectClassName="py-3"
                            wrapperClassName="min-w-[160px]"
                        >
                            <option value="">All Sections</option>
                            {sectionListForFilter.map((section) => (
                                <option key={section} value={section}>{section}</option>
                            ))}
                        </SelectField>
                    </div>
                </div>
                {filteredTopStudents.length > 0 ? (
                    <div
                        className="w-full"
                        style={{ height: `${Math.max(200, filteredTopStudents.length * 50)}px` }}
                    >
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                layout="vertical"
                                data={filteredTopStudents}
                                margin={{
                                    top: 10,
                                    right: 30,
                                    left: 20,
                                    bottom: 5,
                                }}
                            >
                                <CartesianGrid
                                    strokeDasharray="3 3"
                                    stroke="#1e293b"
                                    horizontal={false}
                                />
                                <XAxis
                                    type="number"
                                    stroke="#94a3b8"
                                    tickFormatter={(value) => value.toLocaleString()}
                                />
                                <YAxis
                                    dataKey="name"
                                    type="category"
                                    stroke="#94a3b8"
                                    width={210}
                                    tick={({ x, y, payload, index }) => {
                                        const s = filteredTopStudents[index];
                                        const isRank = s && s.rank <= 3;
                                        return (
                                            <g transform={`translate(${x},${y})`}>
                                                <foreignObject x={-210} y={-10} width={210} height={22}>
                                                    <div className="flex items-center justify-end gap-1.5 w-full h-full pr-3">
                                                        {isRank && (
                                                            <span className="material-symbols-outlined text-[15px] leading-none" style={{ color: RANK_COLORS[s.rank - 1] }}>
                                                                emoji_events
                                                            </span>
                                                        )}
                                                        <span className="text-sm font-bold whitespace-nowrap" style={{ color: '#e2e8f0' }}>
                                                            {payload.value}
                                                        </span>
                                                    </div>
                                                </foreignObject>
                                            </g>
                                        );
                                    }}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(255,255,255,0.1)" }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const s = payload[0].payload;
                                        return (
                                            <div className="bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg">
                                                <p className="text-white font-black text-sm mb-2 flex items-center gap-1.5">
                                                    {s.rank <= 3 && (
                                                        <span className="material-symbols-outlined text-base" style={{ color: RANK_COLORS[s.rank - 1] }}>
                                                            emoji_events
                                                        </span>
                                                    )}
                                                    <span>{s.name}</span>
                                                </p>
                                                 <div className="space-y-1 text-xs">
                                                 <p className="font-black text-lime-400">
                                                     {labelFor(activeMetricKey)}:{" "}
                                                     {topBarKey === "points"
                                                         ? `${s.points?.toLocaleString() ?? 0}`
                                                         : `${s[topBarKey] ?? 0}%`}
                                                 </p>
                                                 <p className="text-slate-400 font-semibold">Section: {s.section || 'N/A'}</p>
                                                 <p className="text-purple-400 font-semibold">Word Blast: {s.wordBlastAcc ?? 0}%</p>
                                                 <p className="text-cyan-400 font-semibold">Story Quest: {s.storyQuestAcc ?? 0}%</p>
                                             </div>
                                            </div>
                                        );
                                    }}
                                />
                                <Bar dataKey={topBarKey} radius={[10, 10, 10, 10]}>
                                    {filteredTopStudents.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={index < 3 ? RANK_COLORS[index] : "#a3e635"}
                                        />
                                    ))}
                                </Bar>
                            </BarChart>
                        </ResponsiveContainer>
                    </div>
                ) : (
                    <div className="text-center py-10 text-slate-600 font-black uppercase tracking-widest text-sm">
                        No students match the current filters
                    </div>
                )}
            </Card>
        </DashboardLayout>
    );
}