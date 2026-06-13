import { useState, useEffect, useRef } from "react";

export function useCountdown(gameState, onCountdownEnd) {
    const [countdownValue, setCountdownValue] = useState(3);
    const onCountdownEndRef = useRef(onCountdownEnd);

    useEffect(() => {
        onCountdownEndRef.current = onCountdownEnd;
    }, [onCountdownEnd]);

    useEffect(() => {
        if (gameState !== "COUNTDOWN") {
            setCountdownValue(3);
            return;
        }

        const timer = setInterval(() => {
            setCountdownValue((prev) => {
                if (prev === 3) return 2;
                if (prev === 2) return 1;
                if (prev === 1) return "GO!";
                if (prev === "GO!") {
                    clearInterval(timer); // Clear the interval immediately
                    onCountdownEndRef.current(); // Call the callback immediately
                    return "GO!";
                }
                return prev;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [gameState]);

    return countdownValue;
}
