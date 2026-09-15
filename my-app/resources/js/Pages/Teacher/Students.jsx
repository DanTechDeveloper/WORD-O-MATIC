import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Head, Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import AddStudentModal from "@/Components/Teacher/AddStudentModal";
import EditStudentModal from "@/Components/Teacher/EditStudentModal";
import ConfirmDeleteModal from "@/Components/Teacher/ConfirmDeleteModal";

const sortOptions = [
    { value: "risk", label: "Risk Level" },
    { value: "finalAverage", label: "Final Average" },
    { value: "name", label: "Name (A-Z)" },
    { value: "level", label: "Level (Lowest First)" },
];

const statusTabs = [
    { value: "", label: "All" },
    { value: "atRisk", label: "At Risk" },
    { value: "support", label: "Needs Support" },
    { value: "onTrack", label: "On Track" },
    { value: "in_progress", label: "In Progress" },
    { value: "no_email", label: "No Email" },
    { value: "notStarted", label: "Not Started" },
];

export default function Students({ data, sections, filters, existingStudentIds }) {
    const students = data.data ?? [];
    const meta = {
        current_page: data.current_page ?? 1,
        last_page: data.last_page ?? 1,
        from: data.from,
        to: data.to,
        total: data.total,
    };

    const existingIds = new Set(
        (existingStudentIds || []).map((id) => String(id).trim().toLowerCase()),
    );

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [confirmStudent, setConfirmStudent] = useState(null);
    const [statusTab, setStatusTab] = useState(filters.status ?? "");
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    function navigate(params) {
        router.get(
            "/teacher/students",
            {
                ...filters,
                ...params,
                page: params.page ?? 1,
            },
            {
                preserveState: true,
                preserveScroll: true,
            },
        );
    }

    function handleSearch(e) {
        clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => {
            navigate({ search: e.target.value, page: 1 });
        }, 300);
    }

    function handleSort(e) {
        navigate({ sort: e.target.value, page: 1 });
    }

    function handleSection(e) {
        navigate({ section: e.target.value, page: 1 });
    }

    function handleStatusTab(value) {
        setStatusTab(value);
        navigate({ status: value, page: 1 });
    }

    function goToPage(page) {
        if (page < 1 || page > meta.last_page) return;
        navigate({ page });
    }

    function pageRange() {
        const last = meta.last_page ?? 1;
        const current = meta.current_page ?? 1;
        const range = [];
        const start = Math.max(1, current - 1);
        const end = Math.min(last, current + 1);
        for (let i = start; i <= end; i++) range.push(i);
        return range;
    }

    const computeRisk = (acc) => {
        if (acc === null || acc === 0) return "na";
        if (acc < 60) return "high";
        if (acc < 80) return "moderate";
        return "low";
    };

    const riskStyles = {
        high: {
            dot: "bg-error shadow-[0_0_8px_#ffb4ab]",
            text: "text-error",
        },
        moderate: {
            dot: "bg-tertiary shadow-[0_0_8px_#ffb77f]",
            text: "text-tertiary",
        },
        low: {
            dot: "bg-green-400 shadow-[0_0_8px_#4ade80]",
            text: "text-green-400",
        },
        na: {
            dot: "bg-slate-500 shadow-[0_0_8px_#64748b]",
            text: "text-on-surface-variant",
        },
    };

    const statusStyles = {
        atRisk: "bg-error-container text-on-error-container border-error",
        onTrack: "bg-green-900/50 text-green-400 border-green-500",
        support:
            "bg-tertiary-container text-on-tertiary-container border-tertiary",
        notStarted: "bg-surface-container-high/50 text-on-surface-variant border-outline/20",
        in_progress: "bg-sky-900/50 text-sky-400 border-sky-500",
    };

    return (
        <>
            <Head title="Students — Word-O-Matic">
                <meta name="description" content="Students list and progress on Word-O-Matic." />
            </Head>
            <DashboardLayout>
                <div className="mb-6 lg:mb-10 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                            Students
                        </h1>
                        <p className="text-on-surface-variant font-black uppercase text-xs tracking-widest">
                            Monitoring {meta.total ?? 0} word-warriors
                        </p>
                    </div>
                    <div className="flex flex-col gap-3 lg:gap-4 lg:flex-row lg:items-center">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="w-full sm:w-auto bg-accent text-background px-4 sm:px-6 py-3 rounded-xl border-b-[4px] border-accent-deep font-black uppercase italic text-sm tracking-tighter hover:bg-accent-hover transition-colors flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">
                                add_circle
                            </span>
                            Add Student
                        </button>
                        <div className="flex items-center flex-1 min-w-0 max-w-full bg-surface-container border-2 border-outline/20 rounded-xl p-1 overflow-x-auto">
                            {statusTabs.map((tab) => (
                                <button
                                    key={tab.value}
                                    onClick={() => handleStatusTab(tab.value)}
                                    className={`px-3 sm:px-4 py-2 font-black text-xs sm:text-sm whitespace-nowrap rounded-lg transition-colors ${
                                        statusTab === tab.value
                                            ? "bg-accent text-background border-b-2 border-accent-deep"
                                            : "text-on-surface-variant hover:text-accent"
                                    }`}
                                >
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container border-2 border-outline/20 rounded-xl p-4 lg:p-5 mb-6 lg:mb-8 flex flex-col lg:flex-row flex-wrap gap-4 items-stretch lg:items-center">
                    <div className="flex-1 min-w-0 sm:min-w-[280px] lg:min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-accent">
                            search
                        </span>
                        <input
                            ref={searchRef}
                            defaultValue={filters.search ?? ""}
                            onChange={handleSearch}
                            className="w-full bg-surface-container-lowest border-2 border-outline/30 rounded-lg pl-12 pr-4 py-3 text-on-surface font-bold focus:outline-none focus:border-accent transition-colors text-sm"
                            placeholder="Locate student by name or ID..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[140px] sm:flex-none">
                            <select
                                value={filters.sort ?? "risk"}
                                onChange={handleSort}
                                className="w-full appearance-none bg-surface-container-lowest border-2 border-outline/20 rounded-xl pl-4 pr-10 py-3 lg:py-4 text-white font-bold focus:outline-none focus:border-accent cursor-pointer text-sm lg:text-base"
                            >
                                {sortOptions.map((opt) => (
                                    <option key={opt.value} value={opt.value}>
                                        Sort by: {opt.label}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-accent">
                                expand_more
                            </span>
                        </div>
                        <div className="relative flex-1 min-w-[140px] sm:flex-none">
                            <select
                                value={filters.section ?? ""}
                                onChange={handleSection}
                                className="w-full appearance-none bg-surface-container-lowest border-2 border-outline/20 rounded-xl pl-4 pr-10 py-3 lg:py-4 text-white font-bold focus:outline-none focus:border-accent cursor-pointer transition-all text-sm lg:text-base"
                            >
                                <option value="">All Sections</option>
                                {sections.map((sectionName) => (
                                    <option
                                        key={sectionName}
                                        value={sectionName}
                                    >
                                        {sectionName}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-accent">
                                expand_more
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-surface-container rounded-2xl lg:rounded-xl border-4 border-outline/20 overflow-hidden ">
                    <div className="block lg:hidden divide-y-2 divide-outline/20">
                        {students.map((student, index) => {
                            const wAcc = student.wordBlastAcc;
                            const pAcc = student.storyQuestAcc;
                            const fAcc = student.finalAverage;
                            const wRisk = riskStyles[computeRisk(wAcc)];
                            const pRisk = riskStyles[computeRisk(pAcc)];
                            const fRisk = riskStyles[computeRisk(fAcc)];
                            const sStyle =
                                statusStyles[student.status?.type] ||
                                statusStyles.notStarted;

                            return (
                                <div
                                    key={student.id ?? index}
                                    className="p-4 sm:p-5 flex flex-col gap-3"
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-surface-container-lowest border-2 border-accent overflow-hidden shrink-0 ${student.rotation} shadow-[3px_3px_0px_0px_#3f6212]`}
                                        >
                                            <img
                                                alt={student.fullName}
                                                src={student.avatar}
                                                className="w-full h-full object-cover"
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="font-headline-md text-sm sm:text-base text-white whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block min-w-0" title={student.fullName}>
                                                {student.fullName}
                                            </div>
                                            <div className="text-xs text-on-surface-variant font-label-bold">
                                                ID: {student.studentID}
                                            </div>
                                        </div>
                                        <span
                                            className={`${sStyle} px-2 sm:px-3 py-1 rounded-full border-2 text-xs sm:text-xs font-black uppercase shrink-0`}
                                        >
                                            {student.status?.label ||
                                                "Not Started"}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full ${wRisk.dot}`}
                                            ></div>
                                            <span className="text-xs text-on-surface-variant font-label-bold uppercase">
                                                Word Blast:
                                            </span>
                                            <span
                                                className={`font-label-bold text-xs ${wRisk.text} uppercase`}
                                            >
                                                {wAcc == null
                                                    ? "N/A"
                                                    : wAcc + "%"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div
                                                className={`w-2.5 h-2.5 rounded-full ${pRisk.dot}`}
                                            ></div>
                                            <span className="text-xs text-on-surface-variant font-label-bold uppercase">
                                                Story Quest:
                                            </span>
                                            <span
                                                className={`font-label-bold text-xs ${pRisk.text} uppercase`}
                                            >
                                                {pAcc == null
                                                    ? "N/A"
                                                    : pAcc + "%"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${fRisk.dot}`}></div>
                                            <span className="text-xs text-on-surface-variant font-label-bold uppercase">
                                                Final Avg:
                                            </span>
                                            <span className={`font-label-bold text-xs ${fRisk.text} uppercase`}>
                                                {fAcc == null ? "N/A" : fAcc + "%"}
                                            </span>
                                        </div>
                                        <div className="ml-auto flex gap-2">
                                            <Link
                                                href={`/teacher/studentDetails/${student.id}`}
                                                className="bg-accent text-slate-950 px-4 py-2 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#3f6212] transition-all"
                                            >
                                                View
                                            </Link>
                                            <button
                                                onClick={() =>
                                                    setEditStudent(student)
                                                }
                                                className="bg-purple-500 text-white px-4 py-2 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0_0_#4c1d95] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#4c1d95] transition-all"
                                            >
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => setConfirmStudent(student)}
                                                className="bg-rose-600 text-white px-4 py-2 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0_0_#7f1d1d] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#7f1d1d] transition-all"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {students.length === 0 && (
                            <div className="p-8 text-center text-on-surface-variant font-black uppercase text-sm">
                                No students found
                            </div>
                        )}
                    </div>

                    <table className="hidden lg:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-surface-container border-b-4 border-outline/20">
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-accent">
                                    Name
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-accent">
                                    Word Blast
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-accent">
                                    Story Quest
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-amber-400">
                                    Final Avg
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-accent">
                                    Final Status
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-accent">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-outline/20">
                            {students.map((student, index) => {
                                const wAcc = student.wordBlastAcc;
                                const pAcc = student.storyQuestAcc;
                                const fAcc = student.finalAverage;
                                const wRisk = riskStyles[computeRisk(wAcc)];
                                const pRisk = riskStyles[computeRisk(pAcc)];
                                const fRisk = riskStyles[computeRisk(fAcc)];
                                const sStyle =
                                    statusStyles[student.status?.type] ||
                                    statusStyles.notStarted;

                                return (
                                    <tr
                                        key={student.id ?? index}
                                        className="hover:bg-surface-container/50 transition-colors group"
                                    >
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-12 h-12 rounded-lg bg-surface-container-lowest border-2 border-accent overflow-hidden ${student.rotation} group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]`}
                                                >
                                                    <img
                                                        alt={student.fullName}
                                                        src={student.avatar}
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <div className="font-headline-md text-base text-white whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block min-w-0" title={student.fullName}>
                                                        {student.fullName}
                                                    </div>
                                                    <div className="text-xs text-on-surface-variant font-label-bold">
                                                        ID: {student.studentID}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${wRisk.dot}`}
                                                ></div>
                                                <span
                                                    className={`font-label-bold ${wRisk.text} uppercase`}
                                                >
                                                    {wAcc == null
                                                        ? "N/A"
                                                        : wAcc + "%"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div
                                                    className={`w-3 h-3 rounded-full ${pRisk.dot}`}
                                                ></div>
                                                <span
                                                    className={`font-label-bold ${pRisk.text} uppercase`}
                                                >
                                                    {pAcc == null
                                                        ? "N/A"
                                                        : pAcc + "%"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${fRisk.dot}`}></div>
                                                <span className={`font-label-bold ${fRisk.text} uppercase`}>
                                                    {fAcc == null ? "N/A" : fAcc + "%"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span
                                                className={`${sStyle} px-3 py-1 rounded-full border-2 text-xs font-black uppercase`}
                                            >
                                                {student.status?.label ||
                                                    "Not Started"}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <Link
                                                    href={`/teacher/studentDetails/${student.id}`}
                                                    className="bg-accent text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2"
                                                >
                                                    View
                                                </Link>
                                                <button
                                                    onClick={() =>
                                                        setEditStudent(student)
                                                    }
                                                    className="bg-purple-500 text-white px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#4c1d95] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#4c1d95] transition-all flex items-center justify-center gap-2"
                                                >
                                                    Edit
                                                </button>
                                                <button
                                                    onClick={() => setConfirmStudent(student)}
                                                    className="bg-rose-600 text-white px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#7f1d1d] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#7f1d1d] transition-all flex items-center justify-center gap-2"
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="6"
                                        className="px-6 py-12 text-center text-on-surface-variant font-black uppercase text-sm"
                                    >
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="p-4 lg:p-6 bg-surface-container-lowest flex flex-col sm:flex-row justify-between items-center gap-3 border-t-4 border-outline/20">
                        <div className="text-on-surface-variant font-label-bold text-xs uppercase tracking-widest">
                            {meta.total > 0
                                ? `Showing ${meta.from}-${meta.to} of ${meta.total} Word Warriors`
                                : "No results"}
                        </div>
                        {meta.last_page > 1 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() =>
                                        goToPage(meta.current_page - 1)
                                    }
                                    disabled={meta.current_page <= 1}
                                    className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-outline/20 text-accent hover:bg-surface-container-high/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px] lg:text-[24px]">
                                        chevron_left
                                    </span>
                                </button>
                                {pageRange().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 font-black text-sm transition-all ${
                                            page === meta.current_page
                                                ? "border-accent bg-accent text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                                : "border-outline/20 text-on-surface-variant hover:bg-surface-container-high/50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() =>
                                        goToPage(meta.current_page + 1)
                                    }
                                    disabled={
                                        meta.current_page >= meta.last_page
                                    }
                                    className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-outline/20 text-accent hover:bg-surface-container-high/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px] lg:text-[24px]">
                                        chevron_right
                                    </span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>

            <AddStudentModal
                isOpen={!!isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                existingStudentIds={existingIds}
            />
            <EditStudentModal
                isOpen={!!editStudent}
                onClose={() => setEditStudent(null)}
                student={editStudent}
            />
            <ConfirmDeleteModal
                isOpen={!!confirmStudent}
                student={confirmStudent}
                onClose={() => setConfirmStudent(null)}
                onConfirm={() => {
                    const id = confirmStudent?.id;
                    setConfirmStudent(null);
                    if (id) router.delete(`/teacher/students/${id}`, { preserveState: true, preserveScroll: true });
                }}
            />
        </>
    );
}
