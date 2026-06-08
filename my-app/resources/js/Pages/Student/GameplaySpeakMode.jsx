import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { useState, useEffect, useRef } from "react";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, DENIED
    const [countdownValue, setCountdownValue] = useState(3);
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
        if (gameState !== "ACTIVE") {
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
    }, [gameState, currentWordIndex]);

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

                <GameplayHeader
                    back={"speakModeLevels"}
                    level={`${module.level} - ${module.title}`}
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
