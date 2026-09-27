// @vitest-environment happy-dom
// ponytail: architecture rules are file-content checks (same idiom as
// offlineGuard.test.js); the behaviours that can actually regress are real unit
// tests against the hook.

import fs from "fs";
import { renderHook, act, waitFor } from "@testing-library/react";
import { useLiveStats } from "@/hooks/Teacher/useLiveStats";
import { isReachable, resetConnection } from "@/utils/connection";

const read = (p) => fs.readFileSync(p, "utf8");
// Several of these files explain a rule in a comment that quotes the code it
// replaced ("this used to call markUnreachable", "deliberately no `animate-*`").
// Prose is not code, so any negative lock has to read CODE only — same trick as
// offlineGuard.test.js:72.
const codeOnly = (src) =>
    src
        .split("\n")
        .filter((line) => !line.trim().startsWith("//") && !line.trim().startsWith("*"))
        .join("\n");

const hook = read("resources/js/hooks/Teacher/useLiveStats.js");
const chip = read("resources/js/Components/Shared/LiveStatusDot.jsx");
const dashboard = read("resources/js/Pages/Teacher/Dashboard.jsx");
const students = read("resources/js/Pages/Teacher/Students.jsx");
const details = read("resources/js/Pages/Teacher/StudentDetails.jsx");
const boards = read("resources/js/Pages/Teacher/Leaderboards.jsx");
const badges = read("resources/js/Pages/Teacher/Badges.jsx");
const reports = read("resources/js/Pages/Teacher/Reports.jsx");
const sidebar = read("resources/js/Components/Teacher/Sidebar.jsx");
const guard = read("resources/js/Components/Shared/OfflineGuard.jsx");
const routes = read("routes/web.php");
const controller = read("app/Http/Controllers/TeacherController.php");

// The comment in the hook explains WHY these filters come from the URL.
const hookCode = codeOnly(hook);

describe("live polling — the contract", () => {
    test("interval is 10000ms, from a named constant", () => {
        expect(hook).toContain("const POLL_MS = 10000;");
        expect(hook).toContain("setInterval(tick, POLL_MS)");
    });

    test("backs off on consecutive failures, so a sustained outage self-heals", () => {
        // Without this the poll would stop dead: a SERVER outage never fires the
        // window "online" event, and a successful POST does not call
        // markReachable, so nothing would ever make it try again.
        expect(hook).toContain("const MAX_BACKOFF_MS = 60000;");
        expect(hook).toContain("2 ** Math.max(0, fails - 1)");
        expect(hook).toContain("nextAllowedRef.current = Date.now() + backoffMs(fails)");
    });

    test("pauses on a hidden tab and polls again on the way back", () => {
        // visibilityState is PER-TAB, so this is what makes N tabs cost 1 poll.
        expect(hook).toContain('document.visibilityState !== "visible"');
        expect(hook).toContain('document.addEventListener("visibilitychange", tick)');
        expect(hook).toContain('document.removeEventListener("visibilitychange", tick)');
        expect(hook).toContain("clearInterval(id)");
    });

    test("never sends a request while unreachable", () => {
        expect(hook).toContain("if (!isReachable()) {");
    });

    test("changed:false touches no state — an idle tick renders nothing", () => {
        // `=== false`, NOT falsy: an unexpected 200 shape must not read as
        // "unchanged" or the poll freezes forever behind a green "Live" dot.
        expect(hook).toContain("if (json.changed === false) return;");
        expect(hook).toContain("if (json.changed !== true || !json.watermark) {");
    });

    test("one dropped packet does not turn the dot red; two do", () => {
        expect(hook).toContain("const MAX_FAILURES = 2;");
        expect(hook).toContain("if (fails >= MAX_FAILURES && mounted) setStatus(\"offline\");");
    });

    // REGRESSION GUARD. This used to call markUnreachable("server") from a
    // background heartbeat, which was wrong twice over: it locked the whole app's
    // connectivity with no recovery short of F5 (a server outage never fires the
    // window "online" event), and it wrote to a store useDeepgramRecognition
    // also reads, letting a teacher page reach into the student runtime.
    test("a poll failure is LOCAL — it must never write the shared store", () => {
        expect(hookCode).not.toContain("markUnreachable");
    });

    // A poll that succeeds PROVES the server is back, which clears a false
    // positive left by a genuine inertia:exception.
    test("a poll success does flip the store — that is the self-heal", () => {
        expect(hook).toContain("markReachable();");
    });

    test("the deadline gate reports `final`, not `live`", () => {
        // Post-cutoff, saveWordProgress takes the $isPractice branch
        // (StudentController.php:496-551): no GameSession, no students denorm
        // write. Both watermark halves are frozen for good, so a green "Live"
        // dot over provably final numbers is a lie.
        expect(hook).toContain('setStatus("final")');
    });

    test("reads the page's own query string, so filters cannot drift", () => {
        // Every filter change goes through router.get, which Inertia writes to
        // the URL. Reusing it means the live payload is filtered identically by
        // construction — no params to thread, nothing to test for.
        expect(hook).toContain("new URLSearchParams(window.location.search)");
        expect(hook).toContain('q.set("since", sinceRef.current)');
    });

    test("endpoint is a parameter with the dashboard default", () => {
        expect(hook).toContain('endpoint = "/teacher/live-stats"');
        expect(hook).toContain("optsRef.current = { endpoint, enabled }");
    });

    test("raw fetch, never router.get", () => {
        // A router.get poll replaces page props, which re-fires
        // DashboardLayout's useEffect([searchResults]) -> setActiveIndex(-1) and
        // resets the teacher's search selection on every tick.
        expect(hookCode).toContain("fetch(`${url}?${q}`");
        expect(hookCode).not.toContain("router");
    });

    test("students never poll — the 40-kids rule stands", () => {
        const studentRuntime = fs
            .readdirSync("resources/js/hooks/Student")
            .filter((f) => f.endsWith(".js"))
            .map((f) => read(`resources/js/hooks/Student/${f}`))
            .join("\n");
        expect(studentRuntime).not.toContain("useLiveStats");
        expect(studentRuntime).not.toContain("live-");
    });
});

