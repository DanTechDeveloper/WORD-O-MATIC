import { Link, router, usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";
import { Joyride, STATUS } from "react-joyride";

export default function Tutorial() {
    const { auth } = usePage().props;
    const params = new URLSearchParams(window.location.search);
    const practiceDone = params.get("practiceDone") === "1";

    const avatarUrl = auth?.user?.student?.avatar;
    const bodyUrl = avatarUrl?.replace("/head.png", "/body.png");

    const [joyrideRun, setJoyrideRun] = useState(!practiceDone);
    const [joyrideStepIndex, setJoyrideStepIndex] = useState(0);
    const [storyJoyrideRun, setStoryJoyrideRun] = useState(false);
    const advanceTimerRef = useRef(null);

    const joyrideSteps = [
        {
            target: '[data-purpose="avatar-speech"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        MEET YOUR GUIDE!
                    </p>
                    <p className="text-sm opacity-80">
                        This is your robot buddy! They'll cheer you on through
                        every level.
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 10,
        },
        {
            target: '[data-purpose="read-mode-selection"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        START WITH WORD BLAST MODE!
                    </p>
                    <p className="text-sm opacity-80">
                        Click here to begin your adventure! Power up your visual
                        word recognition.
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 20,
        },
        {
            target: '[data-purpose="story-mode-locked"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        STORY QUEST - LOCKED!
                    </p>
                    <p className="text-sm opacity-80">
                        Complete this tutorial first to unlock the Word-O-Matic
                        adventure mode.
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 20,
        },
    ];

    const storyJoyrideSteps = [
        {
            target: '[data-purpose="story-mode-unlocked"]',
            content: (
                <div>
                    <p className="text-xl font-black uppercase tracking-tight mb-2">
                        STORY QUEST UNLOCKED!
                    </p>
                    <p className="text-sm opacity-80">
                        Click here to start your Story Quest adventure! Read
                        sentences aloud and complete the story!
                    </p>
                </div>
            ),
            placement: "auto",
            spotlightPadding: 20,
        },
    ];

    useEffect(() => {
        if (!joyrideRun) return;
        advanceTimerRef.current = setTimeout(() => {
            if (joyrideStepIndex < joyrideSteps.length - 1) {
                setJoyrideStepIndex(joyrideStepIndex + 1);
            } else {
                setJoyrideRun(false);
            }
        }, 4000);
        return () => clearTimeout(advanceTimerRef.current);
    }, [joyrideStepIndex, joyrideRun, joyrideSteps.length]);

    const handleJoyrideCallback = (data) => {
        const { status, index } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setJoyrideRun(false);
            return;
        }
        if (typeof index === "number") {
            setJoyrideStepIndex(index);
        }
    };

    useEffect(() => {
        if (!storyJoyrideRun) return;
        const timer = setTimeout(() => setStoryJoyrideRun(false), 4000);
        return () => clearTimeout(timer);
    }, [storyJoyrideRun]);

    const handleStoryJoyrideCallback = (data) => {
        const { status } = data;
        if (status === STATUS.FINISHED || status === STATUS.SKIPPED) {
            setStoryJoyrideRun(false);
        }
    };

    useEffect(() => {
        if (practiceDone) {
            const timer = setTimeout(() => setStoryJoyrideRun(true), 1500);
            return () => clearTimeout(timer);
        }
    }, [practiceDone]);

    const sharedJoyrideStyles = {
        beacon: {
            position: "fixed",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 10001,
        },
        beaconInner: {
            backgroundColor: "#ffffff",
        },
        beaconOuter: {
            backgroundColor: "rgba(255, 255, 255, 0.4)",
            borderColor: "#ffffff",
            borderWidth: "2px",
        },
        options: {
            arrowColor: "#1e1b4b",
            overlayColor: "rgba(0,0,0,0.85)",
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
    };

    return (
        <div className="m-0 p-0 overflow-hidden select-none">
            {joyrideRun && !practiceDone && (
                <Joyride
                    run={joyrideRun}
                    stepIndex={joyrideStepIndex}
                    callback={handleJoyrideCallback}
                    steps={joyrideSteps}
                    disableBeacon
                    continuous
                    hideBackButton
                    disableOverlayClose
                    disableCloseOnOutsideClick
                    showProgress
                    styles={sharedJoyrideStyles}
                />
            )}

            {storyJoyrideRun && practiceDone && (
                <Joyride
                    run={storyJoyrideRun}
                    callback={handleStoryJoyrideCallback}
                    steps={storyJoyrideSteps}
                    disableBeacon
                    hideBackButton
                    disableOverlayClose
                    disableCloseOnOutsideClick
                    styles={sharedJoyrideStyles}
                />
            )}

            <main className="min-h-screen w-full flex flex-col md:flex-row relative overflow-hidden bg-zinc-950">
                {/* WORD BLAST MODE */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={practiceDone ? undefined : "/student/practice-read"}
                        as={practiceDone ? "div" : "a"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 border-b-4 md:border-b-0 md:border-r-4 border-zinc-900 relative overflow-hidden bg-gradient-to-br from-purple-900/40 to-zinc-950 ${practiceDone ? "cursor-not-allowed" : ""}`}
                        data-purpose={practiceDone ? "read-mode-locked" : "read-mode-selection"}
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        <div className="z-20 text-center flex flex-col items-center">
                            <div className="mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center transition-all duration-500 relative">
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
                                WORD BLAST{" "}
                                <span className="text-purple-500">MODE</span>
                            </h2>
                            <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Practice complete!"
                                    : "Power up your visual recognition!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                            <div
                                className={`h-full bg-purple-600 transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[65%] group-hover:w-full"}`}
                                data-purpose="read-mode-progress"
                            />
                        </div>
                    </Link>

                    {practiceDone && (
                        <div
                            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="read-mode-locked"
                        >
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Complete ✅
                            </span>
                        </div>
                    )}
                </div>

                {/* STORY QUEST MODE */}
                <div className="flex-1 flex relative overflow-hidden">
                    <Link
                        href={
                            practiceDone
                                ? "/student/gameplaySpeakMode/1"
                                : undefined
                        }
                        as={practiceDone ? "a" : "div"}
                        className={`group flex-1 flex flex-col items-center justify-center p-8 transition-all duration-500 bg-gradient-to-br from-lime-900/20 to-zinc-950 ${practiceDone ? "" : "cursor-not-allowed"}`}
                        data-purpose={
                            practiceDone
                                ? "story-mode-unlocked"
                                : "story-mode-locked"
                        }
                    >
                        <div className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]" />

                        <div className="z-20 text-center flex flex-col items-center">
                            <div
                                className={`mb-8 w-28 h-28 md:w-40 md:h-40 rounded-full bg-white/10 backdrop-blur-md border-2 border-white/20 flex items-center justify-center transition-all duration-500 relative ${practiceDone ? "group-hover:scale-110" : ""}`}
                            >
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
                                STORY QUEST{" "}
                                <span className="text-lime-400">MODE</span>
                            </h2>
                            <p className="text-zinc-400 text-lg md:text-2xl font-bold uppercase tracking-[0.2em] max-w-sm">
                                {practiceDone
                                    ? "Unlocked! Start your adventure!"
                                    : "Enter the Word-O-Matic adventure!"}
                            </p>
                        </div>

                        <div className="absolute bottom-0 left-0 right-0 h-2 bg-zinc-900/80">
                            <div
                                className={`h-full bg-lime-400 transition-all duration-1000 ease-out ${practiceDone ? "w-full" : "w-[40%] group-hover:w-full"}`}
                            />
                        </div>
                    </Link>

                    {!practiceDone && (
                        <div
                            className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[6px] flex flex-col items-center justify-center pointer-events-auto"
                            data-purpose="story-mode-locked"
                        >
                            <span className="text-white text-xs font-black tracking-widest uppercase bg-zinc-900 px-4 py-2 rounded-full border border-zinc-800">
                                Locked During Tutorial 🔒
                            </span>
                        </div>
                    )}
                </div>

                {/* Avatar */}
                {bodyUrl && (
                    <div
                        className={`hidden lg:block absolute bottom-0 z-50 pointer-events-none select-none max-w-[25vw] max-h-[55vh] ${practiceDone ? "left-4" : "right-4"}`}
                        data-purpose="avatar-speech"
                    >
                        <div className="relative w-full h-full">
                            <div
                                className={`absolute bottom-full mb-4 z-[60] ${practiceDone ? "left-4" : "right-4"}`}
                            >
                                <div className="relative bg-white/95 backdrop-blur-sm rounded-2xl px-5 py-3 shadow-2xl border-2 border-lime-400 min-w-[200px]">
                                    {practiceDone ? (
                                        <p className="text-zinc-900 font-black text-lg uppercase tracking-tight leading-tight">
                                            Great Job!{" "}
                                            <br />
                                            Try{" "}
                                            <span className="text-lime-600">
                                                Story Quest
                                            </span>{" "}
                                            Next!
                                        </p>
                                    ) : (
                                        <p className="text-zinc-900 font-black text-lg uppercase tracking-tight leading-tight">
                                            Ready To Learn?
                                            <br />
                                            Start with{" "}
                                            <span className="text-purple-600">
                                                Word Blast Mode!
                                            </span>
                                        </p>
                                    )}
                                    <div
                                        className={`absolute -bottom-[14px] w-0 h-0 border-l-[10px] border-r-[10px] border-t-[14px] border-l-transparent border-r-transparent border-t-white/95 ${practiceDone ? "left-6" : "right-6"}`}
                                    />
                                </div>
                            </div>
                            <img
                                src={bodyUrl}
                                alt="Your Avatar"
                                className="w-full h-auto object-contain drop-shadow-[0_0_40px_rgba(163,230,53,0.2)]"
                            />
                        </div>
                    </div>
                )}

                {/* CONTINUE TO DASHBOARD */}
                <div
                    className="absolute bottom-12 left-0 right-0 z-40 flex justify-center pointer-events-none"
                    data-purpose="continue-dashboard"
                >
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
