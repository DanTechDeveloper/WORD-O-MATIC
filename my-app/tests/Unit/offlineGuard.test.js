// ponytail: no jsdom needed — file-content checks mirror mounted behavior
// (same approach as confirmDeleteModal.test.js)

import fs from "fs";

const src = fs.readFileSync("resources/js/Components/Shared/OfflineGuard.jsx", "utf8");
const connection = fs.readFileSync("resources/js/utils/connection.js", "utf8");
const app = fs.readFileSync("resources/js/app.jsx", "utf8");
const splash = fs.readFileSync("resources/js/Pages/Student/SplashScreen.jsx", "utf8");
const layout = fs.readFileSync("resources/js/Layouts/Teacher/DashboardLayout.jsx", "utf8");

describe("OfflineGuard", () => {
    test("detects an unreachable server on load via the useState initializer", () => {
        // Not navigator.onLine: that only says the interface is up, so a WiFi
        // link with no uplink read as online and this modal never appeared.
        expect(src).toContain("useState(() => !isReachable())");
    });

    test("registers and cleans up both online and offline listeners", () => {
        expect(src).toContain('window.addEventListener("offline", goOffline)');
        expect(src).toContain('window.addEventListener("online", goOnline)');
        expect(src).toContain('window.removeEventListener("offline", goOffline)');
        expect(src).toContain('window.removeEventListener("online", goOnline)');
    });

    test("returns null while online so the app stays usable", () => {
        expect(src).toContain("if (!offline) return null");
    });

    test("modal sits above every other surface (DeniedModal is z-[110])", () => {
        expect(src).toContain("z-[120]");
    });

    test("renders an accessible dialog", () => {
        expect(src).toContain('role="dialog"');
        expect(src).toContain('aria-modal="true"');
        expect(src).toContain('aria-labelledby="offline-title"');
    });

    test("offers RETRY and CANCEL with 44px tap targets", () => {
        expect(src).toContain("handleRetry");
        expect(src).toContain("Retry");
        expect(src).toContain("Cancel");
        expect(src.match(/min-h-\[44px\]/g)).toHaveLength(2);
    });

    test("copy names the physical action and both retry outcomes", () => {
        expect(src).toContain("No internet connection. Tap RETRY when you're back online.");
        expect(src).toContain("Still offline — check your internet");
        expect(src).toContain("Connection restored!");
    });

    test("copy never claims a transport — no browser can confirm one", () => {
        // The lock that matters. navigator.connection.type was removed from every
        // engine, .effectiveType is a BANDWIDTH class (WiFi reports "4g"), and the
        // whole object is undefined in Safari — the school iPad this app runs on.
        // So the modal must describe what it knows (no link / server not
        // answering) and what the child can do, never which radio is on. A server
        // outage on LTE is the `server` reason, so the old "You're connected to
        // Wi-Fi" body was worst exactly on mobile data.
        const code = src
            .split("\n")
            .filter((line) => !line.trim().startsWith("//"))
            .join("\n")
            // The one deliberate exception: a Material Symbols glyph NAME, not
            // prose. "wifi_off" reads as "no network" to a six-year-old, which is
            // the only job the icon has, and there is no better "disconnected"
            // glyph. Strip it so the lock below is about what the copy CLAIMS.
            .replace(/"wifi_off"/, "");
        expect(code).not.toMatch(/wi-?fi/i);
    });

    test("a server-side outage gets its own copy — the kid cannot fix a router", () => {
        // Same modal, different problem: the interface is UP, so blaming the
        // connection is a lie and RETRY would fail forever. Send them to the
        // person who holds the router. Copy stays transport-agnostic (locked by
        // the "never claims a transport" test above).
        expect(src).toContain('const noServer = reason() === "server";');
        expect(src).toContain('"No Internet"');
        expect(src).toContain(
            "You're online but the app can't reach the server. Tell your teacher, then tap RETRY.",
        );
        expect(src).toContain("Still no internet — tell your teacher");
    });

    test("retry PROBES the server and only claims success on a 200", () => {
        // The old check was `if (!navigator.onLine)`, which said "restored" on a
        // link with no uplink — the exact lie this modal exists to stop.
        expect(src).toContain("probe().then((ok) => {");
        expect(src).toContain("if (!ok) {");
        // Prose may still name it — only CODE is read here.
        const code = src
            .split("\n")
            .filter((line) => !line.trim().startsWith("//"))
            .join("\n");
        expect(code).not.toContain("navigator.onLine");
        expect(src).toContain("setTimeout(() => setOffline(false), 1200)");
    });

    test("the browser online event re-proves the server before dismissing", () => {
        expect(src).toContain("const goOnline = () => {");
        expect(src).toContain("if (ok) setOffline(false);");
    });

    test("the guard never SUBSCRIBES to the store", () => {
        // The store supplies the copy and the block decision, never WHETHER to
        // raise: a mic tap flips it and the kid asked to PLAY. Trigger list
        // stays mount / offline event / blocked GET.
        expect(src).not.toContain("subscribe");
        expect(src).not.toContain("useSyncExternalStore");
    });

    test("success timer is cleared on unmount, a drop, and a blocked visit", () => {
        // A pending 1.2s "restored" auto-close must not fire while the modal is
        // being re-shown. The two interface/dead-request triggers share one
        // `raise` body, so the three sites are: raise (offline + exception),
        // blockOfflineVisit, and the effect cleanup.
        expect(src.match(/clearTimeout\(timer\.current\)/g)).toHaveLength(3);
    });

    test("a dead request re-raises — the silent-write path", () => {
        // ~12 writes (both logins, logout, tutorial.skip, 5 teacher
        // settings/report routes, add/edit/delete student) previously vanished
        // with no message: a network failure rejects with no error.response, so
        // Response.handle() never runs and onError never fires. onFinish does
        // fire, which clears the spinner and implies success.
        expect(src).toContain('document.addEventListener("inertia:exception", goUnreachable)');
        expect(src).toContain('document.removeEventListener("inertia:exception", goUnreachable)');
    });

    test("a dead request reads as a SERVER problem, not a dead interface", () => {
        // Same modal, different fixer: the interface is up, so "turn your Wi-Fi
        // back on" is a lie. reason() drives the copy, so the reason must be
        // "server" here and "interface" only for the browser's own event.
        expect(src).toContain('const goOffline = () => raise("interface");');
        expect(src).toContain('const goUnreachable = () => raise("server");');
    });

    test("every trigger shares one raise body instead of four near-copies", () => {
        expect(src).toContain("const raise = (why) => {");
        expect(src).toContain("markUnreachable(why);");
        // The window `offline` listener hands over an Event, so it must stay a
        // zero-arg passthrough or that Event lands in `why`.
        expect(src).toContain("const goOffline = () => raise(");
    });

    test("the modal never reacts to a tap", () => {
        // Regression guard: app:offline-reopen let a mic tap re-open the modal,
        // so a child asking to play got a connection error. Mount, the browser
        // offline event, and offline page switches are the only triggers.
        expect(src).not.toContain("app:offline-reopen");
    });

    test("re-arms on an attempted page switch instead of failing silently", () => {
        expect(src).toContain('document.addEventListener("inertia:before", blockOfflineVisit)');
        expect(src).toContain('document.removeEventListener("inertia:before", blockOfflineVisit)');
        expect(src).toContain("e.preventDefault()");
        expect(src).toContain("if (isReachable()) return;");
    });

    test("blocks page switches (GET) only — writes must still be attempted", () => {
        expect(src).toContain('if (e.detail?.visit?.method !== "get") return;');
    });

    test("never navigates — no router, no routes, no page props", () => {
        expect(src).not.toContain("router");
        expect(src).not.toContain("usePage");
        expect(src).not.toContain("route(");
    });

    test("mounted once in app.jsx next to the Inertia app", () => {
        expect(app).toContain("import OfflineGuard from '@/Components/Shared/OfflineGuard'");
        expect(app).toContain("<OfflineGuard />");
    });
});

