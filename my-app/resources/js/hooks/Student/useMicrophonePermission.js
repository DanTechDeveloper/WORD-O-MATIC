import { useState, useEffect, useCallback } from "react";

export function useMicrophonePermission() {
    const [permissionState, setPermissionState] = useState("prompt"); // 'prompt', 'granted', 'denied'

    const requestPermission = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: true,
            });
            stream.getTracks().forEach((track) => track.stop()); // Stop tracks immediately after getting permission
            setPermissionState("granted");
            return true;
        } catch (err) {
            console.error("Microphone permission denied:", err);
            setPermissionState("denied");
            return false;
        }
    }, []);

    // ponytail: the ASR hook hits NotAllowedError MID-ROUND
    // (useDeepgramRecognition.js:388,403) without ever touching the Permissions
    // API, so that path set gameState DENIED while permissionState still read
    // "prompt". Two DENIED sources, two states — the recovery edge in the
    // gameplay pages could only see one. This makes both write the same value.
    const markDenied = useCallback(() => {
        setPermissionState("denied");
    }, []);

    useEffect(() => {
        const queryPermission = async () => {
            if (navigator.permissions && navigator.permissions.query) {
                try {
                    const result = await navigator.permissions.query({
                        name: "microphone",
                    });
                    setPermissionState(result.state);
                    result.onchange = () => setPermissionState(result.state);
                } catch (e) {
                    // Browser might not support query, assume 'prompt'
                    setPermissionState("prompt");
                }
            } else {
                // Older browser, assume 'prompt' and rely on getUserMedia to trigger prompt
                setPermissionState("prompt");
            }
        };
        queryPermission();
    }, []);

    return { permissionState, requestPermission, markDenied };
}
