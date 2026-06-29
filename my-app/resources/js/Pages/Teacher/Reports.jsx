import { useState } from "react";
import { router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

const STATUS_CONFIG = {
    atRisk: { label: "At Risk", color: "bg-rose-500", border: "border-rose-500", text: "text-rose-400", bg: "bg-rose-500/10" },
    support: { label: "Needs Support", color: "bg-amber-500", border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
    onTrack: { label: "On Track", color: "bg-lime-500", border: "border-lime-500", text: "text-lime-400", bg: "bg-lime-500/10" },
    notStarted: { label: "Not Started", color: "bg-slate-500", border: "border-slate-500", text: "text-slate-400", bg: "bg-slate-500/10" },
    playing: { label: "Playing", color: "bg-sky-500", border: "border-sky-500", text: "text-sky-400", bg: "bg-sky-500/10" },
};

export default function Reports({ grouped, flash, deadline }) {
    const [tab, setTab] = useState("parents");
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sending, setSending] = useState(false);
    const [deadlineValue, setDeadlineValue] = useState(deadline || "");
    const [savingDeadline, setSavingDeadline] = useState(false);

    const reportTypes = [
        {
            title: "Fleet Performance",
            desc: "Comprehensive overview of average reading and speaking scores across all students.",
            icon: "leaderboard",
            color: "bg-purple-500",
        },
        {
            title: "Risk Assessment",
            desc: "Detailed breakdown of students categorized as High or Moderate risk.",
            icon: "warning",
            color: "bg-rose-500",
        },
        {
            title: "Mission Log Archive",
            desc: "Raw CSV/PDF export of all session logs and individual student attempts.",
            icon: "inventory_2",
            color: "bg-blue-500",
        },
    ];

    const isPastDeadline = deadlineValue && new Date(deadlineValue) < new Date();
    const deadlineDate = deadlineValue ? new Date(deadlineValue) : null;

    const toggleStudent = (id) => {
        setSelectedIds((prev) => {
            const next = new Set(prev);
            if (next.has(id)) next.delete(id);
            else next.add(id);
            return next;
        });
    };

    const toggleGroup = (students) => {
        const ids = students.map((s) => s.id);
        const allSelected = ids.every((id) => selectedIds.has(id));
        setSelectedIds((prev) => {
            const next = new Set(prev);
            ids.forEach((id) => {
                if (allSelected) next.delete(id);
                else next.add(id);
            });
            return next;
        });
    };

    const sendEmails = () => {
        if (selectedIds.size === 0) return;
        setSending(true);
        router.post(
            route("teacher.reports.sendEmails"),
            { student_ids: Array.from(selectedIds) },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSending(false),
            }
        );
    };

    const saveDeadline = () => {
        if (!deadlineValue) return;
        setSavingDeadline(true);
        router.post(
            route("teacher.reports.deadline"),
            { deadline: deadlineValue },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => setSavingDeadline(false),
            }
        );
    };

    const clearDeadline = () => {
        setDeadlineValue("");
        router.post(
            route("teacher.reports.deadline"),
            { deadline: "" },
            {
                preserveScroll: true,
                preserveState: true,
            }
        );
    };

    const statusOrder = ["atRisk", "support", "onTrack", "playing", "notStarted"];

    const renderDeadlineBanner = () => {
        if (!deadlineValue) return null;

        if (isPastDeadline) {
            return (
                <div className="mb-8 bg-lime-500/10 border-2 border-lime-500 rounded-2xl p-5 flex items-center gap-4">
                    <span className="material-symbols-outlined text-lime-400 text-3xl">
                        check_circle
                    </span>
                    <div>
                        <p className="text-white font-black uppercase italic text-sm">
                            Report deadline has passed
                        </p>
                        <p className="text-slate-400 text-sm font-semibold mt-1">
                            All report actions are now available. Deadline was set to {deadlineDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}.
                        </p>
                    </div>
                </div>
            );
        }

        return (
            <div className="mb-8 bg-amber-500/10 border-2 border-amber-500 rounded-2xl p-5 flex items-center gap-4">
                <span className="material-symbols-outlined text-amber-400 text-3xl">
                    schedule
                </span>
                <div>
                    <p className="text-white font-black uppercase italic text-sm">
                        Reporting deadline not yet reached
                    </p>
                    <p className="text-slate-400 text-sm font-semibold mt-1">
                        Reports are set to be generated after {deadlineDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}. You may still proceed, but data may not be final.
                    </p>
                </div>
            </div>
        );
    };

    const renderDeadlineSetter = () => (
        <div className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617] mb-8">
            <h2 className="text-2xl font-black text-white uppercase italic mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-purple-400">
                    event
                </span>
                Report Deadline
            </h2>
            <p className="text-slate-400 text-sm font-semibold mb-6">
                Set a deadline for this reporting period. Once the deadline passes, generate and send reports with the final data.
            </p>

            <div className="flex items-end gap-4">
                <div className="flex-1 space-y-3">
                    <label className="text-slate-500 text-xs font-black uppercase tracking-widest block">
                        Deadline Date & Time
                    </label>
                    <input
                        type="datetime-local"
                        value={deadlineValue ? deadlineValue.slice(0, 16) : ""}
                        onChange={(e) => setDeadlineValue(e.target.value)}
                        className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none"
                    />
                </div>
                <button
                    onClick={saveDeadline}
                    disabled={!deadlineValue || savingDeadline}
                    className={`px-8 py-4 rounded-xl font-black uppercase italic text-sm transition-all flex items-center gap-2 ${
                        deadlineValue && !savingDeadline
                            ? "bg-purple-500 text-slate-950 shadow-[4px_4px_0_0_#1e1b4b] hover:translate-x-[-2px] hover:translate-y-[-2px]"
                            : "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                    }`}
                >
                    {savingDeadline ? (
                        <>
                            <span className="material-symbols-outlined animate-spin">
                                progress_activity
                            </span>
                            Saving...
                        </>
                    ) : (
                        <>
                            <span className="material-symbols-outlined">
                                save
                            </span>
                            Save Deadline
                        </>
                    )}
                </button>
                {deadlineValue && (
                    <button
                        onClick={clearDeadline}
                        className="px-6 py-4 rounded-xl font-black uppercase italic text-sm transition-all bg-slate-800 text-slate-400 hover:text-rose-400 hover:bg-slate-800/80 border-2 border-slate-700"
                    >
                        Clear
                    </button>
                )}
            </div>

            {deadlineValue && (
                <div className="mt-6 pt-6 border-t-2 border-slate-800">
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${isPastDeadline ? "text-lime-400" : "text-amber-400"}`}>
                            {isPastDeadline ? "check_circle" : "hourglass_empty"}
                        </span>
                        <span className="text-slate-400 font-semibold text-sm">
                            {isPastDeadline
                                ? `Deadline passed on ${deadlineDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`
                                : `Deadline set for ${deadlineDate.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric", hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStudentList = () => (
        <div className="space-y-6">
            {statusOrder.map((statusKey) => {
                const students = grouped[statusKey] || [];
                const cfg = STATUS_CONFIG[statusKey];
                if (students.length === 0) return null;

                const allSelected = students.every((s) => selectedIds.has(s));
                const someSelected = students.some((s) => selectedIds.has(s));

                return (
                    <div
                        key={statusKey}
                        className={`${cfg.bg} border-2 ${cfg.border} rounded-2xl overflow-hidden`}
                    >
                        <div className="flex items-center justify-between px-6 py-4 border-b-2 border-slate-700/50">
                            <div className="flex items-center gap-3">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => toggleGroup(students)}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                                />
                                <div className={`${cfg.color} w-3 h-3 rounded-full`} />
                                <span className="text-white font-black uppercase italic text-sm">
                                    {cfg.label}
                                </span>
                                <span className="text-slate-500 font-bold text-sm">
                                    ({students.length})
                                </span>
                            </div>
                        </div>

                        <div className="divide-y divide-slate-700/30">
                            {students.map((student) => (
                                <label
                                    key={student.id}
                                    className="flex items-center gap-4 px-6 py-3 hover:bg-slate-800/50 cursor-pointer transition-colors"
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(student.id)}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <span className="text-white font-bold truncate">
                                                {student.name}
                                            </span>
                                            {!student.parent_email && (
                                                <span className="text-xs text-rose-400 font-black uppercase shrink-0 border border-rose-500/50 px-2 py-0.5 rounded-full">
                                                    No Email
                                                </span>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mt-0.5">
                                            <span>Word Blast: {student.wordBlastAcc ?? 0}%</span>
                                            <span>Story Quest: {student.storyQuestAcc ?? 0}%</span>
                                        </div>
                                    </div>
                                    <div className="text-slate-600 shrink-0">
                                        <span className="material-symbols-outlined text-lg">
                                            {student.parent_email ? "mail" : "mail_off"}
                                        </span>
                                    </div>
                                </label>
                            ))}
                        </div>
                    </div>
                );
            })}

            {statusOrder.every((k) => (grouped[k] || []).length === 0) && (
                <div className="text-center py-20">
                    <span className="material-symbols-outlined text-6xl text-slate-700 mb-4">
                        group_off
                    </span>
                    <p className="text-slate-500 font-bold">No students found.</p>
                </div>
            )}
        </div>
    );

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Intelligence Export Hub
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Sector 7-G Data Extraction • Multi-Format Support
                </p>
            </div>

            {flash?.sent !== undefined && (
                <div className="mb-6 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className={`material-symbols-outlined ${flash.failed > 0 ? "text-amber-400" : "text-lime-400"}`}>
                        {flash.failed > 0 ? "warning" : "check_circle"}
                    </span>
                    <p className="text-white font-bold text-sm">
                        {flash.sent > 0
                            ? `${flash.sent} email(s) sent successfully.`
                            : "No emails were sent."}
                        {flash.failed > 0 && (
                            <span className="text-amber-400 ml-2">
                                {flash.failed} failed (no parent email on file).
                            </span>
                        )}
                    </p>
                </div>
            )}

            {flash?.deadline_set && (
                <div className="mb-6 bg-lime-500/10 border-2 border-lime-500 rounded-2xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-lime-400">
                        check_circle
                    </span>
                    <p className="text-white font-bold text-sm">
                        Report deadline has been saved.
                    </p>
                </div>
            )}

            {flash?.deadline_cleared && (
                <div className="mb-6 bg-slate-800 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-slate-400">
                        remove_circle
                    </span>
                    <p className="text-white font-bold text-sm">
                        Report deadline has been removed.
                    </p>
                </div>
            )}

            {renderDeadlineSetter()}

            {renderDeadlineBanner()}

            <div className="flex gap-1 bg-slate-900 border-2 border-slate-800 p-1.5 rounded-2xl mb-8 w-fit">
                <button
                    onClick={() => setTab("parents")}
                    className={`px-6 py-3 rounded-xl font-black uppercase italic text-sm transition-all ${
                        tab === "parents"
                            ? "bg-purple-500 text-slate-950 shadow-[4px_4px_0_0_#1e1b4b]"
                            : "text-slate-500 hover:text-white"
                    }`}
                >
                    Notify Parents
                </button>
                <button
                    onClick={() => setTab("export")}
                    className={`px-6 py-3 rounded-xl font-black uppercase italic text-sm transition-all ${
                        tab === "export"
                            ? "bg-purple-500 text-slate-950 shadow-[4px_4px_0_0_#1e1b4b]"
                            : "text-slate-500 hover:text-white"
                    }`}
                >
                    Export Reports
                </button>
            </div>

            {tab === "export" ? (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                        {reportTypes.map((type, index) => (
                            <button
                                key={index}
                                className="group text-left bg-slate-900 border-4 border-slate-800 p-8 rounded-3xl shadow-[8px_8px_0_0_#020617] hover:border-purple-500 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_0_#1e1b4b] transition-all"
                            >
                                <div
                                    className={`${type.color} w-16 h-16 rounded-2xl border-4 border-slate-950 flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#020617]`}
                                >
                                    <span className="material-symbols-outlined text-3xl text-slate-950 font-bold">
                                        {type.icon}
                                    </span>
                                </div>
                                <h3 className="text-xl font-black text-white uppercase italic mb-3">
                                    {type.title}
                                </h3>
                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    {type.desc}
                                </p>
                            </button>
                        ))}
                    </div>

                    <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                        <h2 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400">
                                tune
                            </span>
                            Extraction Parameters
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                            <div className="space-y-3">
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest block">
                                    Date Range
                                </label>
                                <select className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer">
                                    <option>Last 7 Days</option>
                                    <option>Last 30 Days</option>
                                    <option>Current Semester</option>
                                </select>
                            </div>
                            <div className="space-y-3">
                                <label className="text-slate-500 text-xs font-black uppercase tracking-widest block">
                                    Format
                                </label>
                                <select className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer">
                                    <option>Portable Document (PDF)</option>
                                    <option>Comma Separated (CSV)</option>
                                    <option>Data Object (JSON)</option>
                                </select>
                            </div>
                        </div>

                        <button className="w-full bg-lime-400 border-4 border-slate-950 p-6 rounded-2xl text-slate-950 font-black uppercase italic text-xl tracking-tighter shadow-[8px_8px_0_0_#3f6212] hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212] transition-all flex items-center justify-center gap-4 group">
                            <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">
                                download_for_offline
                            </span>
                            Initialize Extraction Sequence
                        </button>saveDeadline
                    </div>
                </>
            ) : (
                <div className="bg-slate-900 border-4 border-slate-800 p-8 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                    <div className="flex items-center justify-between mb-8">
                        <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3">
                            <span className="material-symbols-outlined text-purple-400">
                                mail
                            </span>
                            Notify Parents
                        </h2>
                        <span className="text-slate-500 text-sm font-bold">
                            {selectedIds.size} selected
                        </span>
                    </div>

                    {renderStudentList()}

                    <div className="mt-8 pt-6 border-t-2 border-slate-800">
                        <button
                            onClick={sendEmails}
                            disabled={selectedIds.size === 0 || sending}
                            className={`w-full p-5 rounded-2xl font-black uppercase italic text-xl tracking-tighter shadow-[8px_8px_0_0_#3f6212] transition-all flex items-center justify-center gap-4 ${
                                selectedIds.size === 0 || sending
                                    ? "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                                    : "bg-lime-400 border-4 border-slate-950 text-slate-950 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212]"
                            }`}
                        >
                            {sending ? (
                                <>
                                    <span className="material-symbols-outlined animate-spin">
                                        progress_activity
                                    </span>
                                    Sending...
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">
                                        send
                                    </span>
                                    Send Report to Selected Parents
                                </>
                            )}
                        </button>
                    </div>
                </div>
            )}
        </DashboardLayout>
    );
}
