// ponytail: arcade confirm — replaces window.confirm, result toast via flash.success
// ponytail: generic confirm (was ConfirmDeleteModal) — student prop kept for backward-compat (tests + Students.jsx)
import { useEffect } from "react";

export default function ConfirmModal({ isOpen, student, onClose, onConfirm, title, message, confirmText, confirmIcon, variant }) {
    useEffect(() => {
        if (!isOpen) return;
        const h = (e) => e.key === "Escape" && onClose?.();
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [isOpen, onClose]);

    const heading = title ?? "Delete Student";
    const icon = confirmIcon ?? "warning";
    const cta = confirmText ?? "Delete";
    const ctaIcon = confirmIcon ?? "delete";
    const isError = (variant ?? "error") !== "neutral";
    const hasContent = !!student || !!message;

    if (!isOpen || !hasContent) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4">
            <div className="absolute inset-0 bg-background/80" onClick={onClose} aria-hidden="true" />
            <div
                role="dialog"
                aria-modal="true"
                aria-labelledby="confirm-delete-title"
                className="relative w-full max-w-md bg-surface-container border-4 border-outline/20 rounded-t-3xl sm:rounded-[2.5rem] shadow-[12px_12px_0_0_#020617] overflow-hidden animate-fade-in max-h-[90vh] flex flex-col"
            >
                <header className="bg-surface-container-high p-4 sm:p-6 border-b-4 border-outline/20 flex justify-between items-center">
                    <h2 id="confirm-delete-title" className="text-xl font-black text-white uppercase italic tracking-tighter flex items-center gap-2">
                        <span className={`material-symbols-outlined ${isError ? "text-error" : "text-accent"}`} aria-hidden="true">{icon}</span>
                        {heading}
                    </h2>
                    <button onClick={onClose} aria-label="Close" className="text-on-surface-variant hover:text-white transition-colors p-2 -mr-2 min-w-[44px] min-h-[44px] flex items-center justify-center">
                        <span className="material-symbols-outlined" aria-hidden="true">close</span>
                    </button>
                </header>
                <div className="p-4 sm:p-6 lg:p-8 space-y-4">
                    {message ? (
                        <div className="text-white font-bold text-sm sm:text-base break-words [overflow-wrap:anywhere] leading-snug">{message}</div>
                    ) : (
                        <>
                            <p className="text-white font-bold text-sm sm:text-base break-words [overflow-wrap:anywhere] leading-snug">
                                Delete <span className="text-accent">{student.fullName}</span>?
                            </p>
                            <p className="text-on-surface-variant text-xs sm:text-sm font-semibold">This cannot be undone. Progress and mastery will be removed.</p>
                        </>
                    )}
                    <div className="pt-2 flex gap-3">
                        <button
                            onClick={onClose}
                            className="flex-1 py-3 rounded-xl font-black uppercase italic text-sm border-2 border-outline/20 bg-surface-container-lowest text-on-surface-variant hover:text-white transition-colors min-h-[44px]"
                        >
                            Cancel
                        </button>
                        <button
                            onClick={onConfirm}
                            autoFocus
                            className={`flex-1 py-3 rounded-xl font-black uppercase italic text-sm border-4 border-slate-950 hover:translate-y-0.5 hover:shadow-none transition-all min-h-[44px] flex items-center justify-center gap-2 ${isError ? "bg-error text-on-error shadow-[4px_4px_0_0_#7f1d1d]" : "bg-accent text-background shadow-[4px_4px_0_0_#3f6212]"}`}
                        >
                            <span className="material-symbols-outlined text-base" aria-hidden="true">{ctaIcon}</span>
                            {cta}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
