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

const pad = (n) => String(n).padStart(2, '0');
const now = new Date();
const minDate = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}T${pad(now.getHours())}:${pad(now.getMinutes())}`;

const STATUS_CONFIG = {
    atRisk: { label: "At Risk", color: "bg-rose-500", border: "border-rose-500", text: "text-rose-400", bg: "bg-rose-500/10" },
    support: { label: "Needs Support", color: "bg-amber-500", border: "border-amber-500", text: "text-amber-400", bg: "bg-amber-500/10" },
    onTrack: { label: "On Track", color: "bg-lime-500", border: "border-lime-500", text: "text-lime-400", bg: "bg-lime-500/10" },
    notStarted: { label: "Not Started", color: "bg-slate-500", border: "border-slate-500", text: "text-slate-400", bg: "bg-slate-500/10" },
    in_progress: { label: "In Progress", color: "bg-sky-500", border: "border-sky-500", text: "text-sky-400", bg: "bg-sky-500/10" },
};

export default function Reports({ grouped, flash, deadline, errors }) {
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);
    const [deadlineValue, setDeadlineValue] = useState(deadline || "");
    const [savingDeadline, setSavingDeadline] = useState(false);

    const isPastDeadline = deadlineValue && new Date(deadlineValue) <= new Date();
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
                onSuccess: () => setSelectedIds(new Set()),
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

    const toggleEmailEditor = (studentId) => {
        setEmailEditId((prev) => (prev === studentId ? null : studentId));
        setEmailValue("");
    };

    const saveParentEmail = (studentId) => {
        if (!emailIsValid || savingEmail) return;
        setSavingEmail(true);
        router.put(
            route("teacher.reports.parentEmail", studentId),
            { parent_email: trimmedEmail },
            {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    setEmailEditId(null);
                    setEmailValue("");
                },
                onFinish: () => setSavingEmail(false),
            }
        );
    };

    const [statusTab, setStatusTab] = useState("");
    const [searchQuery, setSearchQuery] = useState("");
    const [showSent, setShowSent] = useState(false);
    const [emailEditId, setEmailEditId] = useState(null);
    const [emailValue, setEmailValue] = useState("");
    const [savingEmail, setSavingEmail] = useState(false);

    const EMAIL_RE = /^\S+@\S+\.\S+$/;
    const trimmedEmail = emailValue.trim();
    const emailIsValid = trimmedEmail !== "" && EMAIL_RE.test(trimmedEmail);
    const showEmailError =
        emailEditId !== null && trimmedEmail !== "" && !EMAIL_RE.test(trimmedEmail);

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
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none                             [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors?.deadline && (
                            <p className="text-rose-400 text-xs font-bold mt-2">
                                {errors.deadline}
                            </p>
                        )}
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

    const allStudentsFlat = Object.values(grouped).flat();
    const sentIds = new Set(allStudentsFlat.filter((s) => s.report_sent_at).map((s) => s.id));
    // Newest send first; "T" swap keeps Safari happy with Laravel's datetime format
    const sentStudents = allStudentsFlat
        .filter((s) => s.report_sent_at)
        .sort((a, b) => new Date(b.report_sent_at.replace(" ", "T")) - new Date(a.report_sent_at.replace(" ", "T")));

    const renderSentSection = () => {
        if (sentStudents.length === 0) return null;

        return (
            <div className="mb-6 bg-slate-900 border-2 border-slate-700 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setShowSent((prev) => !prev)}
                    className="w-full flex items-center justify-between px-6 py-4 transition-colors hover:bg-slate-800/50"
                >
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-slate-400 transition-transform ${showSent ? "rotate-90" : ""}`}>
                            chevron_right
                        </span>
                        <span className="text-white font-black uppercase italic text-sm">
                            Already Sent
                        </span>
                        <span className="text-slate-500 font-bold text-sm">
                            ({sentStudents.length})
                        </span>
                    </div>
                </button>

                {showSent && (
                    <div className="divide-y divide-slate-700/30 border-t border-slate-700/50">
                        {sentStudents.map((student) => (
                            <div
                                key={student.id}
                                className="flex items-center gap-4 px-6 py-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                        <span className="text-white font-bold truncate">
                                            {student.name}
                                        </span>
                                        <span className="text-xs text-lime-400 font-black uppercase shrink-0 border border-lime-500/50 px-2 py-0.5 rounded-full">
                                            Sent
                                        </span>
                                        {!student.parent_email && (
                                            <span className="text-xs text-rose-400 font-black uppercase shrink-0 border border-rose-500/50 px-2 py-0.5 rounded-full">
                                                No Email
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-slate-600 shrink-0">
                                    <span className="material-symbols-outlined text-lg">
                                        {student.parent_email ? "mail" : "mail_off"}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const renderStudentList = () => {

        return (
            <div className="space-y-6">
                {statusOrder.map((statusKey) => {
                    const students = (grouped[statusKey] || [])
                        .filter((s) => !sentIds.has(s.id))
                        .filter((s) => s.name.toLowerCase().includes(searchQuery.toLowerCase()));
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
                                    <div key={student.id}>
                                        <label
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
                                                        <button
                                                            type="button"
                                                            title="Add parent email"
                                                            onClick={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                toggleEmailEditor(student.id);
                                                            }}
                                                            className="text-xs text-rose-400 font-black uppercase shrink-0 border border-rose-500/50 px-2 py-0.5 rounded-full hover:bg-rose-500/20 transition-colors cursor-pointer"
                                                        >
                                                            No Email
                                                        </button>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-4 text-xs text-slate-500 font-semibold mt-0.5">
                                                    <span>Word Blast: {student.wordBlastAcc ?? 0}%</span>
                                                    <span>Story Quest: {student.storyQuestAcc ?? 0}%</span>
                                                    <span className="text-amber-400">Final Avg: {student.finalAverage != null ? `${student.finalAverage}%` : 'N/A'}</span>
                                                </div>
                                            </div>
                                            <button
                                                type="button"
                                                title={student.parent_email ? "" : "Add parent email"}
                                                onClick={(e) => {
                                                    if (student.parent_email) return;
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    toggleEmailEditor(student.id);
                                                }}
                                                className={`shrink-0 ${
                                                    student.parent_email
                                                        ? "text-slate-600 cursor-default"
                                                        : "text-slate-400 hover:text-lime-400 cursor-pointer transition-colors"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {student.parent_email ? "mail" : "mail_off"}
                                                </span>
                                            </button>
                                        </label>

                                        {emailEditId === student.id && (
                                            <div className="pl-[3.75rem] pr-6 pb-4 flex items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-lime-400 pointer-events-none">
                                                            mail
                                                        </span>
                                                        <input
                                                            type="email"
                                                            autoFocus
                                                            value={emailValue}
                                                            onChange={(e) => setEmailValue(e.target.value)}
                                                            onKeyDown={(e) => {
                                                                if (e.key === "Enter") saveParentEmail(student.id);
                                                            }}
                                                            placeholder="parent@email.com"
                                                            className={`w-full bg-slate-950 border-2 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold text-sm focus:outline-none transition-all ${
                                                                showEmailError || errors?.parent_email
                                                                    ? "border-rose-500"
                                                                    : "border-slate-800 focus:border-lime-500"
                                                            }`}
                                                        />
                                                    </div>
                                                    {(showEmailError || errors?.parent_email) && (
                                                        <p className="text-rose-400 text-xs font-bold mt-1.5">
                                                            {showEmailError
                                                                ? "Invalid email format."
                                                                : errors.parent_email}
                                                        </p>
                                                    )}
                                                </div>
                                                <button
                                                    type="button"
                                                    onClick={() => saveParentEmail(student.id)}
                                                    disabled={!emailIsValid || savingEmail}
                                                    className={`px-5 py-2.5 rounded-xl font-black uppercase italic text-sm transition-all shrink-0 ${
                                                        emailIsValid && !savingEmail
                                                            ? "bg-lime-400 border-2 border-slate-950 text-slate-950 shadow-[3px_3px_0_0_#3f6212] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                                            : "bg-slate-800 text-slate-600 cursor-not-allowed shadow-none"
                                                    }`}
                                                >
                                                    {savingEmail ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEmailEditor(student.id)}
                                                    className="px-4 py-2.5 rounded-xl font-black uppercase italic text-sm bg-slate-800 text-slate-400 border-2 border-slate-700 hover:text-white transition-all shrink-0"
                                                >
                                                    Cancel
                                                </button>
                                            </div>
                                        )}
                                    </div>
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
    };

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

            {isDeadlineSaved && isPastDeadline && (
                <div className="mb-8 flex gap-4">
                    <a
                        href={route("teacher.reports.export")}
                        className="px-8 py-4 rounded-xl font-black uppercase italic text-sm transition-all flex items-center gap-2 bg-lime-400 border-4 border-slate-950 text-slate-950 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212]"
                    >
                        <span className="material-symbols-outlined text-lg">
                            download
                        </span>
                        Export to Excel
                    </a>
                </div>
            )}

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

                    {renderSentSection()}

                    {renderStudentList()}
                </div>
        </DashboardLayout>
    );
}
