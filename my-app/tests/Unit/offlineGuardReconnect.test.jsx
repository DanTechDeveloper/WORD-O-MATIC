// @vitest-environment happy-dom
// ponytail: the ONE behaviour with no coverage. offlineGuard.test.js only
// asserts source substrings, so "does the Connected! popup actually appear on
// an automatic reconnect" was never verified by anything — it shipped broken
// once already (restored was reachable only from the RETRY button).
import { render, screen, waitFor, act } from "@testing-library/react";
import OfflineGuard from "@/Components/Shared/OfflineGuard";

const { resetConnection, isReachable } = await import("@/utils/connection");

let fetchMock;

beforeEach(() => {
    resetConnection();
    fetchMock = vi.fn();
    global.fetch = fetchMock;
});

afterEach(() => {
    vi.restoreAllMocks();
});

// A reachable /up. `probe()` also checks res.url against location.origin, so the
// stub has to be a real-looking same-origin response, not `{ ok: true }`.
const serverUp = () =>
    fetchMock.mockResolvedValue({
        ok: true,
        redirected: false,
        url: `${location.origin}/up`,
        json: async () => ({}),
    });

const fire = (name) => act(() => { window.dispatchEvent(new Event(name)); });

describe("OfflineGuard — automatic reconnect (the real thing, not a source grep)", () => {
    test("shows Connected! when the browser fires `online` and the server answers", async () => {
        serverUp();
        render(<OfflineGuard />);

        // 1. Link drops. The modal must open.
        fire("offline");
        expect(isReachable()).toBe(false);
        await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());
        expect(screen.getByText("No Connection")).toBeTruthy();
        expect(screen.queryByText("Connected!")).toBeNull();

        // 2. Link returns. NO button tapped — this is the path that was broken.
        fetchMock.mockClear();
        fire("online");

        // 3. The celebration must actually render, not just setState.
        await waitFor(() => expect(screen.getByText("Connected!")).toBeTruthy());
        expect(screen.getByText("Connection restored! You are back online.")).toBeTruthy();
        // ...and it must have PROVED the server, not trusted the event.
        expect(fetchMock).toHaveBeenCalled();
        expect(fetchMock.mock.calls[0][0]).toBe("/up");
    });

    test("a cold container that answers LATE still counts as restored", async () => {
        // The reported bug. The first request after a link returns pays a
        // Vercel Container cold boot that routinely exceeds the 2500ms
        // round-start budget. At that budget the abort fired, probe() called
        // markUnreachable("server") on a perfectly healthy server, and the
        // modal said "still offline" instead of "Connected!" — so the
        // celebration never appeared at all.
        vi.useFakeTimers();
        let release;
        // The stub MUST honour `signal`, or it is not a fetch: a real one
        // rejects on abort, and probe() relies on that to give up. A mock that
        // ignores the signal hangs past the timeout, so the budget change would
        // be untestable and this test would pass either way.
        fetchMock.mockImplementation((url, opts) => new Promise((resolve, reject) => {
            release = () => resolve({
                ok: true,
                redirected: false,
                url: `${location.origin}/up`,
                json: async () => ({}),
            });
            opts.signal.addEventListener("abort", () => reject(new Error("Aborted")));
        }));
        render(<OfflineGuard />);
        fire("offline");
        await act(async () => { vi.advanceTimersByTime(0); });
        expect(screen.getByRole("dialog")).toBeTruthy();

        fire("online");
        // Past the old 2500ms abort. With the recovery budget the request is
        // still in flight; with the old one it would already be dead.
        await act(async () => { vi.advanceTimersByTime(3000); });
        expect(screen.queryByText("Connected!")).toBeNull();

        // Now the cold container finally answers.
        await act(async () => {
            release();
            await Promise.resolve();
        });
        await act(async () => { vi.advanceTimersByTime(1); });

        expect(screen.getByText("Connected!")).toBeTruthy();
        vi.useRealTimers();
    });

    test("a captive-portal-style answer does not count as restored", async () => {
        // An access point that re-associated with no uplink: fetch resolves but
        // the response is not our server. probe() is fail-closed, so no
        // celebration — the modal stays honest.
        serverUp();
        render(<OfflineGuard />);
        fire("offline");
        await waitFor(() => expect(screen.getByRole("dialog")).toBeTruthy());

        fetchMock.mockResolvedValue({
            ok: true,
            redirected: true,
            url: "http://captive-portal.local/login",
            json: async () => ({}),
        });
        fire("online");

        await waitFor(() => expect(screen.getByText("No Internet")).toBeTruthy());
        expect(screen.queryByText("Connected!")).toBeNull();
    });
});
