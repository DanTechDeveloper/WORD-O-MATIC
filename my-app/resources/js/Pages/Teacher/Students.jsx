import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import AddStudentModal from "@/Components/Teacher/AddStudentModal";

export default function Students({ data }) {
    console.log(data);

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
        support:
            "bg-tertiary-container text-on-tertiary-container border-tertiary",
        notStarted: "bg-slate-800/50 text-slate-500 border-slate-700",
    };

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedSection, setSelectedSection] = useState(""); // New state for section filter

    return (
        <>
            <DashboardLayout>
                {/* Header Section */}
                <div className="mb-6 lg:mb-10 flex flex-col gap-4 lg:flex-row lg:justify-between lg:items-end">
                    <div>
                        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                            Students
                        </h1>
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                            Monitoring 24 word-warriors in Sector 7-G
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3 lg:gap-4">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-purple-500 text-white px-4 sm:px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#4c1d95] font-black uppercase italic text-sm tracking-tighter hover:translate-y-1 hover:shadow-[3px_3px_0_0_#4c1d95] transition-all flex items-center justify-center gap-2"
                        >
                            <span className="material-symbols-outlined">
                                add_circle
                            </span>
                            Add Student
                        </button>
                        <div className="flex items-center bg-slate-900 rounded-2xl border-4 border-slate-800 p-1 sm:p-2 shadow-[4px_4px_0_0_#020617] overflow-x-auto">
                            <button className="px-3 sm:px-4 py-2 bg-lime-400 rounded-lg text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212] text-xs sm:text-sm whitespace-nowrap">
                                All
                            </button>
                            <button className="px-3 sm:px-4 py-2 text-slate-400 font-black hover:text-lime-300 text-xs sm:text-sm whitespace-nowrap">
                                At Risk
                            </button>
                            <button className="px-3 sm:px-4 py-2 text-slate-400 font-black hover:text-lime-300 text-xs sm:text-sm whitespace-nowrap">
                                Needs Support
                            </button>
                            <button className="px-3 sm:px-4 py-2 text-slate-400 font-black hover:text-lime-300 text-xs sm:text-sm whitespace-nowrap">
                                On Track
                            </button>
                        </div>
                    </div>
                </div>
                {/* Controls Bar */}
                <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] border-4 border-slate-800 p-4 lg:p-6 mb-6 lg:mb-10 flex flex-col lg:flex-row flex-wrap gap-4 items-stretch lg:items-center shadow-[8px_8px_0_0_#020617]">
                    <div className="flex-1 min-w-0 lg:min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lime-400">
                            search
                        </span>
                        <input
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-3 lg:py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all text-sm lg:text-base"
                            placeholder="Locate student by name or ID..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative flex-1 min-w-[140px] sm:flex-none">
                            <select className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-3 lg:py-4 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer text-sm lg:text-base">
                                <option>Sort by: Risk Level</option>
                                <option>Name (A-Z)</option>
                                <option>Recent Activity</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                expand_more
                            </span>
                        </div>
                        {/* New Section Filter */}
                        <div className="relative flex-1 min-w-[140px] sm:flex-none">
                            {/* Assuming 'data' prop contains student objects with a 'section' property */}
                            {/* Dynamically generate unique sections from the data */}
                            {/* Filter out any undefined/null sections before mapping */}
                            <select
                                className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-3 lg:py-4 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all text-sm lg:text-base"
                                value={selectedSection}
                                onChange={(e) =>
                                    setSelectedSection(e.target.value)
                                }
                            >
                                <option value="">All Sections</option>
                                {[
                                    ...new Set(
                                        data
                                            .map((student) => student.section)
                                            .filter(Boolean),
                                    ),
                                ].map((sectionName) => (
                                    <option
                                        key={sectionName}
                                        value={sectionName}
                                    >
                                        {sectionName}
                                    </option>
                                ))}
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                expand_more
                            </span>
                        </div>
                        <button className="bg-lime-400 text-slate-950 px-4 lg:px-6 py-3 lg:py-4 rounded-2xl border-4 border-slate-950 shadow-[8px_8px_0_0_#3f6212] font-black uppercase italic text-xs sm:text-sm tracking-tighter hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212] transition-all flex items-center justify-center gap-2 w-full sm:w-auto">
                            <span
                                className="material-symbols-outlined text-slate-950"
                                data-icon="filter_list"
                            >
                                filter_list
                            </span>
                            Advanced Filters
                        </button>
                    </div>
                </div>

                {/* Student List — Card layout on mobile/tablet, Table on lg+ */}
                <div className="bg-slate-900 rounded-2xl lg:rounded-[2.5rem] border-4 border-slate-800 overflow-hidden shadow-[8px_8px_0_0_#020617]">

                    {/* === MOBILE / TABLET CARD VIEW (below lg) === */}
                    <div className="block lg:hidden divide-y-2 divide-slate-800/50">
                        {data
                            .filter(
                                (student) =>
                                    selectedSection === "" ||
                                    student.section === selectedSection,
                            )
                            .map((student, index) => {
                                const wAcc = student.wordBlastAcc;
                                const pAcc = student.storyQuestAcc;
                                const wRisk =
                                    riskStyles[computeRisk(wAcc)];
                                const pRisk =
                                    riskStyles[computeRisk(pAcc)];
                                const sStyle =
                                    statusStyles[student.status?.type] ||
                                    statusStyles.notStarted;

                                return (
                                    <div
                                        key={index}
                                        className="p-4 sm:p-5 flex flex-col gap-3"
                                    >
                                        {/* Top row: avatar + name + status */}
                                        <div className="flex items-center gap-3">
                                            <div
                                                className={`w-11 h-11 sm:w-12 sm:h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden shrink-0 ${student.rotation} shadow-[3px_3px_0px_0px_#3f6212]`}
                                            >
                                                <img
                                                    alt={student.fullName}
                                                    src={student.avatar}
                                                    className="w-full h-full object-cover"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="font-headline-md text-sm sm:text-base text-white truncate">
                                                    {student.fullName}
                                                </div>
                                                <div className="text-xs text-slate-500 font-label-bold">
                                                    ID: {student.studentID}
                                                </div>
                                            </div>
                                            <span
                                                className={`${sStyle} px-2 sm:px-3 py-1 rounded-full border-2 text-[10px] sm:text-xs font-black uppercase shrink-0`}
                                            >
                                                {student.status?.label ||
                                                    "Not Started"}
                                            </span>
                                        </div>
                                        {/* Bottom row: risks + action */}
                                        <div className="flex items-center gap-4 flex-wrap">
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full ${wRisk.dot}`}
                                                ></div>
                                                <span className="text-[10px] text-slate-500 font-label-bold uppercase">
                                                    Word Blast Accuracy:
                                                </span>
                                                <span
                                                    className={`font-label-bold text-xs ${wRisk.text} uppercase`}
                                                >
                                                    {wAcc == null || wAcc === 0
                                                        ? "N/A"
                                                        : wAcc + "%"}
                                                </span>
                                            </div>
                                            <div className="flex items-center gap-1.5">
                                                <div
                                                    className={`w-2.5 h-2.5 rounded-full ${pRisk.dot}`}
                                                ></div>
                                                <span className="text-[10px] text-slate-500 font-label-bold uppercase">
                                                    Story Quest Accuracy:
                                                </span>
                                                <span
                                                    className={`font-label-bold text-xs ${pRisk.text} uppercase`}
                                                >
                                                    {pAcc == null || pAcc === 0
                                                        ? "N/A"
                                                        : pAcc + "%"}
                                                </span>
                                            </div>
                                            <Link
                                                href={`/teacher/studentDetails/${student.id}`}
                                                className="ml-auto bg-lime-400 text-slate-950 px-4 py-2 rounded-xl border-3 border-slate-950 shadow-[4px_4px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[2px_2px_0_0_#3f6212] transition-all"
                                            >
                                                View
                                            </Link>
                                        </div>
                                    </div>
                                );
                            })}
                    </div>

                    {/* === DESKTOP TABLE VIEW (lg+) === */}
                    <table className="hidden lg:table w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b-4 border-slate-800">
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Name
                                </th>{" "}
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Word Blast Accuracy
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Story Quest Accuracy
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Final Status
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Action
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/50">
                            {/* Filter students based on selectedSection */}
                            {data
                                .filter(
                                    (student) =>
                                        selectedSection === "" ||
                                        student.section === selectedSection,
                                )
                                .map((student, index) => {
                                    const wAcc = student.wordBlastAcc;
                                    const pAcc = student.storyQuestAcc;
                                    const wRisk =
                                        riskStyles[computeRisk(wAcc)];
                                    const pRisk =
                                        riskStyles[computeRisk(pAcc)];
                                    const sStyle =
                                        statusStyles[student.status?.type] ||
                                        statusStyles.notStarted;

                                    return (
                                        <tr
                                            key={index}
                                            className="hover:bg-slate-900/50 transition-colors group"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-4">
                                                    <div
                                                        className={`w-12 h-12 rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden ${student.rotation} group-hover:rotate-0 transition-transform shadow-[3px_3px_0px_0px_#3f6212]`}
                                                    >
                                                        <img
                                                            alt={
                                                                student.fullName
                                                            }
                                                            src={student.avatar}
                                                        />
                                                    </div>
                                                    <div>
                                                        <div className="font-headline-md text-base text-white">
                                                            {student.fullName}
                                                        </div>
                                                        <div className="text-xs text-slate-500 font-label-bold">
                                                            ID:{" "}
                                                            {student.studentID}
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
                                                        {wAcc == null || wAcc === 0
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
                                                        {pAcc == null || pAcc === 0
                                                            ? "N/A"
                                                            : pAcc + "%"}
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
                                            <td className="px-6 py-4 text-slate-400 font-body-md">
                                                <Link
                                                    href={`/teacher/studentDetails/${student.id}`}
                                                    className="bg-lime-400 text-slate-950 px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-[3px_3px_0_0_#3f6212] transition-all flex items-center justify-center gap-2"
                                                >
                                                    View
                                                </Link>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>

                    {/* Table Pagination/Footer */}
                    <div className="p-4 lg:p-6 bg-slate-950 flex flex-col sm:flex-row justify-between items-center gap-3 border-t-4 border-slate-800">
                        <div className="text-slate-500 font-label-bold text-xs uppercase tracking-widest">
                            Showing 1-4 of 24 Word Warriors
                        </div>
                        <div className="flex gap-2">
                            <button className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                <span className="material-symbols-outlined text-[20px] lg:text-[24px]">
                                    chevron_left
                                </span>
                            </button>
                            <button className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-lime-400 bg-lime-400 text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212] text-sm">
                                1
                            </button>
                            <button className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black text-sm">
                                2
                            </button>
                            <button className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black text-sm">
                                3
                            </button>
                            <button className="w-9 h-9 lg:w-10 lg:h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                <span className="material-symbols-outlined text-[20px] lg:text-[24px]">
                                    chevron_right
                                </span>
                            </button>
                        </div>
                    </div>
                </div>
            </DashboardLayout>

            <AddStudentModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
            />
        </>
    );
}
