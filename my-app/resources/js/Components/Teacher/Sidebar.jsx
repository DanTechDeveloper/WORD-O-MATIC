import { Link, usePage } from "@inertiajs/react";

export default function Sidebar({ isOpen, onClose }) {
    const { url, props } = usePage();
    const teacherName = props.auth?.user?.name;

    const activeClass =
        "bg-accent text-background border-2 border-background shadow-[6px_6px_0_0_#3f6212] flex items-center gap-3 p-4 rounded-lg font-black font-headline-md text-xs uppercase tracking-wider translate-x-[-2px] translate-y-[-2px]";
    const inactiveClass =
        "text-on-surface-variant/60 p-4 flex items-center gap-3 hover:text-primary hover:translate-x-1 hover:bg-surface-container-low/60 transition-all font-black font-headline-md text-xs uppercase tracking-wider";

    const navItems = [
        { label: "Dashboard", href: "/teacher/dashboard", icon: "dashboard" },
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
        { label: "Reports", href: "/teacher/reports", icon: "assessment" },
    ];

    return (
        <>
            <aside
                className={`fixed left-0 top-0 h-full w-64 flex flex-col p-4 border-r-4 border-outline/30 bg-background z-50 shadow-[4px_0_0_0_#1e1b4b] transition-transform duration-300 ease-in-out md:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"}`}
            >
                <div className="mb-8 flex items-center justify-between">
                        <h1 className="text-2xl font-black text-primary uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </h1>
                    <button
                        onClick={onClose}
                        className="md:hidden text-outline hover:text-on-surface"
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
                <div className="mt-auto pt-6 border-t border-outline/40 space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border-2 border-outline/40">
                            <div className="w-10 h-10 rounded-full bg-primary/20 border-2 border-primary/40 flex items-center justify-center shrink-0">
                                <span className="material-symbols-outlined text-primary text-xl">
                                school
                            </span>
                        </div>
                        <div className="min-w-0">
                            <p className="font-headline-md text-xs text-on-surface truncate">
                                {teacherName || "Faculty Member"}
                            </p>
                                <p className="text-[10px] text-outline uppercase font-black">
                                Academic Session
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/logout"
                        as="button"
                        method="POST"
                        className="w-full flex items-center justify-center gap-2 bg-surface-container-high text-on-surface px-3 lg:px-4 py-2 rounded-xl border-2 border-outline active:translate-y-0.5 transition-all font-black text-xs uppercase"
                        onClick={() => window.innerWidth < 768 && onClose()}
                    >
                        <span className="material-symbols-outlined text-lg">logout</span>
                        <span>Logout</span>
                    </Link>
                </div>
            </aside>
        </>
    );
}
