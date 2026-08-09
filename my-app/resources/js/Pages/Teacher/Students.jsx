import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link, router } from "@inertiajs/react";
import { useRef, useState } from "react";
import AddStudentModal from "@/Components/Teacher/AddStudentModal";
import EditStudentModal from "@/Components/Teacher/EditStudentModal";
import PageHeader from "@/Components/Teacher/PageHeader";
import TabBar from "@/Components/Teacher/TabBar";
import SearchInput from "@/Components/Teacher/SearchInput";
import SelectField from "@/Components/Teacher/SelectField";
import AvatarChip from "@/Components/Teacher/AvatarChip";
import StatusBadge from "@/Components/Teacher/StatusBadge";
import TeacherButton from "@/Components/Teacher/TeacherButton";

const sortOptions = [
    { value: "risk", label: "Risk Level" },
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

export default function Students({ data, sections, filters }) {
    const students = data.data ?? [];
    const meta = {
        current_page: data.current_page ?? 1,
        last_page: data.last_page ?? 1,
        from: data.from,
        to: data.to,
        total: data.total,
    };

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [editStudent, setEditStudent] = useState(null);
    const [statusTab, setStatusTab] = useState(filters.status ?? "");
    const searchRef = useRef(null);
    const debounceRef = useRef(null);

    function navigate(params) {
        router.get("/teacher/students", {
            ...filters,
            ...params,
            page: params.page ?? 1,
        }, {
            preserveState: true,
            preserveScroll: true,
        });
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
        if (acc < 50) return "high";
        if (acc < 75) return "moderate";
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
            text: "text-slate-500",
        },
    };

    const statusStyles = {
        atRisk: "bg-error-container text-on-error-container border-error",
        onTrack: "bg-green-900/50 text-green-400 border-green-500",
        support: "bg-tertiary-container text-on-tertiary-container border-tertiary",
        notStarted: "bg-slate-800/50 text-slate-500 border-slate-700",
        in_progress: "bg-sky-900/50 text-sky-400 border-sky-500",
    };

    return (
        <>
            <DashboardLayout>
                <PageHeader
                    className="mb-6 lg:mb-10 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end"
                    title="Students"
                    subtitle={`Monitoring ${meta.total ?? 0} word-warriors`}
                >
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                        <TeacherButton
                            variant="purple"
                            onClick={() => setIsAddModalOpen(true)}
                            icon="add_circle"
                        >
                            Add Student
                        </TeacherButton>
                        <TabBar
                            tabs={statusTabs}
                            active={statusTab}
                            onSelect={handleStatusTab}
                            className="flex items-center bg-slate-900 rounded-2xl border-4 border-slate-800 p-1 sm:p-2 shadow-[4px_4px_0_0_#020617] overflow-x-auto"
                        />
                    </div>
                </PageHeader>

                <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] border-4 border-slate-800 p-4 lg:p-6 mb-6 lg:mb-10 flex flex-col lg:flex-row flex-wrap gap-4 items-stretch lg:items-center shadow-[8px_8px_0_0_#020617]">
                    <div className="flex-1 min-w-0 lg:min-w-[300px] relative">
                        <SearchInput
                            inputRef={searchRef}
                            defaultValue={filters.search ?? ""}
                            onChange={handleSearch}
                            placeholder="Locate student by name or ID..."
                            inputIconPad="pl-12 pr-4"
                            pad="py-3 lg:py-4"
                            iconPos="left-4"
                            iconClassName="text-lime-400"
                            inputClassName="text-sm lg:text-base"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <SelectField
                            value={filters.sort ?? "risk"}
                            onChange={handleSort}
                            wrapperClassName="flex-1 min-w-[140px] sm:flex-none"
                            padSelect="py-3 lg:py-4"
                            selectClassName="text-sm lg:text-base"
                            icon="expand_more"
                        >
                            {sortOptions.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    Sort by: {opt.label}
                                </option>
                            ))}
                        </SelectField>
                        <SelectField
                            value={filters.section ?? ""}
                            onChange={handleSection}
                            wrapperClassName="flex-1 min-w-[140px] sm:flex-none"
                            padSelect="py-3 lg:py-4"
                            selectClassName="text-sm lg:text-base"
                            icon="expand_more"
                        >
                            <option value="">All Sections</option>
                            {sections.map((sectionName) => (
                                <option key={sectionName} value={sectionName}>
                                    {sectionName}
                                </option>
                            ))}
                        </SelectField>
                    </div>
                </div>

                <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] border-4 border-slate-800 overflow-hidden shadow-[8px_8px_0_0_#020617]">
                    <div className="block lg:hidden divide-y-2 divide-slate-800/50">
                        {students.map((student, index) => {
                            const wAcc = student.wordBlastAcc;
                            const pAcc = student.storyQuestAcc;
                            const wRisk = riskStyles[computeRisk(wAcc)];
                            const pRisk = riskStyles[computeRisk(pAcc)];
                            const sStyle = statusStyles[student.status?.type] || statusStyles.notStarted;

                            return (
                                <div key={student.id ?? index} className="p-4 sm:p-5 flex flex-col gap-3">
                                    <div className="flex items-center gap-3">
                                        <AvatarChip
                                            src={student.avatar}
                                            alt={student.fullName}
                                            size="w-11 h-11 sm:w-12 sm:h-12"
                                            className={`${student.rotation} shadow-[3px_3px_0px_0px_#3f6212]`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-headline-md text-sm sm:text-base text-white truncate">{student.fullName}</div>
                                            <div className="text-xs text-slate-500 font-label-bold">ID: {student.studentID}</div>
                                        </div>
                                        <StatusBadge color={sStyle} className="shrink-0">
                                            {student.status?.label || "Not Started"}
                                        </StatusBadge>
                                    </div>
                                    <div className="flex items-center gap-4 flex-wrap">
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${wRisk.dot}`}></div>
                                            <span className="text-[10px] text-slate-500 font-label-bold uppercase">Word Blast:</span>
                                            <span className={`font-label-bold text-xs ${wRisk.text} uppercase`}>
                                                {wAcc == null ? "N/A" : wAcc + "%"}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1.5">
                                            <div className={`w-2.5 h-2.5 rounded-full ${pRisk.dot}`}></div>
                                            <span className="text-[10px] text-slate-500 font-label-bold uppercase">Story Quest:</span>
                                            <span className={`font-label-bold text-xs ${pRisk.text} uppercase`}>
                                                {pAcc == null ? "N/A" : pAcc + "%"}
                                            </span>
                                        </div>
                                        <div className="ml-auto flex gap-2">
                                            <TeacherButton
                                                href={`/teacher/studentDetails/${student.id}`}
                                                variant="lime"
                                            >
                                                View
                                            </TeacherButton>
                                            <TeacherButton
                                                variant="purple"
                                                onClick={() => setEditStudent(student)}
                                            >
                                                Edit
                                            </TeacherButton>
                                            <TeacherButton
                                                variant="rose"
                                                onClick={() => {
                                                    if (window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) {
                                                        router.delete(`/teacher/students/${student.id}`, {
                                                            preserveState: true,
                                                            preserveScroll: true,
                                                        });
                                                    }
                                                }}
                                            >
                                                Delete
                                            </TeacherButton>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                        {students.length === 0 && (
                            <div className="p-8 text-center text-slate-500 font-black uppercase text-sm">
                                No students found
                            </div>
                        )}
                    </div>

                    <table className="hidden lg:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b-4 border-slate-800">
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">Name</th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">Word Blast</th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">Story Quest</th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">Final Status</th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/50">
                            {students.map((student, index) => {
                                const wAcc = student.wordBlastAcc;
                                const pAcc = student.storyQuestAcc;
                                const wRisk = riskStyles[computeRisk(wAcc)];
                                const pRisk = riskStyles[computeRisk(pAcc)];
                                const sStyle = statusStyles[student.status?.type] || statusStyles.notStarted;

                                return (
                                    <tr key={student.id ?? index} className="hover:bg-slate-900/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-4">
                                                <AvatarChip
                                                    src={student.avatar}
                                                    alt={student.fullName}
                                                    size="w-12 h-12"
                                                    className={`${student.rotation} group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]`}
                                                />
                                                <div>
                                                    <div className="font-headline-md text-base text-white">{student.fullName}</div>
                                                    <div className="text-xs text-slate-500 font-label-bold">ID: {student.studentID}</div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${wRisk.dot}`}></div>
                                                <span className={`font-label-bold ${wRisk.text} uppercase`}>
                                                    {wAcc == null ? "N/A" : wAcc + "%"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <div className={`w-3 h-3 rounded-full ${pRisk.dot}`}></div>
                                                <span className={`font-label-bold ${pRisk.text} uppercase`}>
                                                    {pAcc == null ? "N/A" : pAcc + "%"}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <StatusBadge color={sStyle} className="text-xs">
                                                {student.status?.label || "Not Started"}
                                            </StatusBadge>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex gap-2">
                                                <TeacherButton
                                                    href={`/teacher/studentDetails/${student.id}`}
                                                    variant="lime"
                                                    size="md"
                                                >
                                                    View
                                                </TeacherButton>
                                                <TeacherButton
                                                    variant="purple"
                                                    size="md"
                                                    onClick={() => setEditStudent(student)}
                                                >
                                                    Edit
                                                </TeacherButton>
                                                <TeacherButton
                                                    variant="rose"
                                                    size="md"
                                                    onClick={() => {
                                                        if (window.confirm(`Delete ${student.fullName}? This cannot be undone.`)) {
                                                            router.delete(`/teacher/students/${student.id}`, {
                                                                preserveState: true,
                                                                preserveScroll: true,
                                                            });
                                                        }
                                                    }}
                                                >
                                                    Delete
                                                </TeacherButton>
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {students.length === 0 && (
                                <tr>
                                    <td colSpan="5" className="px-6 py-12 text-center text-slate-500 font-black uppercase text-sm">
                                        No students found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>

                    <div className="p-4 lg:p-6 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-3 border-t-4 border-slate-800">
                        <div className="text-slate-500 font-label-bold text-xs uppercase tracking-widest">
                            {meta.total > 0
                                ? `Showing ${meta.from}-${meta.to} of ${meta.total} Word Warriors`
                                : "No results"}
                        </div>
                        {meta.last_page > 1 && (
                            <div className="flex gap-2">
                                <button
                                    onClick={() => goToPage(meta.current_page - 1)}
                                    disabled={meta.current_page <= 1}
                                    className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px] lg:text-[24px]">chevron_left</span>
                                </button>
                                {pageRange().map((page) => (
                                    <button
                                        key={page}
                                        onClick={() => goToPage(page)}
                                        className={`w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 font-black text-sm transition-all ${
                                            page === meta.current_page
                                                ? "border-lime-400 bg-lime-400 text-slate-950 shadow-[2px_2px_0_0_#3f6212]"
                                                : "border-slate-800 text-slate-400 hover:bg-slate-800/50"
                                        }`}
                                    >
                                        {page}
                                    </button>
                                ))}
                                <button
                                    onClick={() => goToPage(meta.current_page + 1)}
                                    disabled={meta.current_page >= meta.last_page}
                                    className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                                >
                                    <span className="material-symbols-outlined text-[20px] lg:text-[24px]">chevron_right</span>
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </DashboardLayout>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
            <EditStudentModal
                isOpen={!!editStudent}
                onClose={() => setEditStudent(null)}
                student={editStudent}
            />
        </>
    );
}