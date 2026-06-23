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
    teacherName,
}) {
    const [selectedSection, setSelectedSection] = useState("");
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

    const topStudentsData = [
        { name: "Nova Starlight", points: 12500 },
        { name: "Leo Jupiter", points: 11800 },
        { name: "Orion Mars", points: 10500 },
        { name: "Luna Eclipse", points: 9800 },
        { name: "Astro Comet", points: 9200 },
    ];

    const chartData = [
        { name: "Not Started", value: chartCounts?.notStarted ?? 0, color: "#64748b" },
        { name: "At Risk", value: chartCounts?.atRisk ?? 0, color: "#fb7185" },
        {
            name: "Needs Support",
            value: chartCounts?.needsSupport ?? 0,
            color: "#fbbf24",
        },
        {
            name: "On Track",
            value: chartCounts?.onTrack ?? 0,
            color: "#a3e635",
        },
    ];

    

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Welcome back, {teacherName || "Teacher"}!
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
                                        backgroundColor: "#020617",
                                        border: "2px solid #1e293b",
                                        borderRadius: "12px",
                                    }}
                                    itemStyle={{
                                        color: "#fff",
                                        fontSize: "12px",
                                        fontWeight: "medium",
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
                    <div className="relative min-w-[200px]">
                        <select
                            className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all"
                            value={selectedSection}
                            onChange={(e) => setSelectedSection(e.target.value)}
                        >
                            <option value="">Filter By Section</option>
                            {sectionList.map((section) => (
                                <option
                                    key={section}
                                    value={section}
                                >
                                    {section}
                                </option>
                            ))}
                        </select>
                        <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                            filter_list
                        </span>
                    </div>
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
                <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-yellow-400">
                        leaderboard
                    </span>
                    Top Performing Students
                </h2>
                <div className="h-[300px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                            layout="vertical"
                            data={topStudentsData}
                            margin={{
                                top: 20,
                                right: 30,
                                left: 20,
                                bottom: 5,
                            }}
                        >
                            <CartesianGrid
                                strokeDasharray="3 3"
                                stroke="#1e293b"
                            />
                            <XAxis
                                type="number"
                                stroke="#94a3b8"
                                tickFormatter={(value) =>
                                    value.toLocaleString()
                                }
                            />
                            <YAxis
                                dataKey="name"
                                type="category"
                                stroke="#94a3b8"
                                width={120} // Adjust width to prevent name truncation
                                tick={{ fill: "#e2e8f0", fontWeight: "bold" }}
                            />
                            <Tooltip
                                cursor={{ fill: "rgba(255,255,255,0.1)" }}
                                contentStyle={{
                                    backgroundColor: "#020617",
                                    border: "2px solid #1e293b",
                                    borderRadius: "12px",
                                }}
                                itemStyle={{
                                    color: "#fff",
                                    fontSize: "12px",
                                    fontWeight: "medium",
                                }}
                                formatter={(value) =>
                                    `${value.toLocaleString()} Points`
                                }
                            />
                            <Bar
                                dataKey="points"
                                fill="#a3e635"
                                radius={[10, 10, 10, 10]}
                            />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
            </div>

            {/* <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                <h2 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-lime-400">
                        history_edu
                    </span>
                    Recent Mission Feed
                </h2>

                <div className="space-y-4">
                    {recentMissions.map((mission) => (
                        <div
                            key={mission.id}
                            className="flex flex-wrap items-center justify-between p-6 bg-slate-950 border-2 border-slate-800 rounded-2xl hover:border-purple-500 transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div
                                    className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-[4px_4px_0_0_#020617] ${mission.status === "Critical" ? "bg-rose-500" : "bg-lime-400"}`}
                                >
                                    <span className="material-symbols-outlined text-slate-950 font-bold">
                                        {mission.status === "Critical"
                                            ? "priority_high"
                                            : "rocket_launch"}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-black uppercase italic text-lg tracking-tight">
                                        {mission.student}
                                    </p>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">
                                        {mission.task}
                                    </p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p
                                    className={`text-2xl font-black italic tracking-tighter ${mission.status === "Critical" ? "text-rose-400" : "text-lime-400"}`}
                                >
                                    {mission.score}
                                </p>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">
                                    {mission.time}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="mt-10 w-full bg-slate-950 border-4 border-slate-800 p-4 rounded-2xl text-slate-500 font-black uppercase italic text-sm tracking-widest hover:text-white hover:border-purple-500 transition-all">
                    View Intelligence Archive
                </button>
            </div> */}
        </DashboardLayout>
    );
}
