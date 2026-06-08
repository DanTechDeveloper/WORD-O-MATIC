import { useState, useEffect } from "react";

export function useCountdown(gameState, onCountdownEnd) {
    const [countdownValue, setCountdownValue] = useState(3);

    useEffect(() => {
        if (gameState !== "COUNTDOWN") return;

        const timer = setInterval(() => {
            setCountdownValue((prev) => {
                if (prev === 3) return 2;
                if (prev === 2) return 1;
                if (prev === 1) return "GO!";
                if (prev === "GO!") {
                    clearInterval(timer);
                    setTimeout(() => onCountdownEnd(), 800); // 0.8s buffer
                    return "GO!";
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState, onCountdownEnd]);

    return countdownValue;
}
