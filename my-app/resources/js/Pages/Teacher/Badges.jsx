import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

const BADGE_DATA = [
    {
        id: 1,
        name: "Word Master",
        slug: "word-master",
        icon: "🏆",
        description: "Complete a word module with 100% mastery.",
        requirement: "Achieve 100% accuracy on any word module.",
        totalEarned: 8,
        totalStudents: 30,
    },
    {
        id: 2,
        name: "Story Finisher",
        slug: "story-finisher",
        icon: "📚",
        description: "Reach the end of any paragraph module.",
        requirement: "Complete all pages in any paragraph module.",
        totalEarned: 5,
        totalStudents: 30,
    },
    {
        id: 3,
        name: "Clear Speaker",
        slug: "clear-speaker",
        icon: "🎤",
        description: "Maintain over 90% accuracy in speaking tasks.",
        requirement: "Score 90%+ on 3 consecutive speaking exercises.",
        totalEarned: 12,
        totalStudents: 30,
    },
    {
        id: 4,
        name: "Profile Pioneer",
        slug: "profile-pioneer",
        icon: "👤",
        description: "Set a custom avatar in your profile settings.",
        requirement: "Upload a custom avatar in profile settings.",
        totalEarned: 18,
        totalStudents: 30,
    },
    {
        id: 5,
        name: "Tutorial Master",
        slug: "tutorial-complete",
        icon: "🚀",
        description: "Completed both tutorial modes.",
        requirement: "Finish Read and Speak mode tutorials.",
        totalEarned: 22,
        totalStudents: 30,
    },
    {
        id: 6,
        name: "On Fire",
        slug: "on-fire",
        icon: "🔥",
        description: "5 correct words in a row.",
        requirement: "Get 5 consecutive correct answers.",
        totalEarned: 15,
        totalStudents: 30,
    },
];

export default function Badges() {
    const totalEarnedAcrossAll = BADGE_DATA.reduce((sum, b) => sum + b.totalEarned, 0);
    const mostEarned = BADGE_DATA.reduce((a, b) => (a.totalEarned > b.totalEarned ? a : b));

    return (
        <DashboardLayout>
            <div className="mb-10">
                <h1 className="text-4xl font-black text-white uppercase italic tracking-tighter mb-2 flex items-center gap-3">
                    <span className="material-symbols-outlined text-yellow-400">military_tech</span>
                    Badge Arsenal
                </h1>
                <p className="text-slate-500 font-black uppercase text-xs tracking-widest">
                    Monitor badge distribution and student achievements across your class
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617]">
                    <span className="material-symbols-outlined text-3xl text-purple-400 mb-4 block">workspace_premium</span>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Badges</h3>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{BADGE_DATA.length}</p>
                </div>
                <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617]">
                    <span className="material-symbols-outlined text-3xl text-lime-400 mb-4 block">stars</span>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Total Earned</h3>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{totalEarnedAcrossAll}</p>
                </div>
                <div className="bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617]">
                    <span className="material-symbols-outlined text-3xl text-yellow-400 mb-4 block">emoji_events</span>
                    <h3 className="text-slate-500 text-xs font-black uppercase tracking-widest mb-1">Most Earned</h3>
                    <p className="text-3xl font-black text-white italic tracking-tighter">{mostEarned.name}</p>
                </div>
            </div>

            <div className="bg-slate-900 border-4 border-slate-800 p-10 rounded-[2.5rem] shadow-[8px_8px_0_0_#020617]">
                <h2 className="text-2xl font-black text-white uppercase italic flex items-center gap-3 mb-8">
                    <span className="material-symbols-outlined text-lime-400">badge</span>
                    All Achievements
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                    {BADGE_DATA.map((badge) => {
                        const pct = Math.round((badge.totalEarned / badge.totalStudents) * 100);
                        const barColor =
                            pct >= 60 ? "bg-lime-400" : pct >= 30 ? "bg-yellow-400" : "bg-rose-400";
                        return (
                            <div
                                key={badge.id}
                                className="group bg-slate-950 border-2 border-slate-800 rounded-2xl p-6 hover:border-purple-500 transition-all"
                            >
                                <div className="flex items-start justify-between mb-4">
                                    <div className="w-14 h-14 bg-slate-900 border-2 border-slate-800 rounded-xl flex items-center justify-center text-2xl">
                                        {badge.icon}
                                    </div>
                                    <span className="text-slate-600 text-xs font-black uppercase tracking-widest">
                                        {badge.totalEarned}/{badge.totalStudents}
                                    </span>
                                </div>
                                <h3 className="text-white font-black uppercase italic tracking-tight text-lg mb-1">
                                    {badge.name}
                                </h3>
                                <p className="text-slate-500 text-xs font-black uppercase tracking-widest mb-3">
                                    {badge.description}
                                </p>
                                <div className="mb-2">
                                    <div className="flex justify-between text-xs font-black text-slate-500 uppercase tracking-widest mb-1">
                                        <span>Earned</span>
                                        <span>{pct}%</span>
                                    </div>
                                    <div className="w-full h-3 bg-slate-900 rounded-full border border-slate-800 overflow-hidden">
                                        <div
                                            className={`h-full ${barColor} rounded-full transition-all duration-500 group-hover:opacity-80`}
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                </div>
                                <p className="text-[10px] text-slate-600 font-black uppercase tracking-widest mt-3 pt-3 border-t border-slate-800">
                                    Requirement: {badge.requirement}
                                </p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </DashboardLayout>
    );
}
