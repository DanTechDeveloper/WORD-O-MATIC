import { Link, usePage } from "@inertiajs/react";
import StudentProfile from "../../Components/Student/StudentProfile";

function BottomNav() {
    const { url } = usePage();
    const isActive = (path) => url.startsWith(path);
    const hasNewBadge = typeof window !== 'undefined' && localStorage.getItem('hasNewBadge') === '1';

    return (
        <nav className="fixed bottom-0 left-0 right-0 h-20 bg-slate-950/95 backdrop-blur-sm border-t-2 border-purple-900/60 z-40 flex items-center justify-around px-4">
            <Link
                href="/student/dashboard"
                className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-lg transition-colors ${
                    isActive("/student/dashboard") && !isActive("/student/leaderboards") && !isActive("/student/badges")
                        ? "text-lime-400"
                        : "text-on-surface-variant/60 hover:text-on-surface-variant"
                }`}
            >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    home
                </span>
                <span className="text-xs font-black uppercase tracking-wider">Home</span>
            </Link>
            <Link
                href="/student/leaderboards"
                className={`flex flex-col items-center gap-0.5 px-6 py-2 rounded-lg transition-colors ${
                    isActive("/student/leaderboards")
                        ? "text-lime-400"
                        : "text-on-surface-variant/60 hover:text-on-surface-variant"
                }`}
            >
                <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                    leaderboard
                </span>
                <span className="text-xs font-black uppercase tracking-wider">Scores</span>
            </Link>
            <Link
                href="/student/badges"
                className={`relative flex flex-col items-center gap-0.5 px-6 py-2 rounded-lg transition-colors ${
                    isActive("/student/badges")
                        ? "text-lime-400"
                        : "text-on-surface-variant/60 hover:text-on-surface-variant"
                }`}
            >
                <span className="relative">
                    <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                        military_tech
                    </span>
                    {hasNewBadge && (
                        <span className="absolute -top-0.5 -right-0.5 w-3 h-3 bg-red-500 rounded-full border-2 border-slate-950 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                    )}
                </span>
                <span className="text-xs font-black uppercase tracking-wider">Badges</span>
            </Link>
        </nav>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <div className="bg-background text-on-background font-body-md min-h-screen relative">
            <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
                style={{
                    backgroundImage: `radial-gradient(circle, rgba(163,230,53,1) 1px, transparent 1px)`,
                    backgroundSize: '32px 32px',
                }}
            />
            <div className="fixed inset-0 pointer-events-none bg-gradient-to-b from-purple-900/5 via-transparent to-transparent" />
            <StudentProfile />
            <main className="w-[92%] mx-auto pt-[72px] lg:pt-[88px] pb-24">
                {children}
            </main>
            <BottomNav />
        </div>
    );
}
