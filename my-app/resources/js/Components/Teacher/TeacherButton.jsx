import { Link } from "@inertiajs/react";

const VARIANTS = {
    lime: "bg-lime-400 text-slate-950 border-slate-950 shadow-[6px_6px_0_0_#3f6212] hover:shadow-[3px_3px_0_0_#3f6212]",
    purple:
        "bg-purple-500 text-white border-slate-950 shadow-[6px_6px_0_0_#4c1d95] hover:shadow-[3px_3px_0_0_#4c1d95]",
    blue: "bg-sky-400 text-slate-950 border-slate-950 shadow-[6px_6px_0_0_#075985] hover:shadow-[3px_3px_0_0_#075985]",
    amber:
        "bg-amber-500 text-white border-slate-950 shadow-[6px_6px_0_0_#78350f] hover:shadow-[3px_3px_0_0_#78350f]",
    rose: "bg-rose-600 text-white border-slate-950 shadow-[6px_6px_0_0_#7f1d1d] hover:shadow-[3px_3px_0_0_#7f1d1d]",
    ghost:
        "bg-slate-800 text-slate-400 border-slate-950 shadow-[6px_6px_0_0_#020617] hover:shadow-[3px_3px_0_0_#020617]",
};

const SIZES = {
    sm: "px-4 py-2 rounded-xl border-3 text-xs",
    md: "px-6 py-3 rounded-2xl border-4 text-xs",
    lg: "px-8 py-4 rounded-xl border-4 text-sm",
};

export default function TeacherButton({
    variant = "lime",
    size = "sm",
    href,
    className = "",
    children,
    icon,
    ...rest
}) {
    const base = `${VARIANTS[variant]} ${SIZES[size]} font-black uppercase italic tracking-tighter hover:translate-y-0.5 transition-all flex items-center justify-center gap-2 ${className}`;
    if (href) {
        return (
            <Link href={href} className={base}>
                {icon && (
                    <span className="material-symbols-outlined">{icon}</span>
                )}
                {children}
            </Link>
        );
    }
    return (
        <button className={base} {...rest}>
            {icon && <span className="material-symbols-outlined">{icon}</span>}
            {children}
        </button>
    );
}