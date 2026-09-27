import { useEffect, useRef, useState } from "react";
import { isReachable, markReachable } from "@/utils/connection";

// ponytail: TEACHER-ONLY, and deliberately not shared with the student side.
// 40 kids sharing devices is a different cost shape than one teacher watching a
// dashboard, and utils/connection.js still holds its no-polling rule for the
// student runtime. Do not import this from a Student/ page.
//
// 10s, not 3s, and not because of cost. During an ACTIVE class the watermark is
// barely a gate at all — 40 staggered 60s rounds finish roughly one every 1.5s,
// so nearly every tick is a full payload and the poll runs +2.5% (Leaderboards)
// to +11% (Students) on top of the class's own ~480 queries/min. Cost never got
// to pick the number: 10s is the top of the range a human reads as live (~5s
// average is tolerable, ~10s is the boundary), and a kid's round is 60s and only
// mutates at the end, so no interval can report sooner than the POST itself.
const POLL_MS = 10000;

// Backoff on consecutive failures: 10 → 20 → 40 → 60s, then flat. Without it a
// sustained outage costs 6 requests/min forever, and — because a server outage
// never fires the window "online" event — the poll would have no reason to ever
// try again. This is the self-heal; see the failure note below.
const MAX_BACKOFF_MS = 60000;
const backoffMs = (fails) =>
    Math.min(POLL_MS * 2 ** Math.max(0, fails - 1), MAX_BACKOFF_MS);

// Two consecutive failures before the dot turns red. One dropped packet is not
// an outage, and a red dot that flickers is worse than no dot — the same reason
// there is no spinner.
const MAX_FAILURES = 2;

// status is one of:
//   "live"    — polling, last poll succeeded
//   "paused"  — tab hidden; nobody is looking, so nobody pays
//   "offline" — unreachable, or our own last poll failed
//   "final"   — the report deadline passed, so the numbers can never move
//
// NO spinner and NO "updated Ns ago": at 6 ticks/min both flash constantly and
// compete with the data they describe. A state dot is read once, at a glance.
// See docs/CAVEATS.md — this codebase already got burned re-binding an existing
// animation to a second meaning.
export function useLiveStats({
    endpoint = "/teacher/live-stats",
    enabled = true,
} = {}) {
    const [data, setData] = useState(null);
    const [status, setStatus] = useState("live");
    const sinceRef = useRef(null);
    const failsRef = useRef(0);
    const nextAllowedRef = useRef(0);
    // One ref for both options so a changing prop never re-runs the effect (and
    // never restarts the interval). `enabled` MUST be read live, not latched at
    // mount: the teacher can clear or extend the deadline from /teacher/reports,
    // and that has to un-freeze the poll on the next visit.
    const optsRef = useRef({ endpoint, enabled });
    optsRef.current = { endpoint, enabled };

    useEffect(() => {
        let mounted = true;

        // Early-return inside the tick rather than starting/stopping the
        // interval. A no-op timer callback every 10s is free; tearing the
        // interval down on hide and back up on show invites races (hidden 1ms
        // before the tick?) for zero gain. The backoff below is a timestamp
        // check for the same reason — no timer surgery.
        const tick = async () => {
            const { endpoint: url, enabled: on } = optsRef.current;

            // Gate A — the report deadline. Post-cutoff, saveWordProgress takes
            // the $isPractice branch (StudentController.php:496-551): no
            // GameSession, no students denorm write. Both halves of the
            // watermark are therefore frozen for good and the poll can never
            // report a change from gameplay again — so a green "Live" dot over
            // provably final numbers would be a lie.
            if (!on) {
                if (mounted) setStatus("final");
                return;
            }
            // Backoff gate — cheapest check first, and it is the common case
            // while the server is down.
            if (Date.now() < nextAllowedRef.current) {
                if (mounted) setStatus("offline");
                return;
            }
            // Gate B — visibilityState is PER-TAB, so a teacher with five tabs
            // open polls exactly one of them. The strongest gate, and free.
            if (document.visibilityState !== "visible") {
                if (mounted) setStatus("paused");
                return;
            }
            // Gate C — the connection store, the ONLY thing this hook and
            // OfflineGuard share. Never the modal: CANCEL leaves the store
            // unreachable on purpose, and keying off the modal would restart
            // polling the moment it was dismissed over a dead link.
            if (!isReachable()) {
                if (mounted) setStatus("offline");
                return;
            }

            // The page's OWN query string is its filter set — every filter
            // change goes through router.get, which Inertia writes to the URL.
            // Reusing it means the live payload is filtered identically by
            // construction, with no params to thread and no drift to test for.
            const q = new URLSearchParams(window.location.search);
            if (sinceRef.current) q.set("since", sinceRef.current);

            try {
                const res = await fetch(`${url}?${q}`, {
                    headers: { Accept: "application/json" },
                    cache: "no-store",
                });
                if (!res.ok) throw new Error(`live-stats ${res.status}`);
                const json = await res.json();
                if (!mounted) return;
                failsRef.current = 0;
                nextAllowedRef.current = 0;
                // A poll that succeeds PROVES the server is back. This is the
                // self-heal for a false positive left by a genuine
                // inertia:exception, which only the window "online" event or a
                // RETRY probe would otherwise clear.
                markReachable();
                setStatus("live");
                // The idle case, and the only tick that touches nothing: no
                // state write, no re-render. The server's watermark already
                // proved it.
                //
                // `=== false`, not falsy: a 200 with an UNEXPECTED shape (a
                // stray HTML page, a renamed field) must NOT read as "nothing
                // changed" — that would freeze the poll forever behind a green
                // "Live" dot. Anything but an explicit boolean is a fault, and
                // it goes down the failure path: backoff, retry, red dot.
                if (json.changed === false) return;
                if (json.changed !== true || !json.watermark) {
                    throw new Error("unexpected live-stats shape");
                }
                sinceRef.current = json.watermark;
                setData(json);
            } catch {
                if (!mounted) return;
                // ponytail: LOCAL failure. This used to call
                // markUnreachable("server"), which was wrong twice over. It
                // locked the whole app's connectivity from a background
                // heartbeat — a server outage never fires the window "online"
                // event and a successful POST does not call markReachable, so
                // the dot stayed red and polling stayed dead until F5. And it
                // wrote to a store useDeepgramRecognition also reads, letting a
                // teacher dashboard reach into the student runtime's connection
                // state. A real outage is still reported properly: the instant
                // the teacher saves something, that request fails →
                // inertia:exception → OfflineGuard's own listener raises.
                const fails = ++failsRef.current;
                nextAllowedRef.current = Date.now() + backoffMs(fails);
                if (fails >= MAX_FAILURES && mounted) setStatus("offline");
            }
        };

        const id = setInterval(tick, POLL_MS);
        // Also poll on the way back IN, so a teacher returning to a stale tab
        // gets current data immediately instead of waiting out the interval.
        document.addEventListener("visibilitychange", tick);
        return () => {
            mounted = false;
            clearInterval(id);
            document.removeEventListener("visibilitychange", tick);
        };
    }, []);

    return { data, status };
}

export default useLiveStats;
