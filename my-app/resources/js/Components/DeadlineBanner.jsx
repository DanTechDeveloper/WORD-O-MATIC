import { usePage } from "@inertiajs/react";
import { getDeadlineInfo, formatDeadlineDate } from "@/hooks/Student/useDeadlineStatus";

export default function DeadlineBanner({ isDeadlineClosed, message, deadline: deadlineProp }) {
    const pageDeadline = usePage().props.auth?.deadline ?? deadlineProp ?? null;
    const info = getDeadlineInfo(pageDeadline);

    // Custom message path (GameResults deadlineHit + teacher layout) — respect explicit isDeadlineClosed
    if (message) {
        if (!isDeadlineClosed && info.phase !== "closed") return null;
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                </span>
                <p className="text-amber-600 font-semibold">{message}</p>
            </div>
        );
    }

    // Backward compat: explicit boolean closed still wins (teacher/GameResults callers)
    if (isDeadlineClosed) {
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                </span>
                <p className="text-amber-600 font-semibold">
                    The Great Word Challenge is taking a break! Your points are safe — play again soon for a brand-new adventure!
                </p>
            </div>
        );
    }

    if (info.phase === "none" || !info.deadlineDate) return null;

    if (info.phase === "closed") {
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                </span>
                <p className="text-amber-600 font-semibold">
                    The Great Word Challenge is taking a break! Your points are safe. play again soon for a brand-new adventure!
                </p>
            </div>
        );
    }

    const formatted = formatDeadlineDate(info.deadlineDate);

    if (info.phase === "approaching") {
        const timeLeft = info.hoursLeft < 24 ? `${info.hoursLeft} hour${info.hoursLeft !== 1 ? "s" : ""}` : `${info.daysLeft} day${info.daysLeft !== 1 ? "s" : ""}`;
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    warning
                </span>
                <p className="text-amber-600 font-semibold">
                    Deadline approaching! Only {timeLeft} left until {formatted}. play now to beat the deadline!
                </p>
            </div>
        );
    }

    // upcoming — more than 3 days left, still show deadline so student can plan
    const days = `${info.daysLeft} day${info.daysLeft !== 1 ? "s" : ""}`;
    return (
        <div className="mb-6 p-4 bg-sky-500/10 border border-sky-500 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined text-sky-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                calendar_month
            </span>
            <p className="text-sky-700 font-semibold">
                Heads up! Deadline is {formatted}. {days} left. Play now. Your points count until then!
            </p>
        </div>
    );
}
