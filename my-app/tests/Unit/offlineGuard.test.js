// ponytail: no jsdom needed — file-content checks mirror mounted behavior
// (same approach as confirmDeleteModal.test.js)

import fs from "fs";

const src = fs.readFileSync("resources/js/Components/Shared/OfflineGuard.jsx", "utf8");
const app = fs.readFileSync("resources/js/app.jsx", "utf8");
const splash = fs.readFileSync("resources/js/Pages/Student/SplashScreen.jsx", "utf8");
const layout = fs.readFileSync("resources/js/Layouts/Teacher/DashboardLayout.jsx", "utf8");

describe("OfflineGuard", () => {
    test("detects an already-offline page load via the useState initializer", () => {
        expect(src).toContain("useState(() => !navigator.onLine)");
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
        expect(src).toContain("Turn your Wi-Fi back on, then tap RETRY.");
        expect(src).toContain("Still offline — check your Wi-Fi");
        expect(src).toContain("Connection restored!");
    });

    test("retry re-reads the flag and auto-closes after success", () => {
        expect(src).toContain("if (!navigator.onLine)");
        expect(src).toContain("setTimeout(() => setOffline(false), 1200)");
    });

    test("success timer is cleared on unmount, a drop, and a blocked visit", () => {
        // A pending 1.2s "restored" auto-close must not fire while the modal is
        // being re-shown. The third clear (the mic-tap reopen) is gone with the
        // click-reaction channel — the modal no longer reacts to a tap.
        expect(src.match(/clearTimeout\(timer\.current\)/g)).toHaveLength(3);
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
        expect(src).toContain("if (navigator.onLine) return;");
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

describe("GET block must not strand a pending flag", () => {
    test("SplashScreen releases its starting latch on a timer", () => {
        expect(splash).toContain("setTimeout(() => setStarting(false), 3000)");
        expect(splash).toContain("clearTimeout(startTimer.current)");
    });

    test("teacher global search always clears its spinner via onFinish", () => {
        expect(layout).toContain("onFinish: () => setIsSearching(false)");
    });
});
