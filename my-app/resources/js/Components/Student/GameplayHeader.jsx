import { Link } from "@inertiajs/react";

export default function GameplayHeader({navPage}) {
    return (
        <div className="mt-6 w-full max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-6 mb-12">
            <div className="flex items-center gap-6">
                {/* <!-- Back Button --> */}
                <Link
                    href={`/student/${navPage}`}
                    className="group flex items-center justify-center w-16 h-16 bg-on-background/5 backdrop-blur-md rounded-2xl border-2 border-on-background/10 shadow-2xl hover:bg-on-background/10 transition-all active:scale-95"
                >
                    <span className="material-symbols-outlined text-on-background/80 group-hover:text-on-background text-3xl">
                        arrow_back
                    </span>
                </Link>

                {/* <!-- Score Tracker --> */}
                <div className="flex items-center gap-4 bg-on-background/5 backdrop-blur-md p-4 rounded-2xl border-2 border-on-background/10 shadow-2xl">
                    <div className="bg-primary p-2 rounded-xl flex items-center justify-center shadow-[0_0_15px_rgba(var(--primary-rgb),0.5)]">
                        <span className="material-symbols-outlined text-on-primary text-3xl">
                            sword_rose
                        </span>
                    </div>
                    <div>
                        <p className="text-on-background/60 text-xs font-black uppercase tracking-widest leading-none mb-1">
                            Words Smashed
                        </p>
                        <p className="text-on-background text-3xl font-black leading-none italic">
                            1,240
                        </p>
                    </div>
                </div>
            </div>

            {/* <!-- Level Info --> */}
            <div className="hidden lg:flex flex-col items-center">
                <div className="bg-on-background/10 backdrop-blur-sm px-8 py-2 rounded-full border-2 border-on-background/20 mb-2 shadow-lg">
                    <span className="text-on-background font-black tracking-tight text-sm italic uppercase">
                        LEVEL 5: LEXICAL LEGEND
                    </span>
                </div>
            
            </div>
            {/* <!-- Energy / Timer Bar --> */}
            <div className="w-full md:w-80 flex flex-col gap-2 bg-on-background/5 backdrop-blur-md p-4 rounded-2xl border-2 border-on-background/10 shadow-2xl">
                <div className="flex justify-between items-end">
                    <p className="text-on-background/60 text-xs font-black uppercase tracking-widest leading-none">
                        Energy / Timer
                    </p>
                    <p className="text-lime-400 text-xs font-black leading-none uppercase animate-pulse">
                        🚀 Hyper-Drive!
                    </p>
                </div>
                <div className="h-4 w-full bg-on-background/10 rounded-full overflow-hidden border-2 border-on-background/5 p-0.5">
                    <div
                        className="h-full bg-gradient-to-r from-primary via-fuchsia-500 to-lime-400 rounded-full shadow-[0_0_15px_rgba(132,204,22,0.4)]"
                        style={{ width: "75%" }}
                    ></div>
                </div>
            </div>
        </div>
    );
}
