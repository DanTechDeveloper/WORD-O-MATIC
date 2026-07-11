import { router } from "@inertiajs/react";

export default function SplashScreen() {
    const handleStart = () => {
        router.visit(route("student.avatarSelection"));
    };

    return (
        <div
            className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center cursor-pointer select-none overflow-hidden"
            onClick={handleStart}
        >
            <style>
                {`
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes pulse-slow {
                        0%, 100% { opacity: 0.2; }
                        50% { opacity: 0.4; }
                    }
                    .animate-scan {
                        animation: scan 4s linear infinite;
                    }
                    .animate-pulse-slow {
                        animation: pulse-slow 3s ease-in-out infinite;
                    }
                `}
            </style>

            {/* Sci-Fi Grid Background */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(209,188,255,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(209,188,255,0.04)_1px,transparent_1px)] bg-[size:32px_32px] pointer-events-none"></div>

            {/* Glowing Tech Ring/Circle in Center */}
            <div className="absolute w-[400px] h-[400px] md:w-[600px] md:h-[600px] rounded-full border border-primary/10 animate-pulse-slow pointer-events-none flex items-center justify-center">
                <div className="w-[80%] h-[80%] rounded-full border border-dashed border-primary/5"></div>
            </div>

            {/* Laser Scanning Line */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="w-full h-[2px] bg-primary/40 absolute animate-scan shadow-[0_0_20px_rgba(112,0,255,0.5)]"></div>
            </div>

            {/* Corner Bracket HUD Elements */}
            <div className="absolute top-8 left-8 w-12 h-12 border-t-2 border-l-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute top-8 right-8 w-12 h-12 border-t-2 border-r-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute bottom-8 left-8 w-12 h-12 border-b-2 border-l-2 border-primary/40 pointer-events-none"></div>
            <div className="absolute bottom-8 right-8 w-12 h-12 border-b-2 border-r-2 border-primary/40 pointer-events-none"></div>

            {/* Tech Telemetry Data (Sci-Fi Info Indicators) */}
            <div className="absolute top-8 left-24 font-mono text-[9px] text-primary/30 hidden md:block pointer-events-none tracking-widest uppercase">
                SYS.LOC // SECTOR_09 // GRID_ACTIVE
            </div>
            <div className="absolute top-8 right-24 font-mono text-[9px] text-primary/30 hidden md:block pointer-events-none tracking-widest uppercase text-right">
                SIGNAL_STRENGTH: 100% // ONLINE
            </div>

            {/* Main Interactive HUD Box */}
            <div className="relative z-10 text-center max-w-lg px-8 py-12 rounded-lg border border-primary/10 bg-background/80 backdrop-blur-md shadow-[0_0_50px_rgba(112,0,255,0.03)]">
                {/* Accent bracket indicators */}
                <div className="absolute -top-1 -left-1 w-3 h-3 border-t-2 border-l-2 border-primary"></div>
                <div className="absolute -top-1 -right-1 w-3 h-3 border-t-2 border-r-2 border-primary"></div>
                <div className="absolute -bottom-1 -left-1 w-3 h-3 border-b-2 border-l-2 border-primary"></div>
                <div className="absolute -bottom-1 -right-1 w-3 h-3 border-b-2 border-r-2 border-primary"></div>

                <div className="mb-2 font-mono text-xs text-primary/50 tracking-[0.4em] uppercase">
                    [ word processor system ]
                </div>

                <h1 className="text-primary text-5xl md:text-7xl font-black tracking-widest uppercase mb-4 drop-shadow-[0_0_12px_rgba(112,0,255,0.5)]">
                    WORD-O-MATIC
                </h1>

                <div className="h-[1px] w-1/2 bg-gradient-to-r from-transparent via-primary/30 to-transparent mx-auto mb-8"></div>

                <p className="text-on-surface-variant font-mono text-xs md:text-sm tracking-[0.25em] uppercase mb-12">
                    System Core: <span className="text-primary animate-pulse">Ready</span>
                </p>

                <div className="mt-6">
                    <span className="inline-block relative group">
                        {/* Pulse Ring */}
                        <span className="absolute -inset-1 rounded border border-primary/30 animate-ping opacity-75"></span>

                        <span className="relative text-primary text-base md:text-lg font-black uppercase tracking-[0.2em] border border-primary/50 bg-primary-container/20 px-8 py-4 rounded shadow-[0_0_15px_rgba(112,0,255,0.2)] group-hover:bg-primary group-hover:text-on-primary transition-all duration-300">
                            Tap To Start
                        </span>
                    </span>
                </div>
            </div>

            {/* Bottom Telemetry */}
            <div className="absolute bottom-8 left-24 font-mono text-[9px] text-primary/20 hidden md:block pointer-events-none tracking-widest uppercase">
                LATENCY // 0.00ms // BOOT_VER_2.6
            </div>
        </div>
    );
}
