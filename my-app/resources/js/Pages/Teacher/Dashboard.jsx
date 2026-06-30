import DashboardLayout from "../../Layouts/Teacher/DashboardLayout";
import { useState } from "react";
import {
    PieChart,
    Pie,
    Cell,
    ResponsiveContainer,
    Tooltip,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
} from "recharts";

export default function Dashboard({
    totalStudents,
    avgReadAccuracy,
    avgSpeakAccuracy,
    totalClassPoints,
    sectionPerformance = [],
    chartCounts,
    topStudents = [],
    auth,
}) {
    const [selectedSection, setSelectedSection] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const sectionList = sectionPerformance.map((item) => item.section);
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

    const currentList = topStudents.points ?? [];
    const filteredTopStudents = currentList
        .filter((s) => !nameFilter || s.name.toLowerCase().includes(nameFilter.toLowerCase()))
        .filter((s) => !selectedSection || s.section === selectedSection)
        .slice(0, 10)
        .map((s, i) => ({ ...s, rank: i + 1 }));

    const allStudents = topStudents.points ?? [];
    const sectionListForFilter = [...new Set(allStudents.map((s) => s.section).filter(Boolean))];

    const topBarKey = "points";
    const topBarLabel = "Points";

    const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];
    const RANK_EMOJIS = ["🥇", "🥈", "🥉"];

    const chartData = [
        { name: "Not Started", value: chartCounts?.notStarted ?? 0, color: "#64748b" },
        { name: "In Progress", value: chartCounts?.in_progress ?? 0, color: "#38bdf8" },
        { name: "At Risk", value: chartCounts?.atRisk ?? 0, color: "#fb7185" },
        { name: "Needs Support", value: chartCounts?.needsSupport ?? 0, color: "#fbbf24" },
        { name: "On Track", value: chartCounts?.onTrack ?? 0, color: "#a3e635" },
    ];

    

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

            <div className="flex flex-col lg:flex-row gap-6 mb-10">
                {/* Left: Stats Cards Grid */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                    {stats.map((stat, index) => (
                        <div
                            key={index}
                            className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default"
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

                {/* Right: Class Health Sidebar Chart */}
                <div className="lg:w-1/3 bg-slate-900 border-2 border-slate-800 p-8 rounded-2xl shadow-[4px_4px_0_0_#020617] flex flex-col justify-center">
                    <h3 className="text-white text-sm font-black uppercase tracking-widest mb-6 flex items-center gap-2">
                        <span className="material-symbols-outlined text-lime-400 text-sm">
                            monitoring
                        </span>
                        Class Health Distribution
                    </h3>
                    <div className="h-[200px] w-full">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={8}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell
                                            key={`cell-${index}`}
                                            fill={entry.color}
                                            stroke="none"
                                        />
                                    ))}
                                </Pie>
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
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 space-y-2">
                        {chartData.map((item) => (
                            <div
                                key={item.name}
                                className="flex justify-between items-center text-xs font-medium uppercase tracking-widest"
                            >
                                <div className="flex items-center gap-2">
                                    <div
                                        className="w-2 h-2 rounded-full"
                                        style={{ backgroundColor: item.color }}
                                    ></div>
                                    <span className="text-slate-400">
                                        {item.name}
                                    </span>
                                </div>
                                <span className="text-white">
                                    {item.value} Students
                                </span>
                            </div>
                        ))}
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
                            {sectionPerformance
                                .filter(
                                    (item) =>
                                        !selectedSection ||
                                        item.section === selectedSection,
                                )
                                .map((item, idx) => (
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
                    <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                        <span className="material-symbols-outlined text-yellow-400">
                            leaderboard
                        </span>
                        Top Performing Students
                    </h2>
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
                                    width={160}
                                    tick={{ fill: "#e2e8f0", fontWeight: "bold", fontSize: 14 }}
                                    tickFormatter={(value, index) => {
                                        const student = filteredTopStudents[index];
                                        const emoji = student?.rank <= 3 ? `${RANK_EMOJIS[student.rank - 1]} ` : "";
                                        return `${emoji}${value}`;
                                    }}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(255,255,255,0.1)" }}
                                    content={({ active, payload }) => {
                                        if (!active || !payload?.length) return null;
                                        const s = payload[0].payload;
                                        return (
                                            <div className="bg-slate-950 border-2 border-slate-700 rounded-xl px-4 py-3 shadow-lg">
                                                <p className="text-white font-black text-sm mb-2">
                                                    {s.rank <= 3 ? `${RANK_EMOJIS[s.rank - 1]} ` : ""}{s.name}
                                                </p>
                                                <div className="space-y-1 text-xs">
                                                    <p className="font-black text-lime-400">{s.points.toLocaleString()} Points</p>
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
