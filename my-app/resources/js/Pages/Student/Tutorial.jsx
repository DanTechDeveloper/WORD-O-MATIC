import { Link, usePage } from "@inertiajs/react";
import { useState } from "react";
import { Joyride, STATUS } from "react-joyride"; // Fixed import: Joyride is a default export, not named

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
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        START WITH READ MODE!
                    </p>
                    <p className="text-sm opacity-80">
                        Click here to begin your adventure!
                    </p>
                </div>
            ),
            placement: "auto", // Better fallback for mobile and desktop split-screens
            spotlightPadding: 20,
        },
    ];

    return (
        <div className="m-0 p-0 overflow-hidden select-none">
            <Joyride
                run={joyrideRun}
                callback={handleJoyrideCallback}
                steps={joyrideSteps}
                continuous
                disableOverlayClose
                disableCloseOnOutsideClick
                showSkipButton
                showProgress
                styles={{
                    // 👇 IDAGDAG ITONG BEACON PROPERTY NA ITO:
                    beacon: {
                        background: "transparent",
                    },
                    beaconInner: {
                        backgroundColor: "#ffffff", // Puti ang gitna ng hint
                    },
                    beaconOuter: {
                        backgroundColor: "rgba(255, 255, 255, 0.4)", // Puti ang outer ripple halo
                        borderColor: "#ffffff",
                        borderWidth: "2px",
                    },
                    options: {
                        arrowColor: "#1e1b4b",
                        overlayColor: "rgba(0,0,0,0.6)", // Marginally darker for better focus
                        zIndex: 10000,
                    },
                    tooltip: {
                        backgroundColor: "#1e1b4b",
                        borderRadius: "1.5rem",
                        padding: "2rem",
                        fontSize: "1.125rem",
                        color: "#ffffff",
                    },
                    tooltipContainer: {
                        textAlign: "left",
                    },
                    tooltipContent: {
                        padding: 0,
                        fontSize: "1.125rem",
                        lineHeight: "1.6",
                        color: "#ffffff",
                    },
                    buttonNext: {
                        backgroundColor: "#7c3aed",
                        borderRadius: "0.75rem",
                        fontSize: "1rem",
                        fontWeight: 700,
                        padding: "0.75rem 1.5rem",
                        color: "#fff",
                    },
                    buttonBack: {
                        fontSize: "1rem",
                        fontWeight: 600,
                        color: "#a78bfa",
                    },
                    buttonSkip: {
                        fontSize: "0.875rem",
                        fontWeight: 600,
                        color: "#9ca3af",
                    },
                }}
            />

            <main className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-zinc-950">
                {/* READ MODE */}
                <Link
                    href="/student/read"
                    className="group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 border-b-4 md:border-b-0 md:border-r-4 border-zinc-900 relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-zinc-950"
                    data-purpose="read-mode-selection"
                >
                    <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                    <div className="z-20 text-center flex flex-col items-center">
                        <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center group-hover:scale-110 group-hover:bg-purple-500/20 group-hover:border-purple-400/50 transition-all duration-500 relative">
                            <span className="absolute -top-4 -right-4 text-4xl">
                                📖
                            </span>
                            <svg
                                className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2"
                                viewBox="0 0 24 24"
                            >
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

                    <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                        <div className="h-full bg-purple-600 w-[65%] group-hover:w-full transition-all duration-1000 ease-out" />
                    </div>
                </Link>

                {/* STORY MODE (Conditional Link Wrapper to prevent unintended navigation) */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={joyrideRun ? undefined : "/student/story"}
                        as={joyrideRun ? "div" : "a"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 bg-gradient-to-br from-lime-900/20 to-zinc-950 ${joyrideRun ? "cursor-not-allowed" : ""}`}
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        <div className="z-20 text-center flex flex-col items-center">
                            <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center group-hover:not-disabled:scale-110 transition-all duration-500 relative">
                                <span className="absolute -top-4 -right-4 text-4xl">
                                    🎭
                                </span>
                                <svg
                                    className="w-12 h-12 md:w-16 md:h-16 text-white fill-current ml-2"
                                    viewBox="0 0 24 24"
                                >
                                    <path d="M8 5v14l11-7z" />
                                </svg>
                            </div>

                            <h2 className="text-white text-5xl md:text-7xl lg:text-8xl font-black italic uppercase tracking-tighter mb-4">
                                STORY{" "}
                                <span className="text-lime-400">MODE</span>
                            </h2>
                            <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                Enter the Word-O-Matic adventure!
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                            <div className="h-full bg-lime-400 w-[40%] group-hover:w-full transition-all duration-1000 ease-out" />
                        </div>
                    </Link>

                    {/* Tutorial Lock Overlay - Moved outside link structure */}
                    {joyrideRun && (
                        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto">
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Locked During Tutorial 🔒
                            </span>
                        </div>
                    )}
                </div>

                {/* Avatar Character - Tamed dimensions and optimized scaling */}
                {bodyUrl && (
                    <div className="hidden lg:block absolute right-4 bottom-0 z-50 pointer-events-none select-none max-w-[25vw] max-h-[50vh]">
                        <div className="relative w-full h-full">
                            {/* Speech Bubble */}
                            <div className="absolute bottom-full right-4 mb-4 z-[60]">
                                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-2xl border-2 border-lime-400 min-w-[200px]">
                                    <p className="text-zinc-900 font-black text-lg uppercase tracking-tight leading-tight">
                                        Ready To Learn?
                                        <br />
                                        Start with{" "}
                                        <span className="text-purple-600">
                                            Read Mode!
                                        </span>
                                    </p>
                                    <div className="absolute -bottom-[14px] right-6 w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white/95" />
                                </div>
                            </div>
                            {/* Half Body Image */}
                            <img
                                src={bodyUrl}
                                alt="Your Avatar"
                                className="w-full h-auto object-contain drop-shadow-[0_0_40px_rgba(163,230,53,0.2)]"
                            />
                        </div>
                    </div>
                )}

                {/* CONTINUE TO DASHBOARD */}
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
        </div>
    );
}
