import { useEffect, useRef, useState } from "react";
import { isReachable, reason, markUnreachable, probe } from "@/utils/connection";

// ponytail: no Inertia import on purpose — CANCEL dismisses; the guard never
// navigates and never decides where a student belongs. Locked by
// tests/Unit/offlineGuard.test.js.
// ponytail: the shared connection store answers "can we reach the server", not
// navigator.onLine (that only says the interface is up, so a WiFi link with no
// uplink read as online and this modal never appeared). `offline` stays LOCAL
// state on purpose: the store supplies WHAT is wrong — the copy and the block
// decision — never WHETHER to raise. The trigger list below is the locked
// contract, and a mic tap must keep reading as a request to PLAY.
export default function OfflineGuard() {
    const [offline, setOffline] = useState(() => !isReachable());
    const [status, setStatus] = useState(null);
    const timer = useRef(null);

    // ponytail: the recovery probes are NOT the round-start probe. That one
    // gates a child's mic tap, so it must stay at 2500ms. These two run with a
    // modal already open and a human already waiting, so patience is free — and
    // it is required: the first request after a link returns pays a Vercel
    // Container cold boot that routinely blows past 2.5s. At the old budget the
    // abort fired, `probe()` reported the healthy server unreachable, and the
    // "Connected!" celebration never appeared — the teacher was told "still
    // offline" about a link that was already back. 8s covers a cold boot
    // without ever gating a child.
    const RECOVERY_PROBE_MS = 8000;

    useEffect(() => {
        // ponytail: one raise, two reasons. Every trigger does the same four
        // things, so they share a body instead of four near-copies drifting.
        const raise = (why) => {
            clearTimeout(timer.current);
            setStatus(null);
            markUnreachable(why);
            setOffline(true);
        };
        // The window `offline` listener hands us an Event, never a string, so
        // it stays a zero-arg passthrough and cannot leak an Event as `why`.
        const goOffline = () => raise("interface");
        // ponytail: a dead request is the loudest reachability datapoint there
        // is. Without this, the ~12 unwritten writes (both logins, logout,
        // tutorial.skip, the 5 teacher settings/report routes, add/edit/delete
        // student) dropped silently: on a network failure axios rejects with NO
        // error.response, so Response.handle() never runs and `onError` never
        // fires (core/dist/index.esm.js:2308) — only `.finally()` → `onFinish`
        // (:2314) does, which clears the spinner and says nothing. The teacher
        // tapped Save, the save did not happen, and the app looked fine.
        // `connection.js` already flips the store on this same event, so the
        // copy was already correct; this only decides to SHOW it.
        //
        // This is NOT the click-reaction channel that was removed. That one
        // answered a play tap with a connection error; this answers a write
        // that genuinely did not land — including a student's round save, where
        // the honest message is the whole point (the score is in
        // sessionStorage and replays, but the child must know it is not banked).
        const goUnreachable = () => raise("server");
        // The interface came back — that does not mean the SERVER did. Probe
        // before dismissing, so an access point that re-associated without an
        // uplink upgrades the copy to "No Internet" instead of claiming
        // success. The failing branch also re-renders: `reason` is read during
        // render, and without a state change the copy would stay on the
        // wrong-diagnosis branch.
        //
        // ponytail: the celebration lives in confirmRestored() and BOTH this and
        // the RETRY button go through it. It used to be inline in handleRetry
        // only, so an automatic reconnect just called setOffline(false) and the
        // "Connected!" modal appeared and vanished with no acknowledgement —
        // on every page, and on the 5 polling teacher pages the modal often is
        // not even open, so the teacher got nothing at all. One body, two
        // callers, and the two paths cannot drift apart again.
        //
        // No clearTimeout here on purpose: `raise`, blockOfflineVisit and the
        // effect cleanup already cancel a pending dismiss, so a drop during
        // the 1.2s window keeps the modal open. offlineGuard.test.js counts
        // those three sites — a fourth would be dead weight.
        const confirmRestored = () => {
            setStatus("restored");
            timer.current = setTimeout(() => setOffline(false), 1200);
        };
        const goOnline = () => {
            probe(RECOVERY_PROBE_MS).then((ok) => {
                if (ok) confirmRestored();
                else setStatus("still-offline");
            });
        };

        window.addEventListener("offline", goOffline);
        window.addEventListener("online", goOnline);
        document.addEventListener("inertia:exception", goUnreachable);
        return () => {
            clearTimeout(timer.current);
            window.removeEventListener("offline", goOffline);
            window.removeEventListener("online", goOnline);
            document.removeEventListener("inertia:exception", goUnreachable);
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
            if (isReachable()) return;
            if (e.detail?.visit?.method !== "get") return;
            e.preventDefault();
            clearTimeout(timer.current);
            setStatus(null);
            setOffline(true);
        };

        document.addEventListener("inertia:before", blockOfflineVisit);
        return () => document.removeEventListener("inertia:before", blockOfflineVisit);
    }, []);

    // ponytail: this modal is NOT a click reaction. It appears on exactly four
    // things: initial mount while the server is unreachable, the browser
    // `offline` event, an unreachable page switch (inertia:before, above), and
    // a request that died (inertia:exception, above) — the last one being the
    // only one that reports a write the user believed had landed.
    // A round start is NOT one of them — the kid tapping the mic is asking to
    // PLAY, and answering a play tap with a connection error reads as a broken
    // app. The probe in handleMicrophoneClick flips the store, so the mic and
    // the "Tap Microphone" overlay say "No Connection" themselves instead, and
    // that silent bail is also what stops a 0/0 round from being persisted.

    if (!offline) return null;

    // Re-read the store, never reload — a reload remounts the page and would
    // reset the onboarding guide step and every teacher form field.
    const handleRetry = () => {
        probe(RECOVERY_PROBE_MS).then((ok) => {
            if (!ok) {
                setStatus("still-offline");
                return;
            }
            confirmRestored();
        });
    };

    const restored = status === "restored";
    // "The server is not answering" is a different problem with a different
    // fixer — the kid cannot fix the network themselves, so this sends them to
    // the teacher.
    //
    // ponytail: NO transport detection, and none is possible. The copy must not
    // claim Wi-Fi, because no browser can confirm it: navigator.connection.type
    // was removed from every engine, .effectiveType is a BANDWIDTH class (WiFi
    // reports "4g" all day), and the whole object is undefined in Safari — the
    // school iPad this app actually runs on. `reason` is all we know, so the
    // copy says what we know and what the child can do, never which radio is on.
    // The old "You're connected to Wi-Fi but there's no internet" was the worst
    // case: a server outage on LTE is the `server` path, so a kid on mobile data
    // was told to check a WiFi that was never switched on.
    const noServer = reason() === "server";
    const title = restored ? "Connected!" : noServer ? "No Internet" : "No Connection";
    const body = restored
        ? "Connection restored! You are back online."
        : noServer
          ? "You're online but the app can't reach the server. Tell your teacher, then tap RETRY."
          : "No internet connection. Tap RETRY when you're back online.";

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
                    {title}
                </h2>

                {restored ? (
                    <p role="status" className="mt-3 text-on-surface-variant font-bold leading-relaxed">
                        {body}
                    </p>
                ) : (
                    <>
                        <p className="mt-3 text-on-surface-variant font-bold leading-relaxed">
                            {body}
                        </p>

                        {status === "still-offline" && (
                            <p role="status" className="mt-3 text-error font-black uppercase text-sm tracking-wider">
                                {noServer ? "Still no internet — tell your teacher" : "Still offline — check your internet"}
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
