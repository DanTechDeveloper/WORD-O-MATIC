import { Link, usePage } from "@inertiajs/react";

export default function StudentFeatures() {
    const { url } = usePage();

    const getLinkClasses = (path) => {
        const isActive = url.startsWith(path);
        const base =
            "flex flex-col items-center justify-center p-2 active:scale-90 transition-transform duration-150";
        const active =
            "bg-lime-400 text-slate-950 rounded-xl translate-y-[-8px] border-b-4 border-lime-700";
        const inactive = "text-slate-400 hover:text-pink-500 transition-colors";

        return `${base} ${isActive ? active : inactive}`;
    };

    return (
        <>
            <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-4 pb-6 pt-2 h-24 bg-slate-950 border-t-4 border-purple-900 rounded-t-3xl shadow-[0px_-6px_0px_0px_rgba(88,28,135,1)]">
                <Link
                    className={getLinkClasses("/student/dashboard")}
                    href="/student/dashboard"
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings: `'FILL' ${url.startsWith("/dashboard") ? 1 : 0}`,
                        }}
                    >
                        rocket_launch
                    </span>
                    <span className="font-['Lexend'] text-[10px] font-black uppercase">
                        Home
                    </span>
                </Link>
                <Link
                    className={getLinkClasses("/student/leaderboards")}
                    href="/student/leaderboards"
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings: `'FILL' ${url.startsWith("/student/leaderboards") ? 1 : 0}`,
                        }}
                    >
                        leaderboard
                    </span>
                    <span className="font-['Lexend'] text-[10px] font-black uppercase">
                        Leaderboard
                    </span>
                </Link>
                <Link
                    className={getLinkClasses("/student/badges")}
                    href="/student/badges"
                >
                    <span
                        className="material-symbols-outlined text-2xl"
                        style={{
                            fontVariationSettings: `'FILL' ${url.startsWith("/student/badges") ? 1 : 0}`,
                        }}
                    >
                        military_tech
                    </span>
                    <span className="font-['Lexend'] text-[10px] font-black uppercase">
                        Badges
                    </span>
                </Link>
                <Link
                    className={getLinkClasses("/logout")}
                    href="/logout"
                    method="post"
                    as="button"
                >
                    <span className="material-symbols-outlined text-2xl">
                        logout
                    </span>
                    <span className="font-['Lexend'] text-[10px] font-black uppercase">
                        Logout
                    </span>
                </Link>
            </nav>
        </>
    );
}
