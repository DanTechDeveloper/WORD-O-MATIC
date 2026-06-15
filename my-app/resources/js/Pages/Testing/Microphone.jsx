import { useState, useEffect, useCallback } from "react";
import { useMicrophonePermission } from "@/hooks/Student/useMicrophonePermission";
import { useSpeechRecognition } from "@/hooks/Student/useWordSpeechRecognition";
import { useCountdown } from "@/hooks/Student/useCountdown";

export default function Microphone() {
    const { permissionState, requestPermission } = useMicrophonePermission();
    const [gameState, setGameState] = useState("IDLE"); // IDLE, COUNTDOWN, ACTIVE, GAMEOVER, COMPLETED, DENIED
    const [targetWord, setTargetWord] = useState("a");
    const [statusMessage, setStatusMessage] = useState("Ready");
    const [dropPosition, setDropPosition] = useState(0);

    const countdownValue = useCountdown(gameState, () =>
        setGameState("ACTIVE"),
    );

    const initiateGameStart = useCallback(async () => {
        if (permissionState === "granted") {
            setGameState("COUNTDOWN");
        } else if (permissionState === "prompt") {
            const granted = await requestPermission();
            if (granted) setGameState("COUNTDOWN");
            else setGameState("DENIED");
        } else if (permissionState === "denied") {
            setGameState("DENIED");
        }
    }, [permissionState, requestPermission]);

    // Auto-start logic katulad ng GameplayReadMode
    useEffect(() => {
        if (gameState === "IDLE") {
            initiateGameStart();
        }
    }, [gameState, initiateGameStart]);

    useEffect(() => {
        let interval;
        if (gameState === "ACTIVE") {
            interval = setInterval(() => {
                setDropPosition((prev) => {
                    if (prev >= 90) {
                        setGameState("GAMEOVER");
                        setStatusMessage("Missed! Word hit the floor.");
                        return 0;
                    }
                    return prev + 2;
                });
            }, 100);
        } else {
            setDropPosition(0);
        }
        return () => clearInterval(interval);
    }, [gameState]);

    const handleSuccess = () => {
        setGameState("COMPLETED");
        setStatusMessage(`Caught! You said: ${targetWord}`);
        setDropPosition(0);
    };

    useSpeechRecognition({
        isActive: gameState === "ACTIVE",
        isPaused: false,
        targetWord,
        onWordRecognized: handleSuccess,
        onMispronounced: (said) =>
            setStatusMessage(`Mispronounced. You said: "${said}". Try again.`),
        onRecognitionError: (error) => setStatusMessage(`Error: ${error}`),
        onPermissionDenied: () => setStatusMessage("Microphone access denied."),
    });

    return (
        <div className="p-8 max-w-md mx-auto space-y-6">
            <div className="border-b pb-4">
                <h1 className="text-xl font-bold">Microphone Test (Manual)</h1>
                <p className="text-sm text-gray-600">
                    Permission:{" "}
                    <span className="font-mono">{permissionState}</span>
                </p>
                <p className="text-sm text-gray-600">
                    Status:{" "}
                    <span className="font-semibold text-blue-600">
                        {statusMessage}
                    </span>
                </p>
            </div>

            <div className="relative h-80 bg-gray-100 border-2 border-dashed rounded-lg overflow-hidden flex flex-col items-center">
                {gameState === "COUNTDOWN" && (
                    <div className="mt-auto mb-auto text-6xl font-black text-primary animate-bounce">
                        {countdownValue}
                    </div>
                )}

                {gameState === "ACTIVE" && (
                    <div
                        className="absolute font-bold text-2xl text-blue-600 transition-all duration-100 ease-linear"
                        style={{ top: `${dropPosition}%` }}
                    >
                        {targetWord}
                    </div>
                )}
            </div>

            <div className="space-y-4">
                <input
                    type="text"
                    value={targetWord}
                    onChange={(e) => setTargetWord(e.target.value)}
                    placeholder="Enter target word"
                    className="w-full border rounded p-2 text-center"
                    disabled={
                        gameState !== "IDLE" &&
                        gameState !== "GAMEOVER" &&
                        gameState !== "COMPLETED"
                    }
                />

                <div className="grid grid-cols-1 gap-2">
                    {(gameState === "GAMEOVER" ||
                        gameState === "COMPLETED" ||
                        gameState === "DENIED") && (
                        <button
                            onClick={() => setGameState("IDLE")}
                            className="bg-blue-500 text-white p-3 rounded-xl font-bold uppercase tracking-wider shadow-lg hover:bg-blue-600 transition"
                        >
                            Try Again
                        </button>
                    )}
                </div>
            </div>
        </div>
    );
}
