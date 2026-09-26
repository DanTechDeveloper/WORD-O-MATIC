// ponytail: the single answer to "can we reach the server?" — NOT
// navigator.onLine, which only reports that a network interface is UP. A WiFi
// link with no uplink (captive portal, dead router, weak LTE) reads as online:
// OfflineGuard stayed silent, the mic promised "Speak to Smash!", the round
// burned 60s, and handleTimeUp banked a junk 0/0 GameSession (StudentController
// has no zero-guard). The ASR token fetch already fails three times in that
// state and the hook already emits "token_failed" — nobody was listening.
//
// Plain module, no React: useDeepgramRecognition reads it from timer callbacks.
// The ONLY window/document listeners live in initConnection() (called from
// app.jsx at boot) so the `online` listener is registered BEFORE the hook's own
// onBackOnline — see the note on that handler for why the order is load-bearing.
//
// Probe target: Laravel's built-in `/up` health route (bootstrap/app.php
// `health: '/up'`). No new route, no auth, no DB, and no Cache-Control on Caddy
// for that path, so it is the cheapest end-to-end proof that DNS + TLS + app
// are all reachable. `!res.redirected` is the captive-portal guard: a portal
// answers with a 302 to its own login page on another origin, which fetch()
// happily follows and would report as a success.
//
// ponytail: no polling, and no probe on mount. A page that rendered at all
// means the network worked moments ago, so a boot probe could only catch a
// ~200ms race — for one request on every page load. The interface state is read
// synchronously instead (see the initial `state` below), so an already-offline
// page load still raises the guard with zero requests. Probe happens only where
// a human is waiting on the answer: the mic tap and RETRY. Everything else is
// reactive and free — inertia:exception and token_failed.

const PROBE_TIMEOUT_MS = 2500;

// Fail open: `navigator` is absent under Node/SSR, and `navigator.onLine` is
// `undefined` there (not false). A truthiness test would read that as offline
// and silence every ASR watchdog in the test suite. Only positive evidence of a
// down interface counts.
function interfaceDown() {
    return typeof navigator !== "undefined" && navigator.onLine === false;
}

// Frozen, and REPLACED on every change — useSyncExternalStore infinite-loops if
// the snapshot it returns is mutated in place.
let state = interfaceDown()
    ? { reachable: false, reason: "interface" }
    : { reachable: true, reason: null };

const listeners = new Set();

function publish(next) {
    state = next;
    listeners.forEach((fn) => fn(state));
}

export function isReachable() {
    return state.reachable;
}

export function reason() {
    return state.reason;
}

export function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
}

export function markReachable() {
    if (state.reachable && state.reason === null) return;
    publish({ reachable: true, reason: null });
}

export function markUnreachable(why) {
    if (!state.reachable && state.reason === why) return;
    publish({ reachable: false, reason: why });
}

// ponytail: fail-CLOSED. A non-OK, a cross-origin redirect, an abort, or a
// throw all mean "do not start a round" — a false negative costs the kid one
// tap, a false positive would bank another 0/0 GameSession.
export async function probe() {
    if (interfaceDown()) {
        markUnreachable("interface");
        return false;
    }
    const controller = new AbortController();
    // AbortController + setTimeout, not AbortSignal.timeout(): that is Safari
    // 16.4+ and a school iPad is not a safe bet. 2500ms is 10-25x the expected
    // Aiven sfo RTT, so a merely slow link still passes.
    const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
    try {
        const res = await fetch("/up", { cache: "no-store", signal: controller.signal });
        const sameOrigin = typeof location === "undefined" || res.url.startsWith(location.origin);
        if (res.ok && !res.redirected && sameOrigin) {
            markReachable();
            return true;
        }
        markUnreachable("server");
        return false;
    } catch {
        markUnreachable("server");
        return false;
    } finally {
        clearTimeout(timer);
    }
}

export function initConnection() {
    if (typeof window === "undefined" || typeof document === "undefined") return;

    window.addEventListener("offline", () => markUnreachable("interface"));

    window.addEventListener("online", () => {
        // Synchronous and optimistic, NEVER a probe: useDeepgramRecognition's
        // startConnection bails on !isReachable(), so awaiting a probe here
        // would make the hook's onBackOnline bail too and a LIVE round would
        // never reconnect. If the uplink is still dead, the token fetch fails
        // and token_failed owns it (the pages refill to IDLE, no persist).
        markReachable();
    });

    // Every failed page visit is a real server-reachability datapoint and
    // costs nothing — the "upgrade path" this file's callers used to document.
    document.addEventListener("inertia:exception", () => markUnreachable("server"));
}

// ponytail: test-only reset — the store is a module singleton, so a suite needs
// a way back to the default state between cases.
export function resetConnection() {
    listeners.clear();
    state = interfaceDown()
        ? { reachable: false, reason: "interface" }
        : { reachable: true, reason: null };
}
