import { router } from "@inertiajs/react";

export default function SplashScreen() {
    const handleStart = () => {
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center cursor-pointer select-none"
            onClick={handleStart}
        >
            <style>
                {`
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes flicker {
                        0% { opacity: 1; }
                        50% { opacity: 0.8; }
                        100% { opacity: 1; }
                    }
                    .animate-scan {
                        animation: scan 3s linear infinite;
                    }
                    .animate-flicker {
                        animation: flicker 0.1s infinite;
                    }
                `}
            </style>

            <div className="absolute inset-0 pointer-events-none overflow-hidden">
                <div className="w-full h-1 bg-lime-400/20 absolute animate-scan shadow-[0_0_15px_rgba(163,230,53,0.5)]"></div>
            </div>

            <div className="text-center animate-flicker">
                <h2 className="text-lime-400 text-6xl md:text-8xl font-black italic tracking-tighter mb-4">
                    WORD-O-MATIC
                </h2>
                <p className="text-white font-mono tracking-[0.5em] text-sm md:text-lg uppercase opacity-70 mb-12">
                    System Ready
                </p>

                <div className="mt-8">
                    <span className="text-lime-400 text-xl md:text-2xl font-black uppercase tracking-widest animate-pulse border-2 border-lime-400 px-6 py-3 rounded-lg">
                        Tap To Start
                    </span>
                </div>
            </div>
        </div>
    );
}
