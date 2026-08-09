export default function StatusBadge({ color, children, className = "" }) {
    let base =
        "px-3 py-1 rounded-full border-2 text-[10px] font-black uppercase";
    if (color.includes(" ")) {
        return (
            <span className={`${base} ${color} ${className}`}>{children}</span>
        );
    }
    const map = {
        green: "bg-green-900/50 text-green-400 border-green-500",
        lime: "bg-lime-900/50 text-lime-400 border-lime-500",
        slate: "bg-slate-800/50 text-slate-500 border-slate-700",
        rose: "bg-rose-900/50 text-rose-400 border-rose-500",
        amber: "bg-amber-900/50 text-amber-400 border-amber-500",
        sky: "bg-sky-900/50 text-sky-400 border-sky-500",
    };
    return (
        <span className={`${base} ${map[color] ?? map.slate} ${className}`}>
            {children}
        </span>
    );
}