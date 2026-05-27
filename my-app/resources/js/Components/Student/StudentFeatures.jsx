import { Link } from "@inertiajs/react";

export default function StudentFeatures() {
    return (
        <>
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 h-24 bg-slate-950 border-t-4 border-purple-900 rounded-t-3xl shadow-[0px_-6px_0px_0px_rgba(88,28,135,1)]">
                <Link
                    class="flex flex-col items-center justify-center bg-lime-400 text-slate-950 rounded-xl p-2 translate-y-[-8px] border-b-4 border-lime-700 active:scale-90 transition-transform duration-150"
                    href="/student/dashboard"
                >
                    <span
                        class="material-symbols-outlined text-2xl"
                        style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                        rocket_launch
                    </span>
                    <span class="font-['Lexend'] text-[10px] font-black uppercase">
                        Home
                    </span>
                </Link>
                <Link
                    class="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-pink-500 transition-colors active:scale-90 transition-transform duration-150"
                    href="/student/leaderboard"
                >
                    <span class="material-symbols-outlined text-2xl">
                        leaderboard
                    </span>
                    <span class="font-['Lexend'] text-[10px] font-black uppercase">
                        Leaderboard
                    </span>
                </Link>
                <Link
                    class="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-pink-500 transition-colors active:scale-90 transition-transform duration-150"
                    href="/student/badges"
                >
                    <span class="material-symbols-outlined text-2xl">
                        military_tech
                    </span>
                    <span class="font-['Lexend'] text-[10px] font-black uppercase">
                        Badges
                    </span>
                </Link>
                <Link
                    class="flex flex-col items-center justify-center text-slate-400 p-2 hover:text-pink-500 transition-colors active:scale-90 transition-transform duration-150"
                    href="/logout"
                >
                    <span class="material-symbols-outlined text-2xl">
                        logout
                    </span>
                    <span class="font-['Lexend'] text-[10px] font-black uppercase">
                        Logout
                    </span>
                </Link>
            </nav>
        </>
    );
}