describe("the indicator is a state, not a tick", () => {
    test("exactly four states, and none of them animates", () => {
        expect(chip).toContain("live:");
        expect(chip).toContain("paused:");
        expect(chip).toContain("offline:");
        expect(chip).toContain("final:");
        // 6 ticks/min: a spinner or "updated Ns ago" flickers constantly and
        // competes with the data. Re-binding an existing animation to a new
        // meaning is what docs/CAVEATS.md records as the animate-pulse bug.
        expect(codeOnly(chip)).not.toContain("animate-");
    });

    test("reads live and paused copy in the teacher's language", () => {
        expect(chip).toContain("Updating every 10 seconds");
        expect(chip).toContain("this tab is in the background");
    });

    test("the final state says the numbers are final, not live", () => {
        expect(chip).toContain("these numbers are final");
    });
});

describe("the five polling pages", () => {
    const pages = {
        Dashboard: dashboard,
        Students: students,
        StudentDetails: details,
        Leaderboards: boards,
        Badges: badges,
    };

    for (const [name, src] of Object.entries(pages)) {
        test(`${name} polls and gates on the deadline`, () => {
            expect(src).toContain("useLiveStats(");
            expect(src).toContain(
                'getDeadlineInfo(usePage().props.auth?.deadline).phase === "closed"',
            );
            expect(src).toContain("LiveStatusDot");
        });
    }

    test("Reports is excluded — and by the same gate, not a special case", () => {
        // isPastDeadline (Reports.jsx:37) IS phase === "closed", and the Notify
        // Parents workflow only unlocks after it. So the one gate already covers
        // this page — polling there would run while it is read-only and stop
        // while it is actionable.
        expect(reports).not.toContain("useLiveStats");
        expect(reports).toContain("!isPastDeadline");
    });

    test("the four non-polling teacher pages are untouched", () => {
        for (const p of ["Word", "Paragraph", "Settings", "Thanks"]) {
            expect(read(`resources/js/Pages/Teacher/${p}.jsx`)).not.toContain(
                "useLiveStats",
            );
        }
    });

    test("Students keeps existingIds on the SERVER prop", () => {
        // live-students omits existingStudentIds — it derives from
        // users.student_id, which no round touches — so the duplicate check must
        // not read the live payload.
        expect(students).toContain("existingStudentIds || []");
    });
});

