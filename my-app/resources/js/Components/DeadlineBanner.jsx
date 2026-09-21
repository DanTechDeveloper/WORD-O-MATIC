import { usePage } from "@inertiajs/react";
import { getDeadlineInfo, formatDeadlineDate } from "@/hooks/Student/useDeadlineStatus";

export default function DeadlineBanner({ message, deadline: deadlineProp }) {
    const pageDeadline = usePage().props.auth?.deadline ?? deadlineProp ?? null;
    const info = getDeadlineInfo(pageDeadline);

    if (message) {
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    emoji_events
                </span>
                <p className="text-amber-600 font-semibold">{message}</p>
            </div>
        );
    }

    if (info.phase === "none" || !info.deadlineDate) return null;

    if (info.phase === "closed") {
        const formatted = formatDeadlineDate(info.deadlineDate);
        return (
            <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
                <span className="material-symbols-outlined text-amber-600" style={{ fontVariationSettings: "'FILL' 1" }}>
                    school
                </span>
                <p className="text-amber-600 font-semibold">
                    Practice mode. you can still play until {formatted}, but scores won’t save while reports are closed.
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
