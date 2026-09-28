// ponytail: a STATE dot, not a spinner and not "updated Ns ago". At 6 ticks/min
// both of those flash constantly and compete with the data they describe, and a
// teacher reads this once, at a glance. It is also what makes a 10s interval
// acceptable at all — without it, ten seconds of a static number reads as a
// broken app. Deliberately no `animate-*` class: see docs/CAVEATS.md on
// re-binding an existing animation to a second meaning.

const STATES = {
    live: {
        dot: "bg-accent",
        text: "text-accent",
        label: "Live",
        title: "Updating every 10 seconds",
    },
    paused: {
        dot: "bg-amber-400",
        text: "text-amber-400",
        label: "Paused",
        title: "Not updating — this tab is in the background",
    },
    offline: {
        dot: "bg-error",
        text: "text-error",
        label: "Offline",
        // No RETRY here, deliberately. useLiveStats must never call
        // markUnreachable on a poll failure (a background heartbeat must not
        // lock app-wide connectivity), so on a polling page this dot is often
        // the ONLY signal — and the modal it used to point at is deliberately
        // not open. Telling a teacher to "tap RETRY" here sent them after a
        // button that is not on the page. It self-heals instead: the next
        // successful poll calls markReachable() and flips this back to Live.
        title: "Can't reach the server — this view resumes on its own once the connection returns",
    },
    // NOT "Live". Past the report deadline, saveWordProgress takes the
    // $isPractice branch (StudentController.php:496-551): no GameSession, no
    // students denorm write. Both halves of the watermark are frozen for good,
    // so these numbers can never move from gameplay again. A green "Live" dot
    // over provably final numbers is the same defect as claiming "you're on
    // Wi-Fi" on a phone that is on mobile data.
    final: {
        dot: "bg-outline",
        text: "text-outline",
        label: "Final",
        title: "The report deadline has passed — these numbers are final",
    },
};

export default function LiveStatusDot({ status }) {
    const s = STATES[status];
    if (!s) return null;

    return (
        <span className="inline-flex items-center gap-2" title={s.title}>
            <span
                aria-hidden="true"
                className={`w-2 h-2 rounded-full ${s.dot}`}
            />
            <span
                className={`font-black uppercase text-[10px] sm:text-xs tracking-widest ${s.text}`}
            >
                {s.label}
            </span>
        </span>
    );
}

export { STATES as LIVE_STATES };
