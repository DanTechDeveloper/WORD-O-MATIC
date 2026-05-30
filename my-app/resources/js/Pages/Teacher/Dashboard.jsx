import DashboardLayout from "../../Layouts/Teacher/DashboardLayout";

export default function Dashboard() {
    const stats = [
        {
            label: "Total Students",
            value: "24",
            icon: "group",
            color: "text-blue-400",
        },
        {
            label: "AVG Read Score",
            value: "88%",
            icon: "auto_stories",
            color: "text-purple-400",
        },
        {
            label: "AVG Speak Score",
            value: "72%",
            icon: "record_voice_over",
            color: "text-lime-400",
        },
        {
            label: "At Risk Students",
            value: "3",
            icon: "warning",
            color: "text-rose-400",
        },
    ];

    const recentMissions = [
        {
            id: 1,
            student: "Leo Jupiter",
            task: "Vowel Voyagers",
            score: "92%",
            time: "2 mins ago",
            status: "Success",
        },
        {
            id: 2,
            student: "Nova Starlight",
            task: "Consonant Cluster",
            score: "45%",
            time: "15 mins ago",
            status: "Critical",
        },
        {
            id: 3,
            student: "Orion Mars",
            task: "Sentence Sector 4",
            score: "78%",
            time: "1 hour ago",
            status: "Success",
        },
    ];

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2">
                    Welcome back, Commander!
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    System status: Operational • Sector 7 monitoring active
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617] hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all cursor-default"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <span className={`material-symbols-outlined text-3xl ${stat.color}`}>
                                {stat.icon}
                            </span>
                        </div>
                        <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">
                            {stat.label}
                        </h3>
                        <p className="text-3xl font-black text-white italic tracking-tighter">
                            {stat.value}
                        </p>
                    </div>
                ))}
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                <h2 className="text-2xl font-black text-white uppercase italic mb-8 flex items-center gap-3">
                    <span className="material-symbols-outlined text-lime-400">history_edu</span>
                    Recent Mission Feed
                </h2>

                <div className="space-y-4">
                    {recentMissions.map((mission) => (
                        <div
                            key={mission.id}
                            className="flex flex-wrap items-center justify-between p-6 bg-slate-950 border-2 border-slate-800 rounded-2xl hover:border-purple-500 transition-all group"
                        >
                            <div className="flex items-center gap-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center border-4 border-slate-950 shadow-[4px_4px_0_0_#020617] ${mission.status === 'Critical' ? 'bg-rose-500' : 'bg-lime-400'}`}>
                                    <span className="material-symbols-outlined text-slate-950 font-bold">
                                        {mission.status === 'Critical' ? 'priority_high' : 'rocket_launch'}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-white font-black uppercase italic text-lg tracking-tight">{mission.student}</p>
                                    <p className="text-slate-500 text-xs font-black uppercase tracking-widest">{mission.task}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className={`text-2xl font-black italic tracking-tighter ${mission.status === 'Critical' ? 'text-rose-400' : 'text-lime-400'}`}>{mission.score}</p>
                                <p className="text-slate-600 text-[10px] font-black uppercase tracking-widest">{mission.time}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <button className="mt-10 w-full bg-slate-950 border-4 border-slate-800 p-4 rounded-2xl text-slate-500 font-black uppercase italic text-sm tracking-widest hover:text-white hover:border-purple-500 transition-all">
                    View Intelligence Archive
                </button>
            </div>
        </DashboardLayout>
    );
}