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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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
        </DashboardLayout>
    );
}