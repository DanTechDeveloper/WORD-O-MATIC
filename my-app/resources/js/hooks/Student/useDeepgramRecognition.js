import { useEffect, useRef } from "react";
import { DeepgramClient } from "@deepgram/sdk";
import { normalizeText } from "@/lib/speechUtils";
import { applyNoiseGate } from "@/lib/audioGate";
import { RNNOISE, createRnnoiseNode, downsample48kTo16k } from "@/lib/rnnoise";
import {
    clearAllTimers,
    armWordTimeout,
    armSentenceTimeout,
    routeRecognitionMessage,
} from "@/lib/speechProcessors";

const MODEL = "nova-3";
const LANGUAGE = "en-US";
const DEBUG_ASR = false;

// ponytail: module-level token cache — avoids re-fetching the Deepgram grant
// token when the hook reconnects (e.g. Word Blast → Story Quest switch).
let cachedToken = null;
let cachedBaseUrl = null;
let tokenExpiry = 0;

export function useDeepgramRecognition({
    isActive,
    preload = false,
    targetWord,
    onWordRecognized,
    onPermissionDenied,
    onMispronounced,
    onRecognitionError,
    onRestartFailed,
    onProgress,
    onSentenceVerdict,
    lookahead = "",
    matchMode = "word",
    muted = false,
    keyterms = [],
    resetKey,
    denoise = true,
}) {
    const isWordMode = matchMode === "word";
    const propsRef = useRef({
        isActive,
        preload,
        isWordMode,
        targetWord,
        muted,
        keyterms,
        denoise,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
        onRestartFailed,
        onProgress,
        onSentenceVerdict,
        lookahead,
    });

    useEffect(() => {
        propsRef.current = {
            isActive,
            preload,
            isWordMode,
            targetWord,
            muted,
            keyterms,
            denoise,
            onWordRecognized,
            onPermissionDenied,
            onMispronounced,
            onRecognitionError,
            onRestartFailed,
            onProgress,
            onSentenceVerdict,
            lookahead,
        };
    }, [
        isActive,
        preload,
        isWordMode,
        targetWord,
        muted,
        keyterms,
        denoise,
        onWordRecognized,
        onPermissionDenied,
        onMispronounced,
        onRecognitionError,
        onRestartFailed,
        onProgress,
        onSentenceVerdict,
        lookahead,
    ]);

    const stateRefs = useRef({
        hasMatched: false,
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
        wordSettle: null,
    });
    const timeoutRefs = useRef({
        graceEnd: Date.now() + 500,
        restartCount: 0,
        tokenRetries: 0,
        openAt: 0,
        target: null,
        prevTarget: null,
        targetChangedAt: 0,
    });

    const connRef = useRef(null);
    const streamRef = useRef(null);
    const audioCtxRef = useRef(null);
    const sourceNodeRef = useRef(null);
    const scriptNodeRef = useRef(null);
    const rnnoiseNodeRef = useRef(null);
    const permissionDeniedRef = useRef(false);
    const gateStateRef = useRef({ isOpen: false });

    const teardownAudio = () => {
        if (rnnoiseNodeRef.current) {
            try {
                rnnoiseNodeRef.current.update?.(false);
            } catch {
                /* noop */
            }
            try {
                rnnoiseNodeRef.current.disconnect();
            } catch {
                /* noop */
            }
            rnnoiseNodeRef.current = null;
        }
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
    };

    const stopAll = () => {
        clearAllTimers(timerRefs.current);
        teardownAudio();
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
        if (!activeTarget) return;
        if (propsRef.current.isWordMode) {
            armWordTimeout(
                activeTarget,
                stateRefs,
                timerRefs,
                timeoutRefs,
                propsRef,
            );
        } else {
            armSentenceTimeout(stateRefs, timerRefs, propsRef);
        }
    };

    // ponytail: token grant gets the same backoff ladder as reconnects —
    // a single 500 from the grant endpoint must not strand the kid mic-less
    // until remount. Reuses the restart timer slot so unmount/preload-off
    // cancels it via the existing stopAll path.
    const scheduleTokenRetry = () => {
        if (!stateRefs.current.isMounted) return;
        if (timeoutRefs.current.tokenRetries >= 3) {
            timeoutRefs.current.tokenRetries = 0;
            propsRef.current.onRecognitionError?.("token_failed");
            return;
        }
        timeoutRefs.current.tokenRetries++;
        const delay = Math.min(500 * 2 ** timeoutRefs.current.tokenRetries, 3000);
        timerRefs.current.restart = setTimeout(() => {
            startConnection();
        }, delay);
    };

    const startConnection = async () => {
        if (
            !stateRefs.current.isMounted ||
            (!propsRef.current.isActive && !propsRef.current.preload) ||
            connRef.current
        )
            return;

        let token, baseUrl;

        if (cachedToken && Date.now() < tokenExpiry) {
            token = cachedToken;
            baseUrl = cachedBaseUrl;
        } else {
            try {
                if (DEBUG_ASR) window.__dgTokenStart = performance.now();
                const resp = await fetch("/student/deepgram-token", {
                    headers: { Accept: "application/json" },
                });
                if (!resp.ok) {
                    scheduleTokenRetry();
                    return;
                }
                const json = await resp.json();
                token = json.token;
                baseUrl = json.baseUrl;
                timeoutRefs.current.tokenRetries = 0;
                // Cache with 60s safety buffer (Deepgram TTL is 3600s)
                cachedToken = json.token;
                cachedBaseUrl = json.baseUrl;
                tokenExpiry = Date.now() + ((json.expires_in ?? 3600) - 60) * 1000;
                if (DEBUG_ASR)
                    console.debug(
                        "[ASR] token RTT",
                        performance.now() - window.__dgTokenStart,
                        "ms",
                    );
            } catch {
                scheduleTokenRetry();
                return;
            }
        }
        if (!stateRefs.current.isMounted) return;

        try {
            const AudioCtx = window.AudioContext || window.webkitAudioContext;
            // ponytail: 48k context feeds RNNoise at its native rate; pushPcm
            // decimates back to 16k for Deepgram. Legacy 16k path when denoise off.
            const audioCtx = new AudioCtx({
                sampleRate:
                    propsRef.current.denoise === false
                        ? 16000
                        : RNNOISE.inRate,
            });
            audioCtxRef.current = audioCtx;
            const dg = new DeepgramClient({ accessToken: token, baseUrl });
            // ponytail: batch keyterm = level words (Word Blast 10 + Story Quest sentence words) — set once at open, survives targetWord re-arm without reconnect
            const rawTerms = Array.isArray(propsRef.current.keyterms)
                ? propsRef.current.keyterms
                : [];
            const keyterm = [
                ...new Set(
                    rawTerms.map((w) => normalizeText(w)).filter(Boolean),
                ),
            ].slice(0, 10);
            const conn = await dg.listen.v1.connect({
                model: MODEL,
                language: LANGUAGE,
                encoding: "linear16",
                // ponytail: always 16000 — the denoise path runs a 48k
                // context (RNNoise native rate) but pushPcm decimates
                // back to 16k before sending.
                sample_rate: 16000,
                channels: 1,
                interim_results: true,
                smart_format: false,
                punctuate: false,
                ...(keyterm.length ? { keyterm } : {}),
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
                permissionDeniedRef.current = false;
                timeoutRefs.current.openAt = Date.now();
                // ponytail: fresh open re-arms grace — mount/targetWord grace
                // expires during slow token+mic setup, so without this the
                // first mic transient could instant-fail. Drops Wrong only;
                // a fast correct still wins (500ms, like session transitions).
                timeoutRefs.current.graceEnd = Date.now() + 500;
                stateRefs.current.isListening = true;
                stateRefs.current.lastSpeechAt = Date.now();
                stateRefs.current.hasMatched = false;
                stateRefs.current.mispronouncedInWord = false;
                stateRefs.current.mispronouncedSentence = false;
                stateRefs.current.transcript = "";
                stateRefs.current.interim = "";
                gateStateRef.current.isOpen = false;
                if (propsRef.current.isActive) armForCurrentTarget();

                let stream;
                // ponytail: browser AEC/noise-suppression/AGC for cleaner ASR; native
                // constraints vary by device, so fall back to baseline on OverconstrainedError.
                // ponytail: AGC OFF by design — 40 sabay-sabay na bata sa room:
                // auto-gain pinapalakas ang malayong chatter kapag tahimik ang
                // holder, sinisira ang distance attenuation na inaasahan ng
                // near-field gate (audioGate.js). Relative levels preserved.
                try {
                    stream = await navigator.mediaDevices.getUserMedia({
                        audio: {
                            channelCount: 1,
                            echoCancellation: true,
                            noiseSuppression: true,
                            autoGainControl: false,
                        },
                    });
                } catch (e) {
                    if (e?.name === "OverconstrainedError") {
                        try {
                            stream =
                                await navigator.mediaDevices.getUserMedia({
                                    audio: { channelCount: 1 },
                                });
                        } catch (e2) {
                            if (
                                e2 &&
                                (e2.name === "NotAllowedError" ||
                                    e2.name === "SecurityError")
                            ) {
                                permissionDeniedRef.current = true;
                                propsRef.current.onPermissionDenied?.();
                            } else {
                                propsRef.current.onRecognitionError?.(
                                    e2?.name || "mic_error",
                                );
                            }
                            conn.close();
                            return;
                        }
                    } else if (
                        e &&
                        (e.name === "NotAllowedError" ||
                            e.name === "SecurityError")
                    ) {
                        permissionDeniedRef.current = true;
                        propsRef.current.onPermissionDenied?.();
                        conn.close();
                        return;
                    } else {
                        propsRef.current.onRecognitionError?.(
                            e?.name || "mic_error",
                        );
                        conn.close();
                        return;
                    }
                }

                if (!stateRefs.current.isMounted) {
                    stream.getTracks().forEach((t) => t.stop());
                    conn.close();
                    return;
                }

                streamRef.current = stream;
                const audioCtx = audioCtxRef.current;
                const source = audioCtx.createMediaStreamSource(stream);

                // ponytail: RNNoise ML denoise (local WASM, 48k-native). Any
                // failure — no SIMD, missing assets, worklet error — falls
                // back to the legacy peak-gate path, never a broken mic.
                let denoiseNode = null;
                if (
                    propsRef.current.denoise !== false &&
                    audioCtx.sampleRate === RNNOISE.inRate
                ) {
                    try {
                        denoiseNode = await createRnnoiseNode(audioCtx);
                    } catch {
                        denoiseNode = null;
                    }
                }
                if (!stateRefs.current.isMounted) {
                    if (denoiseNode) {
                        try {
                            denoiseNode.disconnect();
                        } catch {
                            /* noop */
                        }
                    }
                    stream.getTracks().forEach((t) => t.stop());
                    conn.close();
                    return;
                }
                rnnoiseNodeRef.current = denoiseNode;

                const pushPcm = (float32) => {
                    if (propsRef.current?.muted) return;
                    if (!stateRefs.current.isMounted) return;
                    // ponytail: 48k denoise context → decimate to 16k before
                    // gate+send; legacy 16k path passes through untouched.
                    const at16k =
                        audioCtx.sampleRate === RNNOISE.inRate
                            ? downsample48kTo16k(float32)
                            : float32;
                    const gated = applyNoiseGate(at16k, gateStateRef.current);
                    const int16 = new Int16Array(gated.length);
                    for (let i = 0; i < gated.length; i++) {
                        const s = Math.max(-1, Math.min(1, gated[i]));
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
                if (denoiseNode) {
                    source.connect(denoiseNode);
                    denoiseNode.connect(processor);
                } else {
                    source.connect(processor);
                }
                processor.connect(sink);
                sink.connect(audioCtx.destination);
            });

            conn.on("message", (data) => {
                if (
                    DEBUG_ASR &&
                    window.__dgOpenAt &&
                    !stateRefs.current.__firstResultLogged
                ) {
                    stateRefs.current.__firstResultLogged = true;
                    console.debug(
                        "[ASR] first result",
                        performance.now() - window.__dgOpenAt,
                        "ms from connection open",
                    );
                }
                routeRecognitionMessage(
                    data,
                    stateRefs,
                    timerRefs,
                    timeoutRefs,
                    propsRef,
                );
            });

            conn.on("error", (err) => {
                console.error("Deepgram error:", err);
                propsRef.current.onRecognitionError?.(
                    String(err?.message || err),
                );
                // ponytail: an errored conn never recovers on its own — close
                // it so the close handler below owns restart policy. Bounded
                // by the quick-death cap, so auth errors can't loop forever.
                try {
                    conn.close();
                } catch {
                    /* already dead */
                }
            });

            conn.on("close", () => {
                connRef.current = null;
                teardownAudio();
                if (!stateRefs.current.isMounted || !propsRef.current.isActive)
                    return;
                if (permissionDeniedRef.current) return;
                // ponytail: only QUICK deaths count — a conn that lived >=10s
                // was healthy (transient blip), so the streak resets. Three
                // quick deaths in a row means the server keeps dropping us;
                // give up instead of reconnecting forever (the old code reset
                // the counter on every open, so it never gave up).
                if (Date.now() - (timeoutRefs.current.openAt || 0) >= 10000) {
                    timeoutRefs.current.restartCount = 0;
                }
                if (timeoutRefs.current.restartCount < 3) {
                    timeoutRefs.current.restartCount++;
                    const delay = Math.min(
                        500 * 2 ** timeoutRefs.current.restartCount,
                        3000,
                    );
                    timerRefs.current.restart = setTimeout(() => {
                        startConnection();
                    }, delay);
                } else {
                    propsRef.current.onRestartFailed?.();
                }
            });

            conn.connect();
            await conn.waitForOpen();
        } catch (e) {
            console.error("Deepgram connect failed:", e);
            teardownAudio();
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
        // ponytail: keep accumulated finals/interims in sentence mode — wiping them
        // on each word advance destroys speech that lands (often as a late isFinal)
        // during the previous word's 500ms window, causing false mispronounces.
        if (propsRef.current.isWordMode) {
            stateRefs.current.transcript = "";
            stateRefs.current.interim = "";
        }
        stateRefs.current.stoppedAt = 0;
        stateRefs.current.lastSpeechAt = Date.now();
        // ponytail: A+B stale-tail guard — remember prev target so a late final
        // for the old word ("cat" tail after switch to "dog") doesn't instantly
        // mispronounce the new word at t+80ms.
        timeoutRefs.current.prevTarget = timeoutRefs.current.target;
        timeoutRefs.current.targetChangedAt = Date.now();
        timeoutRefs.current.target = null;
        // ponytail: 800ms listen-before-verdict per word — absorbs the mic
        // resume transient + first noise interims after each word switch, so a
        // silent kid is never instant-failed. Drops Wrong verdicts only; a fast
        // correct still wins inside the window, and the 5s no-speech fallback
        // still owns genuine silence.
        timeoutRefs.current.graceEnd = Date.now() + 800;
        timeoutRefs.current.restartCount = 0;
        gateStateRef.current.isOpen = false;
        clearAllTimers(timerRefs.current);

        if (propsRef.current?.isActive && connRef.current) {
            armForCurrentTarget();
        }
    }, [targetWord]);

    // ponytail: sentence-transition hard reset (Story Quest) — same block as
    // the targetWord re-arm above, plus a transcript wipe. Forces a clean
    // slate even when the new target normalizes equal to the old one (effect
    // above would skip), stale transcript poisons anchoring, or a tail flag
    // survives the break. No-op when resetKey is undefined (Word Blast never
    // passes it); word-mode transcript is preserved like above.
    useEffect(() => {
        if (resetKey === undefined) return;
        stateRefs.current.hasMatched = false;
        stateRefs.current.mispronouncedInWord = false;
        stateRefs.current.mispronouncedSentence = false;
        if (!propsRef.current.isWordMode) {
            stateRefs.current.transcript = "";
            stateRefs.current.interim = "";
        }
        stateRefs.current.stoppedAt = 0;
        stateRefs.current.lastSpeechAt = Date.now();
        timeoutRefs.current.target = null;
        timeoutRefs.current.graceEnd = Date.now() + 800;
        timeoutRefs.current.restartCount = 0;
        gateStateRef.current.isOpen = false;
        clearAllTimers(timerRefs.current);

        if (propsRef.current?.isActive && connRef.current) {
            armForCurrentTarget();
        }
    }, [resetKey]);

    useEffect(() => {
        // ponytail: 500ms grace on session transitions (IDLE→ACTIVE flip) absorbs
        // the mic/connection resume transient, but per-word grace above is 800ms.
        timeoutRefs.current.graceEnd = Date.now() + 500;
        if (propsRef.current?.isActive && connRef.current) {
            armForCurrentTarget();
        } else if (!propsRef.current?.isActive) {
            clearAllTimers(timerRefs.current);
        }
    }, [isActive]);

    useEffect(() => {
        if (preload) {
            try {
                // Full reset mirrors targetWord effect (prevents stale mispronounced flags)
                stateRefs.current.hasMatched = false;
                stateRefs.current.mispronouncedInWord = false;
                stateRefs.current.mispronouncedSentence = false;
                stateRefs.current.transcript = "";
                stateRefs.current.interim = "";
                stateRefs.current.stoppedAt = 0;
                stateRefs.current.lastSpeechAt = Date.now();
                timeoutRefs.current.target = null;
                timeoutRefs.current.graceEnd = Date.now() + 500;
                timeoutRefs.current.restartCount = 0;
                permissionDeniedRef.current = false;
                gateStateRef.current.isOpen = false;
                clearAllTimers(timerRefs.current);
                if (connRef.current) return;
                startConnection();
            } catch (e) {
                console.debug("Deepgram start failed:", e);
            }
        } else {
            permissionDeniedRef.current = false;
            stopAll();
        }
    }, [preload]);
}
