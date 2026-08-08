import { Link } from "@inertiajs/react";

export default function BackButton({ href = "/student/dashboard", ariaLabel = "Back to dashboard" }) {
    return (
        <Link
            href={href}
            aria-label={ariaLabel}
            className="bg-surface-container-high border-2 border-surface-variant/50 p-2 rounded-full text-on-surface inline-flex items-center justify-center hover:bg-surface-variant transition-all shadow-lg w-12 h-12"
        >
            <span className="material-symbols-outlined text-2xl" aria-hidden="true">arrow_back</span>
        </Link>
    );
}