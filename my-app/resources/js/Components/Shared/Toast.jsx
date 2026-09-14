// ponytail: native queue toast — declarative via flash, swap to sonner if swipe/progress needed
import { usePage } from "@inertiajs/react";
import { useEffect, useRef, useState } from "react";

let nextId = 1;

export default function Toast() {
    const { flash } = usePage().props;
    const [toasts, setToasts] = useState([]);
    const timers = useRef(new Map());
    const seen = useRef(new Set());

    const push = (type, msg) => {
        if (!msg || typeof msg !== "string") return;
        const key = `${type}:${msg}`;
        if (seen.current.has(key)) return;
        seen.current.add(key);
        setTimeout(() => seen.current.delete(key), 4000);
        const id = nextId++;
        setToasts((prev) => {
            const next = [{ id, type, msg }, ...prev];
            return next.slice(0, 3);
        });
        const t = setTimeout(() => dismiss(id), 3500);
        timers.current.set(id, t);
    };

    const dismiss = (id) => {
        clearTimeout(timers.current.get(id));
        timers.current.delete(id);
        setToasts((prev) => prev.filter((t) => t.id !== id));
    };

    const pause = (id) => clearTimeout(timers.current.get(id));
    const resume = (id) => {
        const t = setTimeout(() => dismiss(id), 1500);
        timers.current.set(id, t);
    };

    useEffect(() => {
        if (flash?.success) push("success", flash.success);
        if (flash?.error) push("error", flash.error);
        if (flash?.deadline_set) push("success", "Report deadline saved.");
        if (flash?.deadline_cleared) push("success", "Report deadline cleared — sent list reset. Everyone is selectable again.");
    }, [flash?.success, flash?.error, flash?.deadline_set, flash?.deadline_cleared]);

    useEffect(() => () => timers.current.forEach(clearTimeout), []);

    if (toasts.length === 0) return null;

    return (
        <div
            aria-live="polite"
            className="fixed z-[100] inset-x-3 bottom-[calc(4rem+12px)] sm:inset-x-auto sm:right-6 sm:bottom-6 sm:left-auto md:right-8 flex flex-col gap-3 pointer-events-none"
        >
            {toasts.map((t) => {
                const isError = t.type === "error";
                return (
                    <div
                        key={t.id}
                        role={isError ? "alert" : "status"}
                        onMouseEnter={() => pause(t.id)}
                        onMouseLeave={() => resume(t.id)}
                        onFocus={() => pause(t.id)}
                        onBlur={() => resume(t.id)}
                        className={`pointer-events-auto w-full sm:w-[min(420px,calc(100vw-48px))] md:w-[440px] rounded-2xl border-4 p-4 flex items-start gap-3 animate-fade-in ${
                            isError
                                ? "bg-error-container border-error text-on-error-container shadow-[4px_4px_0_0_#020617]"
                                : "bg-accent border-accent-deep text-background shadow-[4px_4px_0_0_#3f6212]"
                        }`}
                    >
                        <span
                            className={`material-symbols-outlined shrink-0 mt-0.5 ${isError ? "text-error" : "text-background"}`}
                            aria-hidden="true"
                        >
                            {isError ? "error" : "check_circle"}
                        </span>
                        <p className="flex-1 min-w-0 text-sm font-bold leading-snug break-words [overflow-wrap:anywhere] line-clamp-3">
                            {t.msg}
                        </p>
                        <button
                            onClick={() => dismiss(t.id)}
                            aria-label="Dismiss notification"
                            className={`shrink-0 -mr-1 -mt-1 p-2 min-w-[44px] min-h-[44px] flex items-center justify-center rounded-xl hover:bg-black/10 transition-colors ${isError ? "text-on-error-container/60 hover:text-on-error-container" : "text-background/60 hover:text-background"}`}
                        >
                            <span className="material-symbols-outlined text-lg" aria-hidden="true">
                                close
                            </span>
                        </button>
                    </div>
                );
            })}
        </div>
    );
}
