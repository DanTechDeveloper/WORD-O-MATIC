import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Joyride, STATUS } from "react-joyride";

export default function Tutorial() {
    const { auth } = usePage().props;
    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [joyrideRun, setJoyrideRun] = useState(true);

    const handleJoyrideCallback = (data) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setJoyrideRun(false);
        }
    };

    const joyrideSteps = [
        {
            target: '[data-purpose="read-mode-selection"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">START WITH READ MODE!</p>
                    <p className="text-sm opacity-80">Click here to begin your adventure!</p>
                </div>
            ),
            placement: "right",
            disableBeacon: true,
        },
    ];

    return (
        <div className="m-0 p-0 overflow-hidden">
            {/* <!-- BEGIN: Main Background Container --> */}
            <main className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-zinc-950">
                {/* Header Overlay - Floating Title */}
                <div className="absolute top-10 left-0 right-0 z-30 flex justify-center pointer-events-none px-4">
                    <div className="bg-zinc-900/80 backdrop-blur-md border-2 border-zinc-800 px-8 py-3 rounded-2xl shadow-2xl">
                        <h1 className="text-white font-black uppercase tracking-tighter text-xl md:text-3xl text-center">
                            CHOOSE YOUR <span className="text-lime-400">MODE</span>
                        </h1>
                    </div>
                </div>

                {/* READ MODE - Left Half (Purple Theme) */}
                <Link
                    href="/student/read"
                    className="group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 border-b-4 md:border-b-0 md:border-r-4 border-zinc-900 relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-zinc-950"
                    data-purpose="read-mode-selection"
                >
                    {/* Video Grain/Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />
                    
                    <div className="z-20 text-center flex flex-col items-center">
                        {/* Large Play Button with Icon for Grade 1 Students */}
                        <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:border-purple-400/50 transition-all duration-500 relative">
                            <span className="absolute -top-4 -right-4 text-4xl">📖</span>
                            <svg className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>
                        
                        <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                            READ <span className="text-purple-500">MODE</span>
                        </h2>
                        <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                            Power up your visual recognition!
                        </p>
                    </div>

                    {/* Video Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                        <div className="h-full bg-purple-600 w-[65%] group-hover:w-full transition-all duration-1000 ease-out" />
                    </div>

                    <div className="absolute bottom-8 right-8 opacity-40 group-hover:opacity-100 transition-opacity text-purple-400 font-black tracking-widest text-xs">
                        PREVIEWING...
                    </div>
                </Link>

                {/* STORY MODE - Right Half (Lime Theme) */}
                <Link
                    href="/student/story"
                    className="group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 relative overflow-hidden bg-gradient-to-br from-lime-900/20 to-zinc-950"
                    data-purpose="story-mode-selection"
                >
                    {/* Video Grain/Texture Overlay */}
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                    <div className="z-20 text-center flex flex-col items-center">
                        {/* Large Play Button with Icon for Grade 1 Students */}
                        <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-lime-400/20 group-hover:border-lime-400/50 transition-all duration-500 relative">
                            <span className="absolute -top-4 -right-4 text-4xl">🎭</span>
                            <svg className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2" viewBox="0 0 24 24">
                                <path d="M8 5v14l11-7z" />
                            </svg>
                        </div>

                        <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                            STORY <span className="text-lime-400">MODE</span>
                        </h2>
                        <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                            Enter the Word-O-Matic adventure!
                        </p>
                    </div>

                    {/* Video Progress Bar */}
                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                        <div className="h-full bg-lime-400 w-[40%] group-hover:w-full transition-all duration-1000 ease-out" />
                    </div>

                    <div className="absolute bottom-8 right-8 opacity-40 group-hover:opacity-100 transition-opacity text-lime-400 font-black tracking-widest text-xs">
                        PREVIEWING...
                    </div>
                </Link>

                {/* Avatar Character (Full Body) - Desktop Only */}
                {bodyUrl && (
                    <div className="hidden md:block absolute right-0 bottom-0 z-50 pointer-events-none select-none">
                        <div className="relative">
                            <img
                                src={bodyUrl}
                                alt="Your Avatar"
                                className="h-screen w-auto object-contain drop-shadow-[0_0_80px_rgba(163,230,53,0.3)]"
                            />
                        </div>
                    </div>
                )}

                {/* CONTINUE TO DASHBOARD - Bottom Center Button */}
                <div className="absolute bottom-12 left-0 right-0 z-40 flex justify-center pointer-events-none">
                    <Link
                        href="/student/dashboard"
                        className="pointer-events-auto bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 text-white px-6 py-3 rounded-xl font-bold text-sm tracking-widest uppercase transition-all hover:scale-105 active:scale-95 flex items-center gap-3"
                    >
                        Continue to Dashboard
                        <span className="text-xl">🏠</span>
                    </Link>
                </div>
            </main>

            <Joyride
                steps={joyrideSteps}
                run={joyrideRun}
                callback={handleJoyrideCallback}
                continuous={true}
                showSkipButton={true}
                showProgress={false}
                styles={{
                    options: {
                        primaryColor: "#a3e635",
                        backgroundColor: "#18181b",
                        textColor: "#ffffff",
                        arrowColor: "#18181b",
                        overlayColor: "rgba(0, 0, 0, 0.5)",
                        zIndex: 1000,
                    },
                    tooltipContainer: {
                        textAlign: "left",
                    },
                    tooltipContent: {
                        padding: "12px 16px",
                    },
                    buttonNext: {
                        backgroundColor: "#a3e635",
                        color: "#09090b",
                        fontWeight: 900,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        borderRadius: "12px",
                        padding: "8px 20px",
                        fontSize: "14px",
                        borderBottom: "3px solid #4d7c0f",
                    },
                    buttonSkip: {
                        color: "#a1a1aa",
                        fontWeight: 700,
                        textTransform: "uppercase",
                        fontSize: "12px",
                    },
                    buttonBack: {
                        color: "#a1a1aa",
                        fontWeight: 700,
                    },
                }}
            />
        </div>
    );
}