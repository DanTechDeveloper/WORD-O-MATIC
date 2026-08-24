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
        { key: "points", label: "Points", icon: "military_tech", valueKey: "points" },
        { key: "wordBlast", label: "Word Blast", icon: "auto_stories", valueKey: "wordBlastAcc" },
        { key: "storyQuest", label: "Story Quest", icon: "record_voice_over", valueKey: "storyQuestAcc" },
    ];
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

    const activeMetricObj = METRICS.find((m) => m.key === activeMetric) ?? METRICS[0];
    const currentList = topStudents[activeMetricObj.key] ?? [];
    const filteredTopStudents = currentList
        .filter((s) => !nameFilter || s.name.toLowerCase().includes(nameFilter.toLowerCase()))
        .filter((s) => !selectedSection || s.section === selectedSection)
        .slice(0, 10)
        .map((s, i) => ({ ...s, rank: i + 1 }));

    const sectionListForFilter = [...new Set(currentList.map((s) => s.section).filter(Boolean))];

    const topBarKey = activeMetricObj.valueKey;

    const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];

    const STATUS_CATEGORIES = [
        { key: "notStarted", label: "Not Started", countKey: "notStarted", color: "#64748b", icon: "hourglass_empty" },
        { key: "in_progress", label: "In Progress", countKey: "in_progress", color: "#38bdf8", icon: "progress_activity" },
        { key: "atRisk", label: "At Risk", countKey: "atRisk", color: "#fb7185", icon: "error" },
        { key: "support", label: "Needs Support", countKey: "support", color: "#fbbf24", icon: "tips_and_updates" },
        { key: "onTrack", label: "On Track", countKey: "onTrack", color: "#a3e635", icon: "check_circle" },
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

    const ColoredBar = ({ x, y, width, height, payload }) => (
        <rect x={x} y={y} width={width} height={height} fill={payload?.color ?? "#a3e635"} />
    );

    const STATUS_BADGE = {
        onTrack: "bg-green-900/50 text-green-400 border-green-500",
        support: "bg-amber-900/50 text-amber-400 border-amber-500",
        notStarted: "bg-slate-800/50 text-slate-500 border-slate-700",
        atRisk: "bg-rose-900/50 text-rose-400 border-rose-500",
        in_progress: "bg-sky-900/50 text-sky-400 border-sky-500",
    };

    const statusBadge = (status) => {
        const cfg = STATUS_CATEGORIES.find((c) => c.key === status);
        return (
            <span
                className={`px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase ${
                    STATUS_BADGE[status] ?? "bg-slate-800/50 text-slate-500 border-slate-700"
                }`}
            >
                {cfg?.label ?? status}
            </span>
        );
    };

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
                    <div
                        key={index}
                        className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default flex-1"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span
                                className={`material-symbols-outlined text-3xl ${stat.color}`}
                            >
                                {stat.icon}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                            {stat.label}
                        </h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            {/* Class Health Distribution — bar graph */}
            <div className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] mb-10">
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
                            key={cat.key}
                            onClick={() => selectCategory(cat.key)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg font-black uppercase italic text-xs transition-all ${
                                selectedCategory === cat.key
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
                                ? `Students: ${STATUS_CATEGORIES.find((c) => c.key === selectedCategory)?.label}`
                                : "All Students"}
                        </h4>
                        <div className="relative min-w-[160px]">
                            <select
                                className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-2 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all text-sm"
                                value={selectedHealthSection}
                                onChange={(e) => setSelectedHealthSection(e.target.value)}
                            >
                                <option value="">All Sections</option>
                                {statusSections.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                filter_list
                            </span>
                        </div>
                    </div>
                    <div className="border-2 border-slate-800 rounded-xl overflow-hidden">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="border-b-2 border-slate-800 bg-slate-950">
                                    <th className="px-4 py-2 text-slate-500 font-black uppercase text-xs tracking-widest">Name</th>
                                    <th className="px-4 py-2 text-slate-500 font-black uppercase text-xs tracking-widest text-right">Word Blast</th>
                                    <th className="px-4 py-2 text-slate-500 font-black uppercase text-xs tracking-widest text-right">Story Quest</th>
                                    <th className="px-4 py-2 text-slate-500 font-black uppercase text-xs tracking-widest">Status</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-800/50">
                                {tableStudents.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan="4"
                                            className="px-4 py-8 text-center text-slate-600 font-black uppercase tracking-widest text-sm"
                                        >
                                            No students match the current filters
                                        </td>
                                    </tr>
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
            </div>

            {/* Section Performance Comparison Table */}
            <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] mb-10">
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
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    Section
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest text-center">
                                    Total Students
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    AVG. WORD BLAST
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    AVG. STORY QUEST
                                </th>
                                <th className="px-6 py-4 text-slate-500 font-black uppercase text-xs tracking-widest">
                                    FINAL STATUS
                                </th>
                            
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
                                            <span
                                                className={`px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase ${
                                                    item.status === "On Track"
                                                        ? "bg-green-900/50 text-green-400 border-green-500"
                                                        : item.status ===
                                                            "Needs Support"
                                                          ? "bg-amber-900/50 text-amber-400 border-amber-500"
                                                          : item.status === "Not Started"
                                                            ? "bg-slate-800/50 text-slate-500 border-slate-700"
                                                            : "bg-rose-900/50 text-rose-400 border-rose-500"
                                                }`}
                                            >
                                                {item.status}
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                            {sectionPerformance.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-10 text-center text-slate-600 font-black uppercase tracking-widest"
                                    >
                                        No section data available
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Top Performing Students */}
            <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] mb-10">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                    <div className="flex items-center gap-4">
                        <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                            <span className="material-symbols-outlined text-yellow-400">
                                leaderboard
                            </span>
                            Top Performing Students
                        </h2>
                        <div className="flex items-center gap-1 bg-slate-950 border-2 border-slate-800 rounded-xl p-1">
                            {METRICS.map((metric) => (
                                <button
                                    key={metric.key}
                                    onClick={() => setActiveMetric(metric.key)}
                                    className={`flex items-center gap-1.5 px-4 py-2 rounded-lg font-black uppercase italic text-xs transition-all ${
                                        activeMetric === metric.key
                                            ? "bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                            : "text-slate-500 hover:text-lime-300"
                                    }`}
                                >
                                    <span className="material-symbols-outlined text-sm">{metric.icon}</span>
                                    {metric.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Search name..."
                                value={nameFilter}
                                onChange={(e) => setNameFilter(e.target.value)}
                                className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all text-sm"
                            />
                            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                                search
                            </span>
                        </div>
                        <div className="relative min-w-[160px]">
                            <select
                                className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all text-sm"
                                value={selectedSection}
                                onChange={(e) => setSelectedSection(e.target.value)}
                            >
                                <option value="">All Sections</option>
                                {sectionListForFilter.map((section) => (
                                    <option key={section} value={section}>{section}</option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                filter_list
                            </span>
                        </div>
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
                                                         {activeMetricObj.label}:{" "}
                                                         {activeMetricObj.valueKey === "points"
                                                             ? `${s.points?.toLocaleString() ?? 0}`
                                                             : `${s[activeMetricObj.valueKey] ?? 0}%`}
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
            </div>
        </DashboardLayout>
    );
}
