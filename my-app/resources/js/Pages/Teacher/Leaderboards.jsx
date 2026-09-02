import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { router } from "@inertiajs/react";
import { useRef, useState } from "react";

export default function Leaderboards({ leaderboard, totalStudents, sections = [], filters = {}, auth }) {
    const [activeTab, setActiveTab] = useState("points");
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    const TAB_CONFIG = [
        { key: "points", label: "Points", icon: "military_tech" },
        { key: "wordBlast", label: "Word Blast", icon: "auto_stories" },
        { key: "storyQuest", label: "Story Quest", icon: "record_voice_over" },
    ];

    const activeStudents = leaderboard?.[activeTab] ?? [];

    function navigate(params) {
        router.get(
            "/teacher/leaderboards",
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

    const RANK_COLORS = ["#fbbf24", "#94a3b8", "#d97706"];

    const metricField = {
        points: "points",
        wordBlast: "wordBlastAcc",
        storyQuest: "storyQuestAcc",
    };

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Leaderboards
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    {auth?.user?.name || "Teacher"} • {activeStudents.length} of{" "}
                    {totalStudents} word-warriors
                </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                <div className="flex bg-slate-950 border-2 border-slate-800 rounded-xl p-1 overflow-x-auto">
                    {TAB_CONFIG.map((tab) => (
                        <button
                            key={tab.key}
                            onClick={() => setActiveTab(tab.key)}
                            className={`px-4 py-2 font-black text-xs uppercase whitespace-nowrap rounded-lg transition-all flex items-center gap-2 ${
                                activeTab === tab.key
                                    ? "bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                    : "text-slate-400 hover:text-lime-300"
                            }`}
                        >
                            <span className="material-symbols-outlined text-sm">
                                {tab.icon}
                            </span>
                            {tab.label}
                        </button>
                    ))}
                </div>

                <div className="flex gap-3 w-full sm:w-auto">
                    <select
                        value={filters.section ?? ""}
                        onChange={handleSection}
                        className="appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-3 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer text-sm"
                    >
                        <option value="">All Sections</option>
                        {sections.map((s) => (
                            <option key={s} value={s}>
                                {s}
                            </option>
                        ))}
                    </select>

                    <div className="relative w-64">
                        <input
                            ref={searchRef}
                            type="text"
                            placeholder="Search name..."
                            defaultValue={filters.search ?? ""}
                            onChange={handleSearch}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-10 pr-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all text-sm"
                        />
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-lg">
                            search
                        </span>
                    </div>
                </div>
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] overflow-hidden">
                {activeStudents.length === 0 ? (
                    <div className="text-center py-16 text-slate-500">
                        <span className="material-symbols-outlined text-5xl mb-4 block">
                            rocket_launch
                        </span>
                        <p className="font-black uppercase tracking-widest text-sm">
                            No students match the current filters
                        </p>
                    </div>
                ) : (
                    <div className="divide-y-2 divide-slate-800/50">
                        {activeStudents.map((s, i) => {
                            const rank = i + 1;
                            const field = metricField[activeTab];
                            const metricValue = s[field];
                            const displayValue =
                                activeTab === "points"
                                    ? `${metricValue} pts`
                                    : `${metricValue}%`;

                            return (
                                <div
                                    key={s.id}
                                    className="flex items-center justify-between p-4 lg:p-6 transition-colors hover:bg-slate-900/50"
                                >
                                    <div className="flex items-center gap-4">
                                        <span className="w-10 flex items-center justify-center">
                                            {rank <= 3 ? (
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

                                        <div className="w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden shrink-0">
                                            {s.avatar ? (
                                                <img
                                                    src={s.avatar}
                                                    alt={s.name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="material-symbols-outlined text-xl text-slate-500">
                                                    person
                                                </span>
                                            )}
                                        </div>

                                        <div className="min-w-0">
                                            <p className="font-black text-white text-base truncate max-w-[16rem] lg:max-w-[20rem]" title={s.name}>
                                                {s.name}
                                            </p>
                                            <p className="text-sm text-slate-500 font-semibold">
                                                {s.section || "No Section"} •
                                                ID: {s.studentID}
                                            </p>
                                        </div>
                                    </div>

                                    <div className="text-right">
                                        <p className="font-black text-xl text-white">
                                            {displayValue}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
}
