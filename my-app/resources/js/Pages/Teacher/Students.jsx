import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { Link } from "@inertiajs/react";
import { useState } from "react";
import AddStudentModal from "@/Components/Teacher/AddStudentModal";

export default function Students({ data }) {
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
        excellent: "bg-green-900/50 text-green-400 border-green-500",
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
                <div className="mb-10 flex justify-between items-end">
                    <div>
                        <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                            Students
                        </h1>
                        <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                            Monitoring 24 word-warriors in Sector 7-G
                        </p>
                    </div>
                    <div className="flex gap-4">
                        <button
                            onClick={() => setIsAddModalOpen(true)}
                            className="bg-purple-500 text-white px-6 py-3 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#4c1d95] font-black uppercase italic text-sm tracking-tighter hover:translate-y-1 hover:shadow-[3px_3px_0_0_#4c1d95] transition-all flex items-center gap-2"
                        >
                            <span className="material-symbols-outlined">
                                add_circle
                            </span>
                            Add Student
                        </button>
                        <div className="flex items-center bg-slate-900 rounded-2xl border-4 border-slate-800 p-2 shadow-[4px_4px_0_0_#020617]">
                            <button className="px-4 py-2 bg-lime-400 rounded-lg text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212]">
                                All
                            </button>
                            <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                At Risk
                            </button>
                            <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                Needs Support
                            </button>
                            <button className="px-4 py-2 text-slate-400 font-black hover:text-lime-300">
                                On Track
                            </button>
                        </div>
                    </div>
                </div>
                {/* Controls Bar */}
                <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-6 mb-10 flex flex-wrap gap-4 items-center shadow-[8px_8px_0_0_#020617]">
                    <div className="flex-1 min-w-[300px] relative">
                        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-lime-400">
                            search
                        </span>
                        <input
                            className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl pl-12 pr-4 py-4 text-white font-bold focus:outline-none focus:border-lime-500 transition-all"
                            placeholder="Locate student by name or ID..."
                            type="text"
                        />
                    </div>
                    <div className="flex gap-3 flex-wrap">
                        <div className="relative">
                            <select className="appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-4 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer">
                                <option>Sort by: Risk Level</option>
                                <option>Name (A-Z)</option>
                                <option>Recent Activity</option>
                            </select>
                            <span className="material-symbols-outlined absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-lime-400">
                                expand_more
                            </span>
                        </div>
                        {/* New Section Filter */}
                        <div className="relative">
                            {/* Assuming 'data' prop contains student objects with a 'section' property */}
                            {/* Dynamically generate unique sections from the data */}
                            {/* Filter out any undefined/null sections before mapping */}
                            <select
                                className="w-full appearance-none bg-slate-950 border-2 border-slate-800 rounded-xl pl-4 pr-10 py-4 text-white font-bold focus:outline-none focus:border-lime-500 cursor-pointer transition-all"
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
                        <button className="bg-lime-400 text-slate-950 px-6 py-4 rounded-2xl border-4 border-slate-950 shadow-[8px_8px_0_0_#3f6212] font-black uppercase italic text-sm tracking-tighter hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212] transition-all flex items-center justify-center gap-2">
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
                {/* Full Student Table */}
                <div className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 overflow-hidden shadow-[8px_8px_0_0_#020617]">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-900 border-b-4 border-slate-800">
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Name
                                </th>{" "}
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Word Risk
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Paragraph Risk
                                </th>
                                <th className="px-6 py-5 font-headline-md text-sm uppercase tracking-widest text-lime-400">
                                    Status
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
                                    const wRisk =
                                        riskStyles[student.wordRisk] ||
                                        riskStyles.na;
                                    const pRisk =
                                        riskStyles[student.paragraphRisk] ||
                                        riskStyles.na;
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
                                                        {student.wordRisk ===
                                                        "na"
                                                            ? "N/A"
                                                            : student.wordRisk}
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
                                                        {student.paragraphRisk ===
                                                        "na"
                                                            ? "N/A"
                                                            : student.paragraphRisk}
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
                    <div className="p-6 bg-slate-950 flex justify-between items-center border-t-4 border-slate-800">
                        <div className="text-slate-500 font-label-bold text-xs uppercase tracking-widest">
                            Showing 1-4 of 24 Word Warriors
                        </div>
                        <div className="flex gap-2">
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                <span className="material-symbols-outlined">
                                    chevron_left
                                </span>
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-lime-400 bg-lime-400 text-slate-950 font-black shadow-[2px_2px_0_0_#3f6212]">
                                1
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black">
                                2
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-slate-400 hover:bg-slate-800/50 transition-all font-black">
                                3
                            </button>
                            <button className="w-10 h-10 flex items-center justify-center rounded-lg border-2 border-slate-800 text-lime-400 hover:bg-slate-800/50 transition-all">
                                <span className="material-symbols-outlined">
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
