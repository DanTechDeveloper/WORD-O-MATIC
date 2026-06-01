import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";
import { useState } from "react";
import { Link } from "@inertiajs/react";

export default function AddStudent() {
    const [formData, setFormData] = useState({
        name: "",
        fleetId: "#GWOM-",
        sector: "Sector 7-G",
        wordRisk: "low",
        paragraphRisk: "low",
    });

    // Mock data for "Recently Added" - in a real app, this would come from the backend
    const [recentStudents, setRecentStudents] = useState([
        {
            id: "#GWOM-4421",
            name: "Leo Jupiter",
            sector: "Sector 7-G",
            wordRisk: "high",
            paragraphRisk: "moderate",
            gameName: "Leo Jupiter",
        },
        {
            id: "#GWOM-9902",
            name: "Nova Starlight",
            sector: "Nebula 4",
            wordRisk: "low",
            paragraphRisk: "low",
            gameName: "Jineper",
        },
    ]);

    const riskStyles = {
        high: "text-rose-400 bg-rose-400/10 border-rose-500/50",
        moderate: "text-amber-400 bg-amber-400/10 border-amber-500/50",
        low: "text-lime-400 bg-lime-400/10 border-lime-500/50",
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        const newWarrior = {
            id: formData.fleetId,
            name: formData.name,
            sector: formData.sector,
            wordRisk: formData.wordRisk,
            paragraphRisk: formData.paragraphRisk,
        };
        setRecentStudents([newWarrior, ...recentStudents]);
        // Reset form except for Fleet ID prefix
        setFormData({ ...formData, name: "" });
    };

    const handlePrint = (studentId) => {
        console.log("Printing credentials for:", studentId);
        // window.print() logic or PDF generation would go here
    };

    return (
        <DashboardLayout>
            {/* Header */}
            <div className="mb-8 flex items-center justify-between">
                <div>
                    <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                        Recruitment{" "}
                        <span className="text-purple-500">Center</span>
                    </h1>
                    <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                        Enlisting new Word Warriors to the Galaxy Fleet
                    </p>
                </div>
                <Link
                    href="/teacher/students"
                    className="text-slate-400 hover:text-white flex items-center gap-2 font-black uppercase text-xs tracking-widest transition-colors"
                >
                    <span className="material-symbols-outlined">
                        arrow_back
                    </span>
                    Back to Fleet
                </Link>
            </div>

            <div className="space-y-10">
                {/* Section 1: Registration Form */}
                <section className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-8 shadow-[8px_8px_0_0_#020617] relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <span className="material-symbols-outlined text-9xl">
                            person_add
                        </span>
                    </div>

                    <header className="mb-8 border-b-2 border-slate-800 pb-4">
                        <h2 className="text-xl font-black text-lime-400 uppercase tracking-tight">
                            Warrior Onboarding Console
                        </h2>
                    </header>

                    <form
                        onSubmit={handleSubmit}
                        className="grid-cols-1 md:grid-cols-3 gap-8"
                    >
                        {/* Identity Group */}
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Warrior Name
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-4 text-white font-bold focus:border-purple-500 outline-none transition-all"
                                    placeholder="e.g. Leo Jupiter"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            name: e.target.value,
                                        })
                                    }
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">
                                    Fleet ID
                                </label>
                                <input
                                    required
                                    type="text"
                                    className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl px-4 py-4 text-white font-bold focus:border-purple-500 outline-none transition-all"
                                    value={formData.fleetId}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            fleetId: e.target.value,
                                        })
                                    }
                                />
                            </div>
                        </div>

                        {/* Action Group */}
                        <div className="flex flex-col justify-end mt-6">
                            <button
                                type="submit"
                                className="w-full bg-lime-400 text-slate-950 py-5 rounded-2xl border-4 border-slate-950 shadow-[6px_6px_0_0_#3f6212] font-black uppercase italic tracking-tighter hover:translate-y-1 hover:shadow-[2px_2px_0_0_#3f6212] transition-all flex items-center justify-center gap-3"
                            >
                                <span className="material-symbols-outlined font-black">
                                    person_add
                                </span>
                                ADD STUDENT
                            </button>
                        </div>
                    </form>
                </section>

                {/* Section 2: Management Table */}
                <section className="bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 overflow-hidden shadow-[8px_8px_0_0_#020617]">
                    <div className="bg-slate-800/50 px-8 py-5 flex items-center justify-between border-b-4 border-slate-800">
                        <h2 className="text-lg font-black text-white uppercase italic tracking-tight">
                            Recently Added Recruits
                        </h2>
                        <span className="bg-slate-950 text-slate-400 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-slate-700">
                            {recentStudents.length} Active Sessions
                        </span>
                    </div>

                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-950/50 border-b-2 border-slate-800">
                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    Student Identity
                                </th>

                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">
                                    Student In Game Name
                                </th>

                                <th className="px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 text-right">
                                    Actions
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y-2 divide-slate-800/30">
                            {recentStudents.map((student) => (
                                <tr
                                    key={student.id}
                                    className="hover:bg-slate-800/20 transition-colors group"
                                >
                                    <td className="px-8 py-5">
                                        <div className="font-black text-white">
                                            {student.name}
                                        </div>
                                        <div className="text-[10px] text-purple-400 font-black tracking-widest uppercase">
                                            {student.id}
                                        </div>
                                    </td>

                                    <td className="px-8 py-5">
                                        <div className="font-black text-white">
                                            {student.gameName}
                                        </div>
                                    </td>

                                    <td className="px-8 py-5">
                                        <div className="flex justify-end gap-2">
                                            <button className="px-4 py-2 bg-slate-950 border-2 border-slate-800 rounded-lg text-[10px] font-black text-slate-400 hover:text-white hover:bg-slate-800 transition-all uppercase tracking-widest">
                                                Edit
                                            </button>
                                            <button className="px-4 py-2 bg-red-950 border-2 border-slate-800 rounded-lg text-[10px] font-black text-slate-400 hover:text-white hover:bg-slatered-800 rounded-lg text-[10px] font-black text-red-400 hover:text-white hover:bg-red-800 transition-all uppercase tracking-widest">
                                                Delete
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {recentStudents.length === 0 && (
                                <tr>
                                    <td
                                        colSpan="4"
                                        className="px-8 py-12 text-center text-slate-600 italic font-bold"
                                    >
                                        No warriors recruited in this session
                                        yet.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </section>
            </div>
        </DashboardLayout>
    );
}
