import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

export default function Reports(){
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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {reportTypes.map((type, index) => (
                    <button
                        key={index}
                        className="group text-left bg-slate-900 border-4 border-slate-800 p-8 rounded-3xl shadow-[8px_8px_0_0_#020617] hover:border-purple-500 hover:translate-x-[-4px] hover:translate-y-[-4px] hover:shadow-[12px_12px_0_0_#1e1b4b] transition-all"
                    >
                        <div className={`${type.color} w-16 h-16 rounded-2xl border-4 border-slate-950 flex items-center justify-center mb-6 shadow-[4px_4px_0_0_#020617]`}>
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
                    <span className="material-symbols-outlined text-purple-400">tune</span>
                    Extraction Parameters
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
                    <div className="space-y-3">
                        <label className="text-slate-500 text-xs font-black uppercase tracking-widest block">Date Range</label>
                        <select className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer">
                            <option>Last 7 Days</option>
                            <option>Last 30 Days</option>
                            <option>Current Semester</option>
                        </select>
                    </div>
                    <div className="space-y-3">
                        <label className="text-slate-500 text-xs font-black uppercase tracking-widest block">Format</label>
                        <select className="w-full bg-slate-950 border-2 border-slate-800 rounded-xl p-4 text-white font-bold focus:border-purple-500 transition-all outline-none appearance-none cursor-pointer">
                            <option>Portable Document (PDF)</option>
                            <option>Comma Separated (CSV)</option>
                            <option>Data Object (JSON)</option>
                        </select>
                    </div>
                </div>

                <button className="w-full bg-lime-400 border-4 border-slate-950 p-6 rounded-2xl text-slate-950 font-black uppercase italic text-xl tracking-tighter shadow-[8px_8px_0_0_#3f6212] hover:translate-y-1 hover:shadow-[4px_4px_0_0_#3f6212] transition-all flex items-center justify-center gap-4 group">
                    <span className="material-symbols-outlined group-hover:rotate-12 transition-transform">download_for_offline</span>
                    Initialize Extraction Sequence
                </button>
            </div>
        </DashboardLayout>
    );
}