describe("Sidebar active state", () => {
    test("compares pathname, not the full url", () => {
        // usePage().url carries the query string, so `url === item.href` left
        // /teacher/students?sort=level unhighlighted. Same fix as the student
        // sidebar (Student/DashboardLayout.jsx:6).
        expect(sidebar).toContain('url.split("?")[0] === item.href');
        // The comment above quotes the old code verbatim, so the negative check
        // has to read CODE only — same trick as offlineGuard.test.js:72.
        const code = sidebar
            .split("\n")
            .filter((line) => !line.trim().startsWith("//"))
            .join("\n");
        expect(code).not.toContain("url === item.href");
    });
});

describe("the endpoints", () => {
    test("all five are registered inside the role:teacher group", () => {
        for (const [route, method] of [
            ["live-stats", "liveStats"],
            ["live-students", "liveStudents"],
            ["live-student/{student}", "liveStudent"],
            ["live-leaderboards", "liveLeaderboards"],
            ["live-badges", "liveBadges"],
        ]) {
            expect(routes).toContain(
                `Route::get('/${route}', [TeacherController::class, '${method}'])`,
            );
        }
    });

    test("never cached by the browser", () => {
        expect(controller).toContain("'Cache-Control' => 'no-store'");
    });

    test("watermark is COMPOSITE — both halves are load-bearing", () => {
        // students.updated_at alone would silently drop badge awards: a round
        // that improved nothing never calls $student->update(), yet
        // checkGameplayBadges() still runs and can award off that session.
        expect(controller).toContain("StudentProfile::max('updated_at')");
        expect(controller).toContain("GameSession::max('id')");
    });

    test("one shared protocol helper — no per-view copy of the rules", () => {
        // Every view reuses its own page method's query code so a live payload
        // cannot drift from what the page rendered.
        expect(controller).toContain("private function liveJson(Request $request, array $payload)");
        for (const call of [
            "return $this->liveJson($request, $this->dashboardStats());",
            "return $this->liveJson($request, array_merge($user->toArray()",
            "'leaderboard' => $props['leaderboard']",
            "'topEarners' => $props['topEarners']",
        ]) {
            expect(controller).toContain(call);
        }
    });

    test("each view shares the page builder, not a re-derived query", () => {
        for (const shared of [
            "studentsPage($request)",
            "leaderboardPage($request)",
            "badgesPage($request)",
        ]) {
            expect(controller).toContain(shared);
            expect(controller.split(shared).length - 1).toBeGreaterThanOrEqual(2);
        }
    });

    test("live-students omits the two non-volatile fields", () => {
        const fn = controller.slice(
            controller.indexOf("public function liveStudents"),
            controller.indexOf("public function liveStudent("),
        );
        expect(fn).not.toContain("existingStudentIds");
        expect(fn).not.toContain("sectionList");
    });

    test("an unchanged watermark short-circuits before any aggregation", () => {
        expect(controller).toContain("$since !== null && $since === $watermark");
        expect(controller).toContain("'changed' => false");
    });
});

describe("OfflineGuard and the poll never touch each other", () => {
    test("the guard funnels every raise through the shared store", () => {
        // This is the ONLY thing that makes the modal stop the poll. CANCEL is a
        // bare setOffline(false) and leaves the store unreachable on purpose —
        // keying the poll off the modal would restart polling over a dead link.
        expect(guard).toContain("markUnreachable(why);");
        expect(guard).toContain("onClick={() => setOffline(false)}");
    });

    test("the poll imports the store and never the guard", () => {
        expect(hook).toContain('from "@/utils/connection"');
        expect(hookCode).not.toContain("OfflineGuard");
    });
});

