import { useState } from "react";
import Sidebar from "../../Components/Teacher/Sidebar";

export default function DashboardLayout({ children }) {
    const [isSidebarOpen, setSidebarOpen] = useState(false);

    return (
        <>
            <Sidebar
                isOpen={isSidebarOpen}
                onClose={() => setSidebarOpen(false)}
            />

            {/* Mobile Backdrop */}
            {isSidebarOpen && (
                <div
                    className="fixed inset-0 bg-slate-950/80 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            <header className="fixed top-0 right-0 left-0 md:left-64 h-20 flex items-center justify-between px-4 md:px-8 z-40 bg-slate-950 border-b-4 border-slate-900 shadow-[0_4px_0_0_#1e1b4b]">
                <div className="flex items-center gap-4 w-full md:w-1/3">
                    <button
                        onClick={() => setSidebarOpen(true)}
                        className="md:hidden p-2 text-slate-400 hover:text-purple-400 active:scale-95 transition-all"
                    >
                        <span className="material-symbols-outlined">menu</span>
                    </button>
                    <div className="relative w-full hidden md:block">
                        <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            search
                        </span>
                        <input
                            className="w-full bg-surface-container-lowest border-2 border-slate-900 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-secondary focus:border-secondary text-sm font-body-md text-on-surface transition-all"
                            placeholder="Search the galaxy..."
                            type="text"
                        />
                    </div>
                </div>
                <div className="flex items-center gap-3 md:gap-6">
                    <div className="hidden sm:flex items-center gap-4 text-slate-400">
                        <span className="material-symbols-outlined hover:text-purple-400 cursor-pointer active:scale-95 transition-all">
                            notifications
                        </span>
                    </div>
                    <div className="flex items-center gap-3 pl-3 md:pl-6 border-l-2 border-slate-900">
                        <span className="hidden lg:inline font-lexend text-sm font-bold tracking-tight text-on-surface">
                            WORD-O-MATIC Dashboard
                        </span>
                        <img
                            alt="Teacher Avatar"
                            className="w-8 h-8 md:w-10 md:h-10 rounded-full border-2 border-lime-400 shadow-[2px_2px_0_0_#1e1b4b]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-aAdAygbsmdnYFpAJlBlYH_jBeRdTzzJavuoVIUGTfLwRk_UZSL-Q8wOw3157urqXZN-xKQvc13Fdf5lxyGDT7qOdhwkNn6s9-yUL_4GIU-dKjABZnxqzTXE8MKYWRJWCytbZg6XU36uAw6eyH9q6hkFJ27qcPCc3lLIbDP0CR7gYjBrkt6YjLKEAPGHBUZxHRmpffZfcNdD4IwKDu-pqquLhcMTYXMIuTQ9Xh-7wlzk6-15ADPSzkhft2EcVUfK0Ftol66reTRpL"
                        />
                    </div>
                </div>
            </header>
            <main className="md:ml-64 pt-28 pb-12 px-4 md:px-8 min-h-screen bg-slate-950">
                {children}
            </main>
        </>
    );
}
