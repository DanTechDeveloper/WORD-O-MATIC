import { Head, usePage, Link, router } from "@inertiajs/react";
import { useState, useRef } from "react";
import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import ConfirmDeleteModal from "@/Components/Teacher/ConfirmDeleteModal";

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
    atRisk: { label: "At Risk", color: "bg-error", border: "border-error", text: "text-error", bg: "bg-error/10" },
    support: { label: "Needs Support", color: "bg-tertiary", border: "border-tertiary", text: "text-tertiary", bg: "bg-tertiary/10" },
    onTrack: { label: "On Track", color: "bg-accent", border: "border-accent", text: "text-accent", bg: "bg-accent/10" },
    notStarted: { label: "Not Started", color: "bg-outline", border: "border-outline", text: "text-on-surface-variant", bg: "bg-outline/10" },
    in_progress: { label: "In Progress", color: "bg-quest", border: "border-quest", text: "text-quest", bg: "bg-quest/10" },
};

export default function Reports({ grouped, flash, deadline, errors }) {
    const { teacher } = usePage().props;
    const hasTeacherEmail = !!teacher?.has_email;
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [sending, setSending] = useState(false);
    const sendingRef = useRef(false);
    const [deadlineValue, setDeadlineValue] = useState(deadline || "");
    const [savingDeadline, setSavingDeadline] = useState(false);

    const [confirmClearOpen, setConfirmClearOpen] = useState(false);
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

    const clearDeadline = () => setConfirmClearOpen(true);
    const confirmClearDeadline = () => {
        setConfirmClearOpen(false);
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
        <div className="bg-surface-container border-2 border-outline/20 p-4 sm:p-6 rounded-xl mb-8">
            <h2 className="text-lg sm:text-xl font-black text-on-surface uppercase tracking-tight mb-4 flex items-center gap-2 sm:gap-3">
                <span className="material-symbols-outlined text-primary text-xl sm:text-2xl" aria-hidden="true">
                    event
                </span>
                Report Deadline
            </h2>
            <p className="text-on-surface-variant text-xs sm:text-sm mb-6">
                Set a deadline for this reporting period. Once the deadline passes, generate and send reports with the final data.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-end gap-4">
                <div className="flex-1 space-y-3">
                    <label className="text-on-surface-variant text-[10px] sm:text-xs font-black uppercase tracking-widest block">
                        Deadline Date & Time
                    </label>
                    <div className="relative">
                        <input
                            type="datetime-local"
                            value={deadlineValue ? deadlineValue.slice(0, 16) : ""}
                            min={minDate}
                            disabled={isDeadlineSaved}
                            onChange={(e) => setDeadlineValue(e.target.value)}
                            className="w-full bg-surface-container-lowest border-2 border-outline/30 rounded-lg p-3 sm:p-4 text-on-surface font-bold text-sm sm:text-base focus:border-accent transition-colors outline-none [color-scheme:dark] disabled:opacity-50 disabled:cursor-not-allowed"
                        />
                        {errors?.deadline && (
                            <p className="text-error text-xs font-bold mt-2">
                                {errors.deadline}
                            </p>
                        )}
                        <span className="material-symbols-outlined absolute right-4 top-1/2 -translate-y-1/2 text-primary pointer-events-none" aria-hidden="true">
                            calendar_month
                        </span>
                    </div>
                </div>
                <button
                    onClick={saveDeadline}
                    disabled={!deadlineValue || savingDeadline || isDeadlineSaved}
                    className={`px-5 sm:px-6 py-2.5 sm:py-3 rounded-xl font-black uppercase italic text-xs sm:text-sm transition-colors flex items-center gap-2 shrink-0 ${
                        deadlineValue && !savingDeadline && !isDeadlineSaved
                            ? "bg-accent text-background border-b-4 border-accent-deep hover:bg-accent-hover"
                            : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
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
                        className="px-5 py-2.5 sm:py-3 rounded-xl font-black uppercase italic text-xs sm:text-sm transition-colors bg-surface-container-high text-on-surface-variant border-2 border-outline/20 hover:text-error shrink-0"
                    >
                        Clear
                    </button>
                )}
            </div>

            {deadlineValue && (
                <div className="mt-6 pt-6 border-t-2 border-outline/20">
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined ${isPastDeadline ? "text-accent" : "text-tertiary"}`} aria-hidden="true">
                            {isPastDeadline ? "check_circle" : "hourglass_empty"}
                        </span>
                        <span className="text-on-surface-variant font-semibold text-sm">
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
            <div className="mb-6 bg-surface-container border-2 border-outline/20 rounded-2xl overflow-hidden">
                <button
                    onClick={() => setShowSent((prev) => !prev)}
                    className="w-full flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 transition-colors hover:bg-surface-container-high/50"
                >
                    <div className="flex items-center gap-3">
                        <span className={`material-symbols-outlined text-on-surface-variant transition-transform ${showSent ? "rotate-90" : ""}`}>
                            chevron_right
                        </span>
                        <span className="text-white font-black uppercase italic text-sm">
                            Already Sent
                        </span>
                        <span className="text-on-surface-variant font-bold text-sm">
                            ({sentStudents.length})
                        </span>
                    </div>
                </button>

                {showSent && (
                    <div className="divide-y divide-outline/20 border-t border-outline/20/50">
                        {sentStudents.map((student) => (
                                <div
                                    key={student.id}
                                    className="flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-3"
                            >
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                        <span className="text-white font-bold whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block text-sm sm:text-base" title={student.name}>
                                            {student.name}
                                        </span>
                                        <span className="text-xs text-accent font-black uppercase shrink-0 border border-accent/50 px-2 py-0.5 rounded-full">
                                            Sent
                                        </span>
                                        {!student.parent_email && (
                                            <span className="text-xs text-rose-400 font-black uppercase shrink-0 border border-rose-500/50 px-2 py-0.5 rounded-full">
                                                No Email
                                            </span>
                                        )}
                                    </div>
                                </div>
                                <div className="text-on-surface-variant/50 shrink-0">
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
                            <div className="flex items-center justify-between px-3 sm:px-4 md:px-6 py-3 sm:py-4 border-b-2 border-outline/20/50 gap-2">
                                <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                                    <input
                                        type="checkbox"
                                        checked={allSelected}
                                        disabled={!isPastDeadline}
                                        ref={(el) => {
                                            if (el) el.indeterminate = someSelected && !allSelected;
                                        }}
                                        onChange={() => toggleGroup(students)}
                                        className="w-5 h-5 rounded border-slate-600 bg-surface-container-high text-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                    />
                                    <div className={`${cfg.color} w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full shrink-0`} />
                                    <span className="text-white font-black uppercase italic text-xs sm:text-sm whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block min-w-0" title={cfg.label}>
                                        {cfg.label}
                                    </span>
                                    <span className="text-on-surface-variant font-bold text-xs sm:text-sm shrink-0">
                                        ({students.length})
                                    </span>
                                </div>
                            </div>

                            <div className="divide-y divide-outline/20">
                                {students.map((student) => (
                                    <div key={student.id}>
                                        <label
                                            className={`flex items-center gap-2 sm:gap-3 md:gap-4 px-3 sm:px-4 md:px-6 py-3 flex-wrap transition-colors ${
                                                isPastDeadline ? "hover:bg-surface-container-high/50 cursor-pointer" : "cursor-default"
                                            }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedIds.has(student.id)}
                                                disabled={!isPastDeadline}
                                                onChange={() => toggleStudent(student.id)}
                                                className="w-5 h-5 rounded border-slate-600 bg-surface-container-high text-purple-500 focus:ring-purple-500 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-1.5 sm:gap-2 flex-wrap">
                                                    <span className="text-white font-bold whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block text-sm sm:text-base" title={student.name}>
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
                                                <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:gap-3 md:gap-4 flex-wrap text-[11px] sm:text-xs text-on-surface-variant font-semibold mt-0.5">
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
                                                        ? "text-on-surface-variant/50 cursor-default"
                                                        : "text-on-surface-variant hover:text-accent cursor-pointer transition-colors"
                                                }`}
                                            >
                                                <span className="material-symbols-outlined text-lg">
                                                    {student.parent_email ? "mail" : "mail_off"}
                                                </span>
                                            </button>
                                        </label>

                                        {emailEditId === student.id && (
                                            <div className="pl-4 sm:pl-[3.75rem] pr-4 sm:pr-6 pb-4 flex flex-col sm:flex-row items-stretch sm:items-start gap-3">
                                                <div className="flex-1 min-w-0">
                                                    <div className="relative">
                                                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-accent pointer-events-none">
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
                                                            className={`w-full bg-surface-container-lowest border-2 rounded-xl pl-10 pr-4 py-2.5 text-white font-bold text-sm focus:outline-none transition-all ${
                                                                showEmailError || errors?.parent_email
                                                                    ? "border-rose-500"
                                                                    : "border-outline/20 focus:border-accent"
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
                                                            ? "bg-accent border-2 border-slate-950 text-slate-950 shadow-[3px_3px_0_0_#3f6212] hover:translate-x-[-1px] hover:translate-y-[-1px]"
                                                            : "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed shadow-none"
                                                    }`}
                                                >
                                                    {savingEmail ? "Saving..." : "Save"}
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => toggleEmailEditor(student.id)}
                                                    className="px-4 py-2.5 rounded-xl font-black uppercase italic text-sm bg-surface-container-high text-on-surface-variant border-2 border-outline/20 hover:text-white transition-all shrink-0"
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
                        <p className="text-on-surface-variant font-bold">No students found.</p>
                    </div>
                )}
            </div>
        );
    };

    return (
        <DashboardLayout>
            <Head title="Reports — Word-O-Matic">
                <meta name="description" content="Reports and parent notifications on Word-O-Matic." />
            </Head>
            <div className="mb-6 lg:mb-10">
                <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Reports
                </h1>
                <p className="text-on-surface-variant font-black uppercase text-xs tracking-widest">
                    Monitor progress and send parent reports
                </p>
            </div>

            {flash?.sent !== undefined && (
                <div className="mb-6 bg-surface-container border-2 border-outline/20 rounded-2xl p-4 flex items-center gap-3">
                    <span className={`material-symbols-outlined ${flash.failed > 0 ? "text-amber-400" : "text-accent"}`}>
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

            {flash?.error && (
                <div className="mb-6 bg-rose-500/10 border-2 border-rose-500 rounded-2xl p-4 flex items-center gap-3">
                    <span className="material-symbols-outlined text-rose-400">error</span>
                    <p className="text-white font-bold text-sm">{flash.error}</p>
                </div>
            )}

            {renderDeadlineSetter()}

            {isDeadlineSaved && isPastDeadline && (
                <div className="mb-8">
                    <div className="flex gap-4">
                        <a
                            href={route("teacher.reports.export")}
                            target="_blank"
                            rel="noopener"
                            title={hasTeacherEmail ? "Download class report" : "Export works without sender email only Send needs email"}
                            className="px-8 py-4 rounded-xl font-black uppercase italic text-sm transition-all flex items-center gap-2 bg-accent border-4 border-slate-950 text-slate-950 hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212]"
                        >
                            <span className="material-symbols-outlined text-lg">
                                download
                            </span>
                            Export to Excel
                        </a>
                    </div>
                    {!hasTeacherEmail && (
                        <p className="text-on-surface-variant/60 text-xs font-bold mt-2">
                            Export works without sender email only <span className="text-white">Send Reports</span> needs it. <Link href="/teacher/settings" className="underline text-accent hover:text-accent-hover">Set email in Settings</Link> for replies.
                        </p>
                    )}
                </div>
            )}

            <div className="bg-surface-container border-2 border-outline/20 p-4 sm:p-6 rounded-xl">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
                        <h2 className="text-xl font-black text-on-surface uppercase tracking-tight flex items-center gap-3">
                            <span className="material-symbols-outlined text-primary" aria-hidden="true">
                                mail
                            </span>
                            Notify Parents
                        </h2>
                        <span className="text-on-surface-variant text-sm font-bold">
                            {selectedIds.size} selected
                        </span>
                    </div>

                    <div className="relative mb-4">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-accent" aria-hidden="true">
                            search
                        </span>
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-surface-container-lowest border-2 border-outline/30 rounded-lg pl-12 pr-4 py-3 text-on-surface font-bold focus:outline-none focus:border-accent transition-colors text-sm"
                            placeholder="Search student by name..."
                            type="text"
                        />
                    </div>

                    <div className="flex items-center bg-surface-container border-2 border-outline/20 p-1 rounded-xl mb-6 overflow-x-auto">
                        {statusTabs.map((tab) => (
                            <button
                                key={tab.value}
                                onClick={() => setStatusTab(tab.value)}
                                className={`px-3 sm:px-4 py-2 font-black text-xs sm:text-sm whitespace-nowrap rounded-lg transition-colors ${
                                    statusTab === tab.value
                                        ? "bg-accent text-background"
                                        : "text-on-surface-variant hover:text-accent"
                                }`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {!hasTeacherEmail && (
                        <div className="mb-4 bg-amber-500/10 border-2 border-amber-500 rounded-xl p-3 flex items-start gap-2">
                            <span className="material-symbols-outlined text-amber-500 text-lg" aria-hidden="true">mail</span>
                            <p className="text-amber-400 text-xs font-bold leading-snug">Set sender email in <Link href="/teacher/settings" className="underline text-white">Settings</Link> so parents can reply to you{isPastDeadline ? " — sending is blocked until set" : ""}.</p>
                        </div>
                    )}
                    <div className="mb-6">
                        <button
                            onClick={sendEmails}
                            disabled={selectedIds.size === 0 || sending || !isPastDeadline || (isPastDeadline && !hasTeacherEmail)}
                            className={`w-full p-4 rounded-xl font-black uppercase italic text-lg tracking-tight transition-colors flex items-center justify-center gap-3 ${
                                selectedIds.size === 0 || sending || !isPastDeadline || (isPastDeadline && !hasTeacherEmail)
                                    ? "bg-surface-container-high text-on-surface-variant/50 cursor-not-allowed"
                                    : "bg-accent text-background border-b-4 border-accent-deep hover:bg-accent-hover"
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
            <ConfirmDeleteModal
                isOpen={confirmClearOpen}
                onClose={() => setConfirmClearOpen(false)}
                onConfirm={confirmClearDeadline}
                title="Clear Deadline?"
                message={
                    <p>
                        Clear the deadline? <span className="text-accent">Already Sent</span> students will move back to the selectable list for the next period. This cannot be undone.
                    </p>
                }
                confirmText="Clear Deadline"
                confirmIcon="event_busy"
                variant="neutral"
            />
        </DashboardLayout>
    );
}
