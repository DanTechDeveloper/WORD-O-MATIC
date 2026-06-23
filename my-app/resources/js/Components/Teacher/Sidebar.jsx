import { Link, usePage } from "@inertiajs/react";

export default function Sidebar({ isOpen, onClose }) {
    const { url, props } = usePage();
    const teacherName = props.auth?.user?.name;

    const activeClass =
        "bg-lime-400 text-slate-950 border-2 border-slate-950 shadow-[6px_6px_0_0_#3f6212] flex items-center gap-3 p-4 rounded-lg font-black font-lexend text-xs uppercase tracking-wider translate-x-[-2px] translate-y-[-2px]";
    const inactiveClass =
        "text-slate-400 p-4 flex items-center gap-3 hover:text-purple-400 hover:translate-x-1 hover:bg-slate-900/50 transition-all font-black font-lexend text-xs uppercase tracking-wider";

    const navItems = [
        { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
        // { label: "Classes", href: "/teacher/classes", icon: "groups" },
        { label: "Students", href: "/teacher/students", icon: "person" },
        { label: "WORD BLAST", href: "/teacher/wordModules", icon: "abc" },
        {
            label: "STORY QUEST",
            href: "/teacher/paragraphModules",
            icon: "description",
        },

        {
            label: "Leaderboards",
            href: "/teacher/leaderboards",
            icon: "leaderboard",
        },
        {
            label: "Badges",
            href: "/teacher/badges",
            icon: "badge",
        },
        { label: "Reports", href: "/teacher/reports", icon: "assessment" },
    ];

    return (
        <>
            <aside
                className={`fixed left-0 top-0 h-full w-64 flex flex-col p-4 border-r-4 border-slate-900 bg-slate-950 z-50 shadow-[4px_0_0_0_#1e1b4b] transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="mb-8 flex items-center justify-between">
                    <h1 className="text-2xl font-black text-purple-500 uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </h1>
                    <button
                        onClick={onClose}
                        className="md:hidden text-slate-500 hover:text-white"
                    >
                        <span className="material-symbols-outlined">close</span>
                    </button>
                </div>
                <nav className="flex-1 space-y-2">
                    {navItems.map((item) => {
                        const isActive = url === item.href;
                        return (
                            <Link
                                key={item.href}
                                className={
                                    isActive ? activeClass : inactiveClass
                                }
                                href={item.href}
                                onClick={() =>
                                    window.innerWidth < 768 && onClose()
                                }
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
                <div className="mt-auto pt-6 border-t border-slate-900 space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border-2 border-slate-900">
                        <div className="w-10 h-10 rounded-full bg-purple-500/20 border-2 border-purple-500/40 flex items-center justify-center shrink-0">
                            <span className="material-symbols-outlined text-purple-400 text-xl">
                                school
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-headline-md text-xs text-on-surface truncate">
                                {teacherName || "Faculty Member"}
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">
                                Academic Session
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/logout"
                        m
                        as="button"
                        method="POST"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500 text-slate-950 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0_0_#4c0519] font-black font-lexend text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
                        onClick={() => window.innerWidth < 768 && onClose()}
                    >
                        <span className="material-symbols-outlined">
                            logout
                        </span>
                        Logout
                    </Link>
                </div>
            </aside>
        </>
    );
}
