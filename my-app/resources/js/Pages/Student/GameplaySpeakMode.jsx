import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { useState, useEffect, useRef } from "react";
import { router } from "@inertiajs/react";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED
    const [countdownValue, setCountdownValue] = useState(3);

    // Settings and Audio State
    const [isSettingsOpen, setIsSettingsOpen] = useState(false);
    const [musicVolume, setMusicVolume] = useState(50);
    const [sfxVolume, setSfxVolume] = useState(70);

    const recognitionRef = useRef(null);
    // Split the content into individual words
    const words = module?.content ? module.content.split(/\s+/) : [];

    const handleNextWord = () => {
        setCurrentWordIndex((prev) => {
            const next = prev + 1;
            if (next >= words.length) {
                setGameState("IDLE");
            }
            return Math.min(next, words.length);
        });
    };

    const handleRestart = () => {
        window.location.reload();
    };

    const handleExit = () => {
        router.visit("/student/speakModeLevels");
    };

    const startProcess = async () => {
        try {
            await navigator.mediaDevices.getUserMedia({ audio: true });
            if (gameState === "DENIED") {
                window.location.reload();
            } else {
                setGameState("COUNTDOWN");
                setCountdownValue(3);
            }
        } catch (err) {
            setGameState("DENIED");
        }
    };

    useEffect(() => {
        const checkPermissionAndInit = async () => {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({
                        name: "microphone",
                    });
                    if (result.state === "granted") {
                        startProcess();
                    } else {
                        setGameState("DENIED");
                    }
                } catch (e) {
                    startProcess();
                }
            } else {
                startProcess();
            }
        };
        checkPermissionAndInit();
    }, []);

    // Countdown Logic
    useEffect(() => {
        if (gameState !== "COUNTDOWN") return;

        const timer = setInterval(() => {
            setCountdownValue((prev) => {
                if (prev === 3) return 2;
                if (prev === 2) return 1;
                if (prev === 1) return "GO!";
                if (prev === "GO!") {
                    clearInterval(timer);
                    setTimeout(() => setGameState("ACTIVE"), 800); // 0.8s buffer
                    return "GO!";
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    // Speech Recognition Logic
    useEffect(() => {
        if (gameState !== "ACTIVE" || isSettingsOpen) {
            if (recognitionRef.current) {
                recognitionRef.current.stop();
            }
            return;
        }

        const SpeechRecognition =
            window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRecognition) return;

        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = "en-US";

        recognition.onresult = (event) => {
            const lastResult =
                event.results[
                    event.results.length - 1
                ][0].transcript.toLowerCase();
            const currentTarget = words[currentWordIndex]
                ?.toLowerCase()
                .replace(/[^\w]/g, "");

            if (currentTarget && lastResult.includes(currentTarget)) {
                handleNextWord();
            }
        };

        recognition.onend = () => {
            if (gameState === "ACTIVE") recognition.start();
        };

        recognition.start();
        recognitionRef.current = recognition;

        return () => {
            if (recognitionRef.current) recognitionRef.current.stop();
        };
    }, [gameState, currentWordIndex, isSettingsOpen]);

    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                {/* Countdown Overlay */}
                {gameState === "COUNTDOWN" && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-2xl">
                        <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[150px] opacity-40 animate-pulse"></div>
                        <span className="relative z-10 text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                            {countdownValue}
                        </span>
                    </div>
                )}

                {/* Denied Modal -> Sonic Tech Card */}
                {gameState === "DENIED" && (
                    <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
                        {/* Dynamic Background Aura */}
                        <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[120px] opacity-30 animate-pulse"></div>

                        <div className="relative bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border-2 border-white/10 shadow-2xl max-w-md text-center overflow-hidden">
                            {/* Tech Decoration */}
                            <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                            <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/20 rounded-full blur-3xl"></div>

                            <div className="relative z-10">
                                <div className="w-24 h-24 bg-gradient-to-tr from-primary to-lime-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl ring-4 ring-white/10">
                                    <span className="material-symbols-outlined text-white text-5xl font-black">
                                        mic_off
                                    </span>
                                </div>

                                <h2 className="text-white text-4xl font-black uppercase italic mb-4 tracking-tighter">
                                    Sync Failure!
                                </h2>
                                <p className="text-white/70 text-lg font-bold mb-10 leading-relaxed">
                                    Microphone link is{" "}
                                    <span className="text-lime-400">
                                        offline
                                    </span>
                                    . Please authorize system access to continue
                                    word-smashing mission!
                                </p>
                                <button
                                    onClick={startProcess}
                                    className="w-full bg-lime-400 text-slate-950 text-2xl font-black py-6 rounded-2xl uppercase shadow-[0_10px_0_0_#1a2e05] active:translate-y-1 active:shadow-none transition-all duration-75"
                                >
                                    Allow Access
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* Settings Modal */}
                {isSettingsOpen && (
                    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
                        <div className="relative bg-on-background/10 border-2 border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden">
                            <h2 className="text-white text-5xl font-black uppercase italic mb-10 text-center tracking-tighter">
                                Paused
                            </h2>

                            {/* Audio Sliders */}
                            <div className="space-y-8 mb-12">
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-white/60 font-black uppercase tracking-widest text-xs">
                                        <span>Music Volume</span>
                                        <span className="text-lime-400">
                                            {musicVolume}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={musicVolume}
                                        onChange={(e) =>
                                            setMusicVolume(e.target.value)
                                        }
                                        className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                                    />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex justify-between items-center text-white/60 font-black uppercase tracking-widest text-xs">
                                        <span>Sound FX</span>
                                        <span className="text-fuchsia-400">
                                            {sfxVolume}%
                                        </span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={sfxVolume}
                                        onChange={(e) =>
                                            setSfxVolume(e.target.value)
                                        }
                                        className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex flex-col gap-4">
                                <button
                                    onClick={() => setIsSettingsOpen(false)}
                                    className="w-full bg-lime-400 text-slate-950 text-xl font-black py-5 rounded-2xl uppercase shadow-[0_6px_0_0_#1a2e05] active:translate-y-1 active:shadow-none transition-all"
                                >
                                    Resume Mission
                                </button>

                                <div className="grid grid-cols-2 gap-4">
                                    <button
                                        onClick={handleRestart}
                                        className="bg-white/5 border-2 border-white/10 text-white text-sm font-black py-4 rounded-2xl uppercase hover:bg-white/10 transition-all"
                                    >
                                        Restart
                                    </button>
                                    <button
                                        onClick={handleExit}
                                        className="bg-white/5 border-2 border-white/10 text-white text-sm font-black py-4 rounded-2xl uppercase hover:bg-white/10 transition-all"
                                    >
                                        Exit to Map
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <GameplayHeader
                    level={`${module.level} - ${module.title}`}
                    onOpenSettings={() => setIsSettingsOpen(true)}
                />

                <SpeakModeMainContent
                    words={words}
                    currentWordIndex={currentWordIndex}
                />

                <div>
                    <Microphone
                        onClick={gameState === "IDLE" ? startProcess : null}
                        isListening={gameState === "ACTIVE"}
                        disabled={gameState === "COUNTDOWN"}
                    />
                </div>
            </div>
        </>
    );
}
