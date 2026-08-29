import { useEffect, useRef } from "react";
import { DeepgramClient } from "@deepgram/sdk";
import { isFuzzyMatch } from "@/lib/speechUtils";
import {
    normalizeText,
    clearAllTimers,
    armWordTimeout,
    armSentenceTimeout,
    processWordModeResult,
    processSentenceModeResult,
} from "@/hooks/Student/useSpeechRecognition";

const MODEL = "nova-3";
const LANGUAGE = "en";
const DEBUG_ASR = false;

export function useDeepgramRecognition({
    isActive,
    preload = false,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
    onRestartFailed,
    matchMode = "word",
    muted = false,
}) {
    const isWordMode = matchMode === "word";
    const propsRef = useRef(null);

    useEffect(() => {
        propsRef.current = {
            isActive,
            preload,
            isWordMode,
            targetWord,
            muted,
            onWordRecognized,
            onPermissionDenied,
            onMispronounced,
            onRecognitionError,
            onRestartFailed,
        };
    }, [
        isActive,
        preload,
        isWordMode,
        targetWord,
        muted,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
        onRestartFailed,
    ]);

    const stateRefs = useRef({
        hasMatched: false,
        lastProcessed: -1,
        lastProcessedSentence: -1,
        isMounted: false,
        stoppedAt: 0,
        mispronouncedInWord: false,
        mispronouncedSentence: false,
        transcript: "",
        interim: "",
        isListening: false,
        lastSpeechAt: Date.now(),
    });

    const timerRefs = useRef({
        restart: null,
        sentence: null,
        word: null,
        settle: null,
        sentenceSettle: null,
    });
    const timeoutRefs = useRef({
        graceEnd: Date.now() + 500,
        restartCount: 0,
        target: null,
    });
    const lastErrorRef = useRef(null);

    const connRef = useRef(null);
    const streamRef = useRef(null);
    const audioCtxRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const scriptNodeRef = useRef(null);
    const resultsRef = useRef([]);

    const stopAll = () => {
        clearAllTimers(timerRefs.current);
        if (scriptNodeRef.current) {
            try {
                scriptNodeRef.current.disconnect();
            } catch {
                /* noop */
            }
            scriptNodeRef.current = null;
        }
        if (sourceNodeRef.current) {
            try {
                sourceNodeRef.current.disconnect();
            } catch {
                /* noop */
            }
            sourceNodeRef.current = null;
        }
        if (audioCtxRef.current) {
            audioCtxRef.current.close().catch(() => {});
            audioCtxRef.current = null;
        }
        if (streamRef.current) {
            streamRef.current.getTracks().forEach((t) => t.stop());
            streamRef.current = null;
        }
        if (connRef.current) {
            try {
                connRef.current.close();
            } catch {
                /* noop */
            }
            connRef.current = null;
        }
        stateRefs.current.isListening = false;
    };

    const armForCurrentTarget = () => {
        stateRefs.current.lastSpeechAt = Date.now();
        const activeTarget = normalizeText(propsRef.current.targetWord);
        if (propsRef.current.isWordMode) {
            armWordTimeout(
                activeTarget,
                stateRefs,
                timerRefs,
                timeoutRefs,
                propsRef,
            );
        } else {
            armSentenceTimeout(
                activeTarget,
                stateRefs.current.transcript,
                stateRefs,
                timerRefs,
                timeoutRefs,
                propsRef,
            );
        }
    };

    const startConnection = async () => {
        if (
            !stateRefs.current.isMounted ||
            (!propsRef.current.isActive && !propsRef.current.preload)
        )
            return;

        let token, baseUrl;
        try {
            if (DEBUG_ASR) window.__dgTokenStart = performance.now();
            const resp = await fetch("/student/deepgram-token", {
                headers: { Accept: "application/json" },
            });
            if (!resp.ok) {
                propsRef.current.onRecognitionError?.("token_failed");
                return;
            }
            const json = await resp.json();
            token = json.token;
            baseUrl = json.baseUrl;
            if (DEBUG_ASR) console.debug("[ASR] token RTT", performance.now() - window.__dgTokenStart, "ms");
        } catch {
            propsRef.current.onRecognitionError?.("token_failed");
            return;
        }
        if (!stateRefs.current.isMounted) return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            const audioCtx = new AudioCtx({ sampleRate: 16000 });
            audioCtxRef.current = audioCtx;
            const dg = new DeepgramClient({ accessToken: token, baseUrl });
            const conn = await dg.listen.v1.connect({
                model: MODEL,
                language: LANGUAGE,
                encoding: "linear16",
                sample_rate: audioCtx.sampleRate,
                channels: 1,
                interim_results: true,
            });
            if (!stateRefs.current.isMounted) {
                conn.close();
                audioCtxRef.current?.close();
                audioCtxRef.current = null;
                return;
            }
            connRef.current = conn;

    conn.on("open", async () => {
        if (DEBUG_ASR) window.__dgOpenAt = performance.now();
        if (
                    !stateRefs.current.isMounted ||
                    (!propsRef.current.isActive && !propsRef.current.preload)
                ) {
                    conn.close();
                    return;
                }
                stateRefs.current.isListening = true;
                stateRefs.current.lastSpeechAt = Date.now();
                stateRefs.current.hasMatched = false;
                stateRefs.current.mispronouncedInWord = false;
                stateRefs.current.mispronouncedSentence = false;
                stateRefs.current.lastProcessed = -1;
                stateRefs.current.lastProcessedSentence = -1;
                stateRefs.current.transcript = "";
                stateRefs.current.interim = "";
                if (propsRef.current.isActive) armForCurrentTarget();

                let stream;
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: { channelCount: 1 },
                    });
                } catch (e) {
                    if (
                        e &&
                        (e.name === "NotAllowedError" ||
                            e.name === "SecurityError")
                    ) {
                        propsRef.current.onPermissionDenied?.();
                    } else {
                        propsRef.current.onRecognitionError?.(
                            e?.name || "mic_error",
                        );
                    }
                    conn.close();
                    return;
                }

                if (!stateRefs.current.isMounted) {
                    stream.getTracks().forEach((t) => t.stop());
                    conn.close();
                    return;
                }

                streamRef.current = stream;
                const audioCtx = audioCtxRef.current;
                const source = audioCtx.createMediaStreamSource(stream);

                const pushPcm = (float32) => {
                    if (propsRef.current?.muted) return;
                    const int16 = new Int16Array(float32.length);
                    for (let i = 0; i < float32.length; i++) {
                        const s = Math.max(-1, Math.min(1, float32[i]));
                        int16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
                    }
                    const c = connRef.current;
                    if (c && c.socket) {
                        try {
                            c.socket.send(int16.buffer);
                        } catch {
                            /* socket not writable; ignore */
                        }
                    }
                };

                let processor;
                try {
                    if (audioCtx.state === "suspended") {
                        await audioCtx.resume();
                    }
                    await audioCtx.audioWorklet.addModule("/pcm-processor.js");
                    const node = new AudioWorkletNode(
                        audioCtx,
                        "pcm-processor",
                    );
                    node.port.onmessage = (ev) => pushPcm(ev.data);
                    processor = node;
                } catch {
                    processor = audioCtx.createScriptProcessor(4096, 1, 1);
                    processor.onaudioprocess = (ev) =>
                        pushPcm(ev.inputBuffer.getChannelData(0));
                }
                sourceNodeRef.current = source;
                scriptNodeRef.current = processor;
                const sink = audioCtx.createGain();
                sink.gain.value = 0;
                source.connect(processor);
                processor.connect(sink);
                sink.connect(audioCtx.destination);
            });

            conn.on("message", (data) => {
                if (!data || data.type !== "Results") return;
                if (!propsRef.current?.isActive) return;
                if (propsRef.current?.muted) return;
                if (DEBUG_ASR && window.__dgOpenAt && !stateRefs.current.__firstResultLogged) {
                    stateRefs.current.__firstResultLogged = true;
                    console.debug("[ASR] first result", performance.now() - window.__dgOpenAt, "ms from connection open");
                }
                const isFinal = !!data.is_final;
                const transcript =
                    data.channel?.alternatives?.[0]?.transcript ?? "";
                if (!transcript && !isFinal) return;
                const resultIndex = resultsRef.current.length;
                resultsRef.current.push({ isFinal, 0: { transcript } });
                const MAX_RESULTS = 128;
                if (resultsRef.current.length > MAX_RESULTS) {
                    const drop = resultsRef.current.length - MAX_RESULTS;
                    resultsRef.current.splice(0, drop);
                    stateRefs.current.lastProcessed -= drop;
                    stateRefs.current.lastProcessedSentence -= drop;
                }
                const event = {
                    resultIndex,
                    results: resultsRef.current,
                };
                const target = normalizeText(propsRef.current.targetWord);
                if (propsRef.current.isWordMode) {
                    processWordModeResult(
                        event,
                        target,
                        stateRefs,
                        timerRefs,
                        timeoutRefs,
                        propsRef,
                    );
                } else {
                    processSentenceModeResult(
                        event,
                        target,
                        stateRefs,
                        timeoutRefs,
                        timerRefs,
                        propsRef,
                    );
                }
            });

            conn.on("error", (err) => {
                console.error("Deepgram error:", err);
                propsRef.current.onRecognitionError?.(
                    String(err?.message || err),
                );
            });

            conn.on("close", () => {
                connRef.current = null;
                if (!stateRefs.current.isMounted || !propsRef.current.isActive)
                    return;
                if (timeoutRefs.current.restartCount < 1) {
                    timeoutRefs.current.restartCount++;
                    timerRefs.current.restart = setTimeout(() => {
                        startConnection();
                    }, 500);
                } else {
                    propsRef.current.onRestartFailed?.();
                }
            });

            conn.connect();
            await conn.waitForOpen();
        } catch (e) {
            console.error("Deepgram connect failed:", e);
            audioCtxRef.current?.close();
            audioCtxRef.current = null;
            propsRef.current.onRecognitionError?.(
                e?.message || "connect_failed",
            );
        }
    };

    useEffect(() => {
        stateRefs.current.isMounted = true;
        return () => {
            stateRefs.current.isMounted = false;
            stopAll();
        };
    }, []);

    // Re-arm on target word change (without tearing down the connection)
    useEffect(() => {
        stateRefs.current.hasMatched = false;
        stateRefs.current.mispronouncedInWord = false;
        stateRefs.current.mispronouncedSentence = false;
        stateRefs.current.lastProcessed = -1;
        stateRefs.current.lastProcessedSentence = -1;
        stateRefs.current.transcript = "";
        stateRefs.current.interim = "";
        stateRefs.current.stoppedAt = 0;
        stateRefs.current.lastSpeechAt = Date.now();
        timeoutRefs.current.target = null;
        timeoutRefs.current.graceEnd = Date.now() + 500;
        timeoutRefs.current.restartCount = 0;
        resultsRef.current = [];
        clearAllTimers(timerRefs.current);

        if (propsRef.current?.isActive && connRef.current) {
            armForCurrentTarget();
        }
    }, [targetWord]);

    useEffect(() => {
        timeoutRefs.current.graceEnd = Date.now() + 500;
        timeoutRefs.current.restartCount = 0;
    }, []);
    useEffect(() => {
        if (propsRef.current?.isActive && connRef.current) {
            armForCurrentTarget();
        } else if (!propsRef.current?.isActive) {
            clearAllTimers(timerRefs.current);
        }
    }, [isActive]);

    useEffect(() => {
        if (preload) {
            try {
                stateRefs.current.hasMatched = false;
                stateRefs.current.lastProcessed = -1;
                stateRefs.current.lastProcessedSentence = -1;
                stateRefs.current.lastSpeechAt = Date.now();
                resultsRef.current = [];
                clearAllTimers(timerRefs.current);
                startConnection();
            } catch (e) {
                console.debug("Deepgram start failed:", e);
            }
        } else {
            stopAll();
        }
    }, [preload]);
}
