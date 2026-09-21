import { usePage } from "@inertiajs/react";

// ponytail: single file for deadline — helpers + hook, no extra utils/deadline.js (fewer files wins)
export function getDeadlineInfo(deadline) {
    if (!deadline) return { phase: "none", deadlineDate: null, daysLeft: 0, hoursLeft: 0 };
    const d = new Date(deadline);
    if (Number.isNaN(d.getTime())) return { phase: "none", deadlineDate: null, daysLeft: 0, hoursLeft: 0 };
    const now = new Date();
    const diff = d.getTime() - now.getTime();
    if (diff <= 0) return { phase: "closed", deadlineDate: d, daysLeft: 0, hoursLeft: 0 };
    const hoursLeft = Math.ceil(diff / (1000 * 60 * 60));
    const daysLeft = Math.ceil(diff / (1000 * 60 * 60 * 24));
    const phase = daysLeft <= 3 ? "approaching" : "upcoming";
    return { phase, deadlineDate: d, daysLeft, hoursLeft };
}

export function formatDeadlineDate(date) {
    if (!date) return "";
    return date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function useDeadlineStatus() {
    const deadline = usePage().props.auth?.deadline;
    return !!(deadline && new Date(deadline) <= new Date());
}
