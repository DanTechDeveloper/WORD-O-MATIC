import { useState, useRef, useEffect } from "react";
import { usePage, Link } from "@inertiajs/react";
import Sidebar from "../../Components/Teacher/Sidebar";

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);
    const [showNotifs, setShowNotifs] = useState(false);
    const notifRef = useRef();

    const { teacher } = usePage().props;
    const alerts = teacher ? [
        ...(!teacher.has_deadline ? [{ msg: "No report deadline set", href: "/teacher/reports", icon: "event" }] : []),
        ...(!teacher.has_word_modules ? [{ msg: "No Word Blast modules yet", href: "/teacher/word", icon: "book" }] : []),
        ...(!teacher.has_paragraph_modules ? [{ msg: "No Story Quest modules yet", href: "/teacher/paragraph", icon: "menu_book" }] : []),
    ] : [];
    const hasAlerts = alerts.length > 0;

    useEffect(() => {
        const handleClick = (e) => {
            if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifs(false);
        };
        document.addEventListener("mousedown", handleClick);
        return () => document.removeEventListener("mousedown", handleClick);
    }, []);

    return (
        <>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-background/80 z-40 md:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <header                 className="fixed top-0 right-0 left-0 md:left-64 h-20 flex items-center justify-between px-4 md:px-8 z-40 bg-background border-b-4 border-outline/30 shadow-[0_4px_0_0_#1e1b4b]">
                <div className="flex items-center gap-4 w-full md:w-1/3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 text-on-surface-variant/60 hover:text-primary active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="relative w-full hidden md:block">
                        <span                             className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-outline">
                            search
                        </span>
                        <input
                            className="w-full bg-surface-container-lowest border-2 border-outline/40 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-secondary-container focus:border-secondary-container text-sm font-body-md text-on-surface transition-all"
                            placeholder="Search the galaxy..."
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-on-surface-variant/60">
                        <div ref={notifRef} className="relative">
                                <button onClick={() => setShowNotifs(!showNotifs)} className="relative hover:text-primary active:scale-95 transition-all">
                                <span className="material-symbols-outlined">notifications</span>
                                {hasAlerts && (
                                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-error rounded-full border-2 border-background" />
                                )}
                            </button>
                            {showNotifs && (
                                <div className="absolute top-full right-0 mt-2 w-80 bg-surface-container-high border-2 border-outline/40 rounded-2xl shadow-[8px_8px_0_0_#1e1b4b] overflow-hidden z-50">
                                    <div className="p-4 border-b-2 border-outline/40">
                                    <p className="font-black text-sm text-on-surface uppercase tracking-widest">Alerts</p>
                                </div>
                                {alerts.length === 0 ? (
                                    <div className="p-6 text-center text-on-surface-variant text-sm font-bold">All good!</div>
                                ) : (
                                        <div className="divide-y divide-outline/30">
                                        {alerts.map((a, i) => (
                                                <Link key={i} href={a.href} className="flex items-center gap-3 p-4 hover:bg-surface-container-low/60 transition-colors" onClick={() => setShowNotifs(false)}>
                                                <span className="material-symbols-outlined text-secondary-container">{a.icon}</span>
                                                <p className="text-sm font-bold text-on-surface-variant">{a.msg}</p>
                                            </Link>
                                        ))}
                                    </div>
                                )}
                                    <div className="p-3 border-t-2 border-outline/40 text-center">
                                        <Link href="/teacher/reports" className="text-xs font-bold text-primary hover:text-primary-fixed uppercase tracking-widest" onClick={() => setShowNotifs(false)}>
                                        View All
                                    </Link>
                                </div>
                                </div>
                            )}
                        </div>
                    </div>
                        <div className="flex items-center gap-3 pl-3 md:pl-6 border-l-2 border-outline/25">
                            <span className="hidden lg:inline font-headline-md text-sm font-bold tracking-tight text-on-surface">
                            WORD-O-MATIC Dashboard
                        </span>
                     
                    </div>
                </div>
            </header>
            <main className="md:ml-64 pt-28 pb-12 px-4 md:px-8 min-h-screen bg-background">
                {children}
            </main>
        </>
    );
}