describe("useLiveStats behaviour", () => {
    let fetchMock;
    let visState;

    beforeEach(() => {
        // The connection store is a module singleton. Without this reset a test
        // that deliberately marked it unreachable would make every later test
        // bail on the !isReachable() gate and never fetch at all.
        resetConnection();
        visState = "visible";
        Object.defineProperty(document, "visibilityState", {
            configurable: true,
            get: () => visState,
        });
        fetchMock = vi.fn();
        global.fetch = fetchMock;
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    const tick = () => act(async () => {
        document.dispatchEvent(new Event("visibilitychange"));
    });

    const ok = (body) => ({ ok: true, json: async () => body });

    test("an unreachable store stops the poll with zero requests", async () => {
        const { markUnreachable } = await import("@/utils/connection");
        markUnreachable("server");
        const { result } = renderHook(() => useLiveStats());

        await tick();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.current.status).toBe("offline");
    });

    test("a store that recovers resumes the poll", async () => {
        const conn = await import("@/utils/connection");
        conn.markUnreachable("server");
        const { result, rerender } = renderHook(() => useLiveStats());
        await tick();
        expect(fetchMock).not.toHaveBeenCalled();

        conn.markReachable();
        fetchMock.mockResolvedValue(ok({ changed: false, watermark: "w" }));
        await tick();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        expect(result.current.status).toBe("live");
        rerender();
    });

    // The bug this feature shipped with: the hook used to call
    // markUnreachable("server") on its own second failure, which locked the app.
    test("a poll failure does NOT flip the shared store, and a success resumes", async () => {
        // The backoff gate is a Date.now() comparison, so the clock has to be
        // mockable to test the recovery. setup.js restores real timers per test.
        vi.useFakeTimers();
        fetchMock.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useLiveStats());

        await tick();
        await tick();

        // The dot is honest, but the global store is untouched — the student
        // ASR's reachability state is not a teacher dashboard's business.
        expect(result.current.status).toBe("offline");
        expect(isReachable()).toBe(true);

        // ...and it self-heals with no page reload, because a successful poll
        // proves the server is back.
        fetchMock.mockResolvedValue(ok({ changed: true, watermark: "w1", totalStudents: 3 }));
        await act(async () => {
            vi.advanceTimersByTime(60000);
            document.dispatchEvent(new Event("visibilitychange"));
            await Promise.resolve();
        });

        expect(result.current.data?.totalStudents).toBe(3);
        expect(result.current.status).toBe("live");
    });

    test("one failure does not turn the dot red, and the next tick backs off", async () => {
        fetchMock.mockRejectedValue(new Error("offline"));
        const { result } = renderHook(() => useLiveStats());

        await tick();
        expect(fetchMock).toHaveBeenCalledTimes(1);
        // MAX_FAILURES is 2 — a single dropped packet must not turn the dot red.
        expect(result.current.status).toBe("live");

        // Immediately after, the backoff timestamp blocks the next attempt.
        await tick();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        // Two failures and the dot is honest about it.
        await act(async () => {
            vi.useFakeTimers();
            vi.advanceTimersByTime(60000);
            document.dispatchEvent(new Event("visibilitychange"));
        });
        expect(result.current.status).toBe("offline");
    });

    test("a hidden tab sends no request at all", async () => {
        visState = "hidden";
        const { result } = renderHook(() => useLiveStats());

        await tick();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.current.status).toBe("paused");
    });

    test("enabled:false sends nothing and reports final", async () => {
        const { result } = renderHook(() => useLiveStats({ enabled: false }));

        await tick();

        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.current.status).toBe("final");
    });

    test("changed:false leaves data alone; changed:true replaces it", async () => {
        fetchMock
            .mockResolvedValueOnce(ok({ changed: true, watermark: "w1", totalStudents: 7 }))
            .mockResolvedValueOnce(ok({ changed: false, watermark: "w1" }))
            .mockResolvedValueOnce(ok({ changed: true, watermark: "w2", totalStudents: 9 }));

        const { result } = renderHook(() => useLiveStats());

        await tick();
        await waitFor(() => expect(result.current.data?.totalStudents).toBe(7));

        await tick();
        await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
        expect(result.current.data?.totalStudents).toBe(7);

        await tick();
        await waitFor(() => expect(result.current.data?.totalStudents).toBe(9));
    });

    test("the first poll sends no since; later polls send the watermark", async () => {
        fetchMock.mockResolvedValue(
            ok({ changed: true, watermark: "2026-01-01T00:00:00Z|42" }),
        );

        const { result } = renderHook(() => useLiveStats());
        await tick();
        expect(fetchMock.mock.calls[0][0]).toBe("/teacher/live-stats?");

        await tick();
        expect(fetchMock.mock.calls[1][0]).toContain(
            "since=2026-01-01T00%3A00%3A00Z%7C42",
        );
        expect(result.current.status).toBe("live");
    });

    test("forwards the page's filters and a custom endpoint", async () => {
        window.history.replaceState({}, "", "/teacher/students?status=atRisk&sort=risk&page=2");
        fetchMock.mockResolvedValue(ok({ changed: false, watermark: "w" }));

        renderHook(() => useLiveStats({ endpoint: "/teacher/live-students" }));
        await tick();

        const url = fetchMock.mock.calls[0][0];
        expect(url.startsWith("/teacher/live-students?")).toBe(true);
        expect(url).toContain("status=atRisk");
        expect(url).toContain("sort=risk");
        expect(url).toContain("page=2");
        window.history.replaceState({}, "", "/");
    });

    // The teacher clicks a Link while a poll is in flight. The mounted ref
    // exists for exactly this; without it the late response calls setData on a
    // component Inertia has already replaced.
    test("a response that lands after unmount is discarded", async () => {
        let release;
        fetchMock.mockReturnValue(
            new Promise((resolve) => {
                release = () => resolve(ok({ changed: true, watermark: "w1", totalStudents: 5 }));
            }),
        );

        const { result, unmount } = renderHook(() => useLiveStats());
        await tick();
        expect(fetchMock).toHaveBeenCalledTimes(1);

        unmount();
        release();
        await act(async () => {
            await Promise.resolve();
        });

        expect(result.current.data).toBeNull();
    });

    // Risk 3 in the plan. `enabled` is read through a ref every tick rather than
    // latched at mount, so clearing the deadline from /teacher/reports un-freezes
    // the poll on the same mounted page — no reload, no lost interval.
    test("enabled is re-read each tick, not latched at mount", async () => {
        fetchMock.mockResolvedValue(ok({ changed: true, watermark: "w1", totalStudents: 2 }));
        const { result, rerender } = renderHook(
            ({ on }) => useLiveStats({ enabled: on }),
            { initialProps: { on: false } },
        );

        await tick();
        expect(fetchMock).not.toHaveBeenCalled();
        expect(result.current.status).toBe("final");

        rerender({ on: true });
        await tick();

        expect(fetchMock).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(result.current.data?.totalStudents).toBe(2));
        expect(result.current.status).toBe("live");
    });

    test("a non-OK response is a failure, not a silent no-op", async () => {
        fetchMock.mockResolvedValue({ ok: false, status: 500, json: async () => ({}) });
        const { result } = renderHook(() => useLiveStats());

        await tick();
        await tick();

        expect(result.current.status).toBe("offline");
        expect(result.current.data).toBeNull();
    });

    // A 200 that is not our JSON — a proxy error page, a login redirect. The
    // .json() rejection must land on the failure path, not be swallowed.
    test("a non-JSON 200 body is a failure", async () => {
        fetchMock.mockResolvedValue({
            ok: true,
            json: async () => {
                throw new SyntaxError("Unexpected token < in JSON");
            },
        });
        const { result } = renderHook(() => useLiveStats());

        await tick();
        await tick();

        expect(result.current.status).toBe("offline");
    });

    // A 200 with a plausible-but-wrong shape must never read as "unchanged" —
    // that would freeze the poll forever behind a green "Live" dot.
    test("a 200 with an unexpected shape is a fault, not 'unchanged'", async () => {
        fetchMock.mockResolvedValue(ok({ data: { totalStudents: 4 } }));
        const { result } = renderHook(() => useLiveStats());

        await tick();
        await tick();

        expect(result.current.data).toBeNull();
        expect(result.current.status).toBe("offline");
    });

    test("changed:true without a watermark is a fault", async () => {
        fetchMock.mockResolvedValue(ok({ changed: true, totalStudents: 4 }));
        const { result } = renderHook(() => useLiveStats());

        await tick();
        await tick();

        expect(result.current.data).toBeNull();
        expect(result.current.status).toBe("offline");
    });
});