describe("the shared store the guard reads", () => {
    test("initConnection runs at boot, before the pages mount their handlers", () => {
        // Ordering is load-bearing: the store's `online` listener must be
        // registered before the ASR hook's onBackOnline, or startConnection's
        // reachability bail swallows the reconnect of a LIVE round.
        expect(app).toContain("import { initConnection } from '@/utils/connection'");
        expect(app.indexOf("initConnection();")).toBeLessThan(
            app.indexOf("root.render("),
        );
    });

    test("the probe target is Laravel's own health route — no new endpoint", () => {
        expect(connection).toContain('fetch("/up"');
        expect(connection).toContain("cache: \"no-store\"");
    });

    test("a captive portal's cross-origin redirect cannot pass as success", () => {
        expect(connection).toContain("!res.redirected");
        expect(connection).toContain("res.url.startsWith(location.origin)");
    });

    test("no polling: a probe only happens where a human is waiting", () => {
        // A heartbeat would be one request per kid per interval forever, to
        // learn what inertia:exception and token_failed report for free.
        expect(connection).not.toContain("setInterval");
    });
});

describe("GET block must not strand a pending flag", () => {
    test("SplashScreen releases its starting latch on a timer", () => {
        expect(splash).toContain("setTimeout(() => setStarting(false), 3000)");
        expect(splash).toContain("clearTimeout(startTimer.current)");
    });

    test("teacher global search always clears its spinner via onFinish", () => {
        expect(layout).toContain("onFinish: () => setIsSearching(false)");
    });
});
