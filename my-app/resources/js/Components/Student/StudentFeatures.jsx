import { Link, usePage } from "@inertiajs/react";

export default function StudentFeatures() {
    const { url } = usePage();

    const activeClass =
        "bg-lime-400 text-surface-container-lowest border-2 border-surface-container-lowest shadow-[6px_6px_0_0_#3f6212] flex items-center gap-3 p-4 rounded-lg font-black font-lexend text-xs uppercase tracking-wider translate-x-[-2px] translate-y-[-2px]";
    const inactiveClass =
        "text-slate-400 p-4 flex items-center gap-3 hover:text-purple-400 hover:translate-x-1 hover:bg-surface-container-high/60 transition-all font-black font-lexend text-xs uppercase tracking-wider";

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

    const bottomActiveClass =
        "flex flex-col items-center gap-0.5 text-[10px] font-bold text-lime-400";
    const bottomInactiveClass =
        "flex flex-col items-center gap-0.5 text-[10px] font-medium text-slate-500";

    return (
        <>
            <aside className="hidden lg:flex lg:flex-col fixed left-0 top-0 h-full w-64 p-4 border-r-4 border-outline bg-background z-50">
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

            {/* Mobile Bottom Nav */}
            <nav className="fixed bottom-0 left-0 right-0 flex lg:hidden items-center justify-around bg-background border-t-4 border-outline z-50 px-2 py-2">
                {navItems.map((item) => {
                    const isActive = url === item.href;
                    return (
                        <Link
                            key={item.href}
                            className={
                                isActive ? bottomActiveClass : bottomInactiveClass
                            }
                            href={item.href}
                        >
                            <span
                                className="material-symbols-outlined text-2xl"
                                data-weight={isActive ? "fill" : ""}
                            >
                                {item.icon}
                            </span>
                            {item.label}
                        </Link>
                    );
                })}
            </nav>
        </>
    );
}
