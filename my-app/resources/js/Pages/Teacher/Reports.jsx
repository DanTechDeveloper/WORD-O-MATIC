import { useState, useRef } from "react";
import { router } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

const formatDate = (date) =>
    date?.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });

const now = new Date();
const minDate = now.toISOString().slice(0, 16);

const STATUS_CONFIG = {
    atRisk: { label: "At Risk", color: "bg-rose-500", border: "border-rose-500", text: "text-rose-400", bg: "bg-rose-500/10" },
    support: { label: "Needs Support", color: "bg-amber-500", border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
    onTrack: { label: "On Track", color: "bg-lime-500", border: "border-lime-500", text: "text-lime-400", bg: "bg-lime-500/10" },
    notStarted: { label: "Not Started", color: "bg-slate-500", border: "border-slate-500", text: "text-slate-400", bg: "bg-slate-500/10" },
    in_progress: { label: "In Progress", color: "bg-sky-500", border: "border-sky-500", text: "text-sky-400", bg: "bg-sky-500/10" },
};

export default function Reports({ grouped, flash, deadline }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);
    const [deadlineValue, setDeadlineValue] = useState(deadline || "");
    const [savingDeadline, setSavingDeadline] = useState(false);

    const isPastDeadline = deadlineValue && new Date(deadlineValue) < new Date();
    const isDeadlineSet = !!deadlineValue;
    const isDeadlineSaved = !!deadline;
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
        if (selectedIds.size === 0 || sendingRef.current) return;
        sendingRef.current = true;
        setSending(true);
        router.post(
            route("teacher.reports.sendEmails"),
            { student_ids: Array.from(selectedIds) },
            {
                preserveScroll: true,
                preserveState: true,
                onFinish: () => {
                    setSending(false);
                    sendingRef.current = false;
                },
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

    const [statusTab, setStatusTab] = useState("");
    const [searchQuery, setSearchQuery] = useState("");

    const statusTabs = [
        { value: "", label: "All" },
        { value: "atRisk", label: "At Risk" },
        { value: "support", label: "Needs Support" },
        { value: "onTrack", label: "On Track" },
        { value: "in_progress", label: "In Progress" },
        { value: "notStarted", label: "Not Started" },
    ];

    const statusOrder = statusTab
        ? [statusTab]
        : ["atRisk", "support", "onTrack", "in_progress", "notStarted"];

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
                            All report actions are now available. Deadline was set to {formatDate(deadlineDate)}.
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
                            Reports are set to be generated after {formatDate(deadlineDate)}. You may still proceed, but data may not be final.
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
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={deadlineValue ? deadlineValue.slice(0, 16) : ""}
                            min={minDate}
                            disabled={isDeadlineSaved}
                            onChange={(e) => setDeadlineValue(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-purple-400 pointer-events-none">
                            calendar_month
                        </span>
                    </div>
                </div>
                <button
                    onClick={saveDeadline}
                    disabled={!deadlineValue || savingDeadline || isDeadlineSaved}
                    className={`px-8 py-4 rounded-xl font-black uppercase italic text-sm transition-all flex items-center gap-2 ${
                        deadlineValue && !savingDeadline && !isDeadlineSaved
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
                    ) : isDeadlineSaved ? (
                        <>
                            <span className="material-symbols-outlined">
                                check
                            </span>
                            Deadline Set
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
                                ? `Deadline passed on ${formatDate(deadlineDate)}`
                                : `Deadline set for ${formatDate(deadlineDate)}`}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );

    const renderStudentList = () => (
        <div className="space-y-6">
            {statusOrder.map((statusKey) => {
                const students = (grouped[statusKey] || []).filter((s) =>
                    s.name.toLowerCase().includes(searchQuery.toLowerCase())
                );
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
                                    disabled={!isPastDeadline}
                                    ref={(el) => {
                                        if (el) el.indeterminate = someSelected && !allSelected;
                                    }}
                                    onChange={() => toggleGroup(students)}
                                    className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                                    className={`flex items-center gap-4 px-6 py-3 transition-colors ${
                                        isPastDeadline ? "hover:bg-slate-800/50 cursor-pointer" : "cursor-default"
                                    }`}
                                >
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(student.id)}
                                        disabled={!isPastDeadline}
                                        onChange={() => toggleStudent(student.id)}
                                        className="w-5 h-5 rounded border-slate-600 bg-slate-800 text-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Reports
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Monitor progress and send parent reports
                </p>
            </div>

            {flash?.sent !== undefined && (
                <div className="mb-6 bg-slate-900 border-2 border-slate-700 rounded-2xl p-4 flex items-center gap-3">
                    <span className={`material-symbols-outlined ${flash.failed > 0 ? "text-amber-400" : "text-lime-400"}`}>
                        {flash.failed > 0 ? "warning" : "check_circle"}
                    </span>
                    <p className="text-white font-bold text-sm">
                        {flash.sent > 0
                            ? `${flash.sent} email(s) sent successfully — As of ${flash.reported_at}.`
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

                    <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lime-400">
                            search
                        </span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white font-bold focus:outline-none focus:border-lime-500 transition-all text-sm"
                            placeholder="Search student by name..."
                            type="text"
                        />
                    </div>

                    <div className="flex items-center bg-slate-950 border-2 border-slate-800 p-1 rounded-xl mb-6 overflow-x-auto">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusTab(tab.value)}
                                className={`px-4 py-2 font-black text-xs whitespace-nowrap rounded-lg transition-all ${
                                    statusTab === tab.value
                                        ? "bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                        : "text-slate-400 hover:text-lime-300"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <button
                            onClick={sendEmails}
                            disabled={selectedIds.size === 0 || sending || !isPastDeadline}
                            className={`w-full p-5 rounded-2xl font-black uppercase italic text-xl tracking-tighter shadow-[8px_8px_0_0_#3f6212] transition-all flex items-center justify-center gap-4 ${
                                selectedIds.size === 0 || sending || !isPastDeadline
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
                            ) : !isPastDeadline && isDeadlineSet ? (
                                <>
                                    <span className="material-symbols-outlined">
                                        lock
                                    </span>
                                    Unlocks {formatDate(deadlineDate)}
                                </>
                            ) : !isDeadlineSet ? (
                                <>
                                    <span className="material-symbols-outlined">
                                        lock
                                    </span>
                                    Set a deadline above first
                                </>
                            ) : (
                                <>
                                    <span className="material-symbols-outlined">
                                        send
                                    </span>
                                    Send Report — As of {formatDate(deadlineDate)}
                                </>
                            )}
                        </button>
                        {!isPastDeadline && isDeadlineSet && (
                            <p className="text-amber-400/70 text-xs font-bold text-center mt-4">
                                Button will unlock on {formatDate(deadlineDate)}
                            </p>
                        )}
                        {!isDeadlineSet && (
                            <p className="text-amber-400/70 text-xs font-bold text-center mt-4">
                                Set a report deadline above to enable sending
                            </p>
                        )}
                    </div>

                    {renderStudentList()}
                </div>
        </DashboardLayout>
    );
}
