import { usePage } from "@inertiajs/react";

export default function useDeadlineStatus() {
    const deadline = usePage().props.auth?.deadline;
    return !!(deadline && new Date(deadline) <= new Date());
}