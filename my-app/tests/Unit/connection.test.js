// @vitest-environment happy-dom
// ponytail: real store tests — behaviour, not file text. The contract that
// matters: "can we reach the server" is NOT navigator.onLine (interface up
// reads as online on a WiFi link with no uplink), and the store must fail OPEN
// under Node/SSR so the ASR watchdogs are never silenced in this suite.
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import * as connection from "@/utils/connection";

// happy-dom exposes navigator.onLine as a prototype getter, so the instance
// has to be shadowed. Restored after every test.
const setOnline = (value) =>
    Object.defineProperty(window.navigator, "onLine", {
        value,
        configurable: true,
    });

const stubFetch = (impl) => {
    const spy = vi.fn(impl);
    globalThis.fetch = spy;
    return spy;
};

const ok = () => ({ ok: true, redirected: false, url: `${location.origin}/up` });

beforeEach(() => {
    setOnline(true);
    connection.resetConnection();
});

afterEach(() => {
    setOnline(true);
    vi.useRealTimers();
    delete globalThis.fetch;
});

describe("the store starts reachable and fails open", () => {
    test("reachable with no reason out of the box", () => {
        expect(connection.isReachable()).toBe(true);
        expect(connection.reason()).toBe(null);
    });

    test("an UNDEFINED navigator.onLine (Node/SSR) still reads as reachable", () => {
        // Not `false` — undefined. A truthiness test here would read as offline
        // and silence every watchdog in the suite.
        setOnline(undefined);
        expect(connection.isReachable()).toBe(true);
        expect(connection.reason()).toBe(null);
    });

    test("an already-offline page load starts unreachable as `interface`", async () => {
        setOnline(false);
        vi.resetModules();
        const fresh = await import("@/utils/connection");
        expect(fresh.isReachable()).toBe(false);
        expect(fresh.reason()).toBe("interface");
        vi.resetModules();
    });
});

describe("markReachable / markUnreachable", () => {
    test("swaps state and notifies every subscriber", () => {
        const seen = [];
        const off = connection.subscribe((s) => seen.push(s));
        connection.markUnreachable("server");
        connection.markReachable();
        off();
        connection.markUnreachable("server");
        expect(seen.map((s) => [s.reachable, s.reason])).toEqual([
            [false, "server"],
            [true, null],
        ]);
        // Unsubscribed — the last mark did not notify.
        expect(seen).toHaveLength(2);
        expect(connection.isReachable()).toBe(false);
    });

    test("the snapshot is a NEW object per change", () => {
        // useSyncExternalStore infinite-loops on a mutated snapshot.
        const seen = [];
        const off = connection.subscribe((s) => seen.push(s));
        connection.markUnreachable("interface");
        connection.markReachable();
        off();
        expect(seen[0]).not.toBe(seen[1]);
    });

    test("re-reasoning while still unreachable republishes (the copy changes)", () => {
        const seen = [];
        const off = connection.subscribe((s) => seen.push(s));
        connection.markUnreachable("server");
        connection.markUnreachable("interface");
        off();
        expect(seen).toHaveLength(2);
        expect(seen[1].reachable).toBe(false);
        expect(seen[1].reason).toBe("interface");
    });

    test("an identical mark does not republish", () => {
        const seen = [];
        const off = connection.subscribe((s) => seen.push(s));
        connection.markUnreachable("server");
        connection.markUnreachable("server");
        connection.markReachable();
        connection.markReachable();
        off();
        expect(seen).toHaveLength(2);
    });
});

