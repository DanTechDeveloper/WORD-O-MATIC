import { useEffect, useRef, useState } from "react";

// ponytail: no Inertia import on purpose — CANCEL dismisses; the guard never
// navigates and never decides where a student belongs. Locked by
// tests/Unit/offlineGuard.test.js.
// ponytail: navigator.onLine reports "network interface up", not "internet
// reachable" — a captive portal reads as online. Upgrade path: probe the server
// on RETRY + listen for the inertia:exception event.
export default function OfflineGuard() {
    const [offline, setOffline] = useState(() => !navigator.onLine);
    const [status, setStatus] = useState(null);
    const timer = useRef(null);

    useEffect(() => {
        const goOffline = () => {
            clearTimeout(timer.current);
            setStatus(null);
            setOffline(true);
        };
        const goOnline = () => setOffline(false);

        window.addEventListener("offline", goOffline);
        window.addEventListener("online", goOnline);
        return () => {
            clearTimeout(timer.current);
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online", goOnline);
        };
    }, []);

    // ponytail: page switching is the one thing that ALWAYS needs the server, so
    // a CANCEL that "keeps playing" still dies silently on the next Link/visit.
    // Inertia gates every visit on the cancelable inertia:before event
    // (core/dist/index.esm.js:2538) — preventDefault aborts it pre-flight, before
    // progress.reveal() on :2561, so no stuck spinner either. GET only: writes
    // (saveWordProgress, the pending-commit replay) MUST still be attempted —
    // blocking them skips Request.finish(), stranding useGameplayCore's
    // isSaving=true (dead mic) and losing the durable sessionStorage commit.
    // Those fail the normal way instead: axios rejects → .finally fires onFinish.
    useEffect(() => {
        const blockOfflineVisit = (e) => {
            if (navigator.onLine) return;
            if (e.detail?.visit?.method !== "get") return;
            e.preventDefault();
            clearTimeout(timer.current);
            setStatus(null);
            setOffline(true);
        };

        document.addEventListener("inertia:before", blockOfflineVisit);
        return () => document.removeEventListener("inertia:before", blockOfflineVisit);
    }, []);

    // ponytail: this modal is NOT a click reaction. It appears on exactly three
    // things: initial mount while offline, the browser `offline` event, and an
    // offline page switch (inertia:before, above). A round start is NOT one of
    // them — the kid tapping the mic is asking to PLAY, and answering a play
    // tap with a connection error reads as a broken app. The mic and the
    // "Tap Microphone" overlay say "No Connection" themselves instead, and
    // handleMicrophoneClick returns silently (no round, so no junk GameSession).
    // If a third site ever needs to raise this, build utils/connection.js.

    if (!offline) return null;

    // Re-read the flag, never reload — a reload remounts the page and would
    // reset the onboarding guide step and every teacher form field.
    const handleRetry = () => {
        if (!navigator.onLine) {
            setStatus("still-offline");
            return;
        }
        setStatus("restored");
        timer.current = setTimeout(() => setOffline(false), 1200);
    };

    const restored = status === "restored";

    return (
        <div className="fixed inset-0 z-[120] flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-background/80" aria-hidden="true" />

            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="offline-title"
                className="relative w-full max-w-md bg-surface-container border-4 border-outline/20 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] animate-fade-in max-h-[90vh] overflow-y-auto p-6 sm:p-8 text-center"
            >
                <div
                    className={`mx-auto w-20 h-20 rounded-full flex items-center justify-center border-4 mb-5 ${
                        restored ? "bg-accent/20 border-accent" : "bg-error/15 border-error/30"
                    }`}
                >
                    <span
                        className={`material-symbols-outlined text-5xl ${restored ? "text-accent" : "text-error"}`}
                        style={{ fontVariationSettings: "'FILL' 1" }}
                        aria-hidden="true"
                    >
                        {restored ? "check_circle" : "wifi_off"}
                    </span>
                </div>

                <h2 id="offline-title" className="text-2xl sm:text-3xl font-black uppercase italic tracking-tighter text-white">
                    {restored ? "Connected!" : "No Connection"}
                </h2>

                {restored ? (
                    <p role="status" className="mt-3 text-on-surface-variant font-bold leading-relaxed">
                        Connection restored! You are back online.
                    </p>
                ) : (
                    <>
                        <p className="mt-3 text-on-surface-variant font-bold leading-relaxed">
                            Turn your Wi-Fi back on, then tap RETRY.
                        </p>

                        {status === "still-offline" && (
                            <p role="status" className="mt-3 text-error font-black uppercase text-sm tracking-wider">
                                Still offline — check your Wi-Fi
                            </p>
                        )}

                        <div className="mt-6 flex flex-col sm:flex-row gap-3">
                            <button
                                type="button"
                                onClick={() => setOffline(false)}
                                className="flex-1 py-3 rounded-xl font-black uppercase italic text-sm border-2 border-outline/20 bg-surface-container-lowest text-on-surface-variant hover:text-white transition-colors min-h-[44px]"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={handleRetry}
                                autoFocus
                                className="flex-1 py-3 rounded-xl font-black uppercase italic text-sm border-4 border-slate-950 hover:translate-y-0.5 transition-all min-h-[44px] flex items-center justify-center gap-2 bg-accent text-background shadow-[4px_4px_0_0_#3f6212]"
                            >
                                <span className="material-symbols-outlined text-base" aria-hidden="true">
                                    refresh
                                </span>
                                Retry
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
