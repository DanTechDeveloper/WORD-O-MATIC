import { Link, usePage } from '@inertiajs/react';

export default function Sidebar() {
    const { url } = usePage();

    const activeClass = "bg-lime-400 text-slate-950 border-2 border-slate-950 shadow-[6px_6px_0_0_#3f6212] flex items-center gap-3 p-4 rounded-lg font-black font-lexend text-xs uppercase tracking-wider translate-x-[-2px] translate-y-[-2px]";
    const inactiveClass = "text-slate-400 p-4 flex items-center gap-3 hover:text-purple-400 hover:translate-x-1 hover:bg-slate-900/50 transition-all font-black font-lexend text-xs uppercase tracking-wider";

    return (
        <>
            <aside className="fixed left-0 top-0 h-full w-64 flex flex-col p-4 border-r-4 border-slate-900 bg-slate-950 z-50 shadow-[4px_0_0_0_#1e1b4b]">
                <div className="mb-8">
                    <h1 className="text-2xl font-black text-purple-500 uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </h1>
                </div>
                <nav className="flex-1 space-y-2">
                    <Link
                        className={url === '/teacher/dashboard' ? activeClass : inactiveClass}
                        href="/teacher/dashboard"
                    >
                        <span
                            className="material-symbols-outlined"
                            data-weight={url === '/teacher/dashboard' ? "fill" : ""}
                        >
                            dashboard
                        </span>
                        Dashboard
                    </Link>
                    <Link
                        className={url === '/teacher/students' ? activeClass : inactiveClass}
                        href="/teacher/students"
                    >
                        <span className="material-symbols-outlined" data-weight={url === '/teacher/students' ? "fill" : ""}>
                            group
                        </span>
                        Students
                    </Link>
                    <Link
                        className={url === '/teacher/reports' ? activeClass : inactiveClass}
                        href="/teacher/reports"
                    >
                        <span className="material-symbols-outlined" data-weight={url === '/teacher/reports' ? "fill" : ""}>
                            error
                        </span>
                        Reports
                    </Link>
                </nav>
                <div className="mt-auto pt-6 border-t border-slate-900 space-y-4">
                    <div className="flex items-center gap-3 p-2 bg-surface-container-low rounded-xl border-2 border-slate-900">
                        <img
                            alt="Robot Assistant"
                            className="w-10 h-10 rounded-full border-2 border-primary"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuDkJBlY-tbUv6KRQhxs9bCk6UOZ6lhk8KWzuzglRduGBOcF-rM6MrGKR9SQibk9T4cxhHQ2j5acOtReU829kBe2n5qIOcEYn8HlUBCYj33A2kZyqw-I1JsPf_36atkx5dAu-sCb2yP1381MBsN7anYHhaVa6ZHh5p5s1SDrL6aS-z-GOyfs4x3ulxijHsbuiH37ObN6QWN1x_yEZN6zaBdZd6MMpO-SccJOWJLjDWLZs4TFr6hoK7-DDCw4XzI6p3wJhy90kz2JDdB3"
                        />
                        <div>
                            <p className="font-headline-md text-xs text-on-surface">
                                Professor Bot
                            </p>
                            <p className="text-[10px] text-slate-500 uppercase font-black">
                                Galaxy Sector 7
                            </p>
                        </div>
                    </div>

                    <Link
                        href="/teacher/login"
                        as="button"
                        className="w-full flex items-center justify-center gap-2 p-3 bg-rose-500 text-slate-950 rounded-xl border-2 border-slate-950 shadow-[4px_4px_0_0_#4c0519] font-black font-lexend text-xs uppercase tracking-wider hover:translate-x-[2px] hover:translate-y-[2px] hover:shadow-none transition-all"
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
