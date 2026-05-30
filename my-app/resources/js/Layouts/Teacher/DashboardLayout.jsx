import Sidebar from "../../Components/Teacher/Sidebar";
export default function DashboardLayout({ children }) {
    return (
        <>
          <Sidebar/>
            <header class="fixed top-0 right-0 left-64 h-20 flex items-center justify-between px-8 z-40 bg-slate-950 border-b-4 border-slate-900 shadow-[0_4px_0_0_#1e1b4b]">
                <div class="flex items-center gap-4 w-1/3">
                    <div class="relative w-full">
                        <span class="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">
                            search
                        </span>
                        <input
                            class="w-full bg-surface-container-lowest border-2 border-slate-900 rounded-lg py-2 pl-10 pr-4 focus:ring-2 focus:ring-secondary focus:border-secondary text-sm font-body-md text-on-surface transition-all"
                            placeholder="Search the galaxy..."
                            type="text"
                        />
                    </div>
                </div>
                <div class="flex items-center gap-6">
                    <div class="flex items-center gap-4 text-slate-400">
                        <span class="material-symbols-outlined hover:text-purple-400 cursor-pointer active:scale-95 transition-all">
                            notifications
                        </span>
                        <span class="material-symbols-outlined hover:text-purple-400 cursor-pointer active:scale-95 transition-all">
                            settings
                        </span>
                    </div>
                    <div class="flex items-center gap-3 pl-6 border-l-2 border-slate-900">
                        <span class="font-lexend text-sm font-bold tracking-tight text-on-surface">
                            WORD-O-MATIC Dashboard
                        </span>
                        <img
                            alt="Teacher Avatar"
                            class="w-10 h-10 rounded-full border-2 border-lime-400 shadow-[2px_2px_0_0_#1e1b4b]"
                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuD-aAdAygbsmdnYFpAJlBlYH_jBeRdTzzJavuoVIUGTfLwRk_UZSL-Q8wOw3157urqXZN-xKQvc13Fdf5lxyGDT7qOdhwkNn6s9-yUL_4GIU-dKjABZnxqzTXE8MKYWRJWCytbZg6XU36uAw6eyH9q6hkFJ27qcPCc3lLIbDP0CR7gYjBrkt6YjLKEAPGHBUZxHRmpffZfcNdD4IwKDu-pqquLhcMTYXMIuTQ9Xh-7wlzk6-15ADPSzkhft2EcVUfK0Ftol66reTRpL"
                        />
                    </div>
                </div>
            </header>
            <main class="ml-64 pt-28 pb-12 px-8 min-h-screen bg-slate-950">
                {children}
            </main>
        </>
    );
}
