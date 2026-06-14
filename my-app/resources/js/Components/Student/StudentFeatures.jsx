import { Link, usePage } from "@inertiajs/react";

export default function StudentFeatures() {
    const { url } = usePage();

    const activeClass =
        "bg-lime-400 text-slate-950 border-2 border-slate-950 shadow-[6px_6px_0_0_#3f6212] flex items-center gap-3 p-4 rounded-lg font-black font-lexend text-xs uppercase tracking-wider translate-x-[-2px] translate-y-[-2px]";
    const inactiveClass =
        "text-slate-400 p-4 flex items-center gap-3 hover:text-purple-400 hover:translate-x-1 hover:bg-slate-900/50 transition-all font-black font-lexend text-xs uppercase tracking-wider";

    const navItems = [
        {
            label: "Dashboard",
            href: "/student/dashboard",
            icon: "rocket_launch",
        },
        {
            label: "Leaderboards",
            href: "/student/leaderboards",
            icon: "leaderboard",
        },
        { label: "Badges", href: "/student/badges", icon: "military_tech" },
    ];

    return (
        <>
            <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-4 border-r-4 border-slate-900 bg-slate-950 z-50 shadow-[4px_0_0_0_#1e1b4b]">
                  <div className="mb-8">
                    <h1 className="text-2xl font-black text-purple-500 uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </h1>
                </div>
                <nav className="flex-1 space-y-2 mt-4">
                    {navItems.map((item) => {
                        const isActive = url === item.href;
                        return (
                            <Link
                                key={item.href}
                                className={
                                    isActive ? activeClass : inactiveClass
                                }
                                href={item.href}
                            >
                                <span
                                    className="material-symbols-outlined"
                                    data-weight={isActive ? "fill" : ""}
                                >
                                    {item.icon}
                                </span>
                                {item.label}
                            </Link>
                        );
                    })}
                </nav>
            </aside>
        </>
    );
}