describe("probe — the only network call", () => {
    test("a captive portal's cross-origin redirect is NOT a success", async () => {
        // The portal 302s to its own login page on another origin and fetch
        // follows it — the origin check is what catches this.
        stubFetch(async () => ({
            ok: true,
            redirected: true,
            url: "http://portal.captive/login",
        }));
        expect(await connection.probe()).toBe(false);
        expect(connection.isReachable()).toBe(false);
        expect(connection.reason()).toBe("server");
    });

    test("a SAME-origin redirect is not a success either", async () => {
        // A proxy or a login hop that bounces /up somewhere on our own origin
        // still answers 200 after the redirect, so the origin check passes and
        // only the redirect check catches it.
        stubFetch(async () => ({
            ok: true,
            redirected: true,
            url: `${location.origin}/login`,
        }));
        expect(await connection.probe()).toBe(false);
        expect(connection.reason()).toBe("server");
    });

    test("a 200 on our own origin is reachable", async () => {
        const spy = stubFetch(async () => ok());
        expect(await connection.probe()).toBe(true);
        expect(connection.isReachable()).toBe(true);
        expect(spy).toHaveBeenCalledWith(
            "/up",
            expect.objectContaining({ cache: "no-store" }),
        );
    });

    test("a 200 with no redirect on our own origin is reachable", async () => {
        stubFetch(async () => ok());
        expect(await connection.probe()).toBe(true);
        expect(connection.isReachable()).toBe(true);
    });

    test("a 500 is unreachable", async () => {
        stubFetch(async () => ({ ok: false, redirected: false, url: `${location.origin}/up` }));
        expect(await connection.probe()).toBe(false);
        expect(connection.reason()).toBe("server");
    });

    test("a thrown fetch is unreachable", async () => {
        stubFetch(async () => {
            throw new TypeError("Failed to fetch");
        });
        expect(await connection.probe()).toBe(false);
        expect(connection.reason()).toBe("server");
    });

    test("a down interface never spends a request", async () => {
        const spy = stubFetch(async () => ok());
        setOnline(false);
        expect(await connection.probe()).toBe(false);
        expect(spy).not.toHaveBeenCalled();
        expect(connection.reason()).toBe("interface");
    });

    test("a hung probe aborts instead of freezing the tap forever", async () => {
        vi.useFakeTimers();
        stubFetch(
            (_url, opts) =>
                new Promise((_resolve, reject) => {
                    opts.signal.addEventListener("abort", () => reject(new Error("aborted")));
                }),
        );
        const pending = connection.probe();
        await vi.advanceTimersByTimeAsync(2500);
        expect(await pending).toBe(false);
        expect(connection.reason()).toBe("server");
    });

    test("a failed probe heals on the next success", async () => {
        stubFetch(async () => {
            throw new TypeError("Failed to fetch");
        });
        await connection.probe();
        expect(connection.isReachable()).toBe(false);
        stubFetch(async () => ok());
        expect(await connection.probe()).toBe(true);
        expect(connection.isReachable()).toBe(true);
        expect(connection.reason()).toBe(null);
    });
});

// ponytail: last, because initConnection() registers window/document listeners
// that are never removed (there is exactly one app per page in production).
describe("initConnection — the three listeners", () => {
    test("the browser offline event marks `interface` unreachable", () => {
        connection.initConnection();
        window.dispatchEvent(new Event("offline"));
        expect(connection.isReachable()).toBe(false);
        expect(connection.reason()).toBe("interface");
    });

    test("`online` flips reachable SYNCHRONOUSLY, before any later listener", () => {
        // DEADLOCK LOCK: useDeepgramRecognition's startConnection bails on
        // !isReachable(), and the hook registers its own `online` handler
        // (onBackOnline) at mount. If the store's handler were async — or
        // registered after it — the hook would bail and a LIVE round would
        // never reconnect. This asserts the store wins the race.
        connection.initConnection();
        const observed = [];
        window.addEventListener("online", () => observed.push(connection.isReachable()));
        window.dispatchEvent(new Event("online"));
        expect(observed).toEqual([true]);
        expect(connection.reason()).toBe(null);
    });

    test("a failed page visit marks `server` unreachable, for free", () => {
        // Inertia v2 fires this (cancelable, detail.exception) when a visit
        // request throws — i.e. the server could not be reached.
        connection.initConnection();
        document.dispatchEvent(new CustomEvent("inertia:exception", { detail: {} }));
        expect(connection.isReachable()).toBe(false);
        expect(connection.reason()).toBe("server");
    });
});
