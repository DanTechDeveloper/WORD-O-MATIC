export default function StatCard({
    label,
    value,
    icon,
    color = "text-lime-400",
    sub,
    iconPosition = "block",
    className = "bg-slate-900 border-2 border-slate-800 p-6 rounded-2xl shadow-[4px_4px_0_0_#020617]",
    labelClassName = "",
    valueClassName = "",
}) {
    return (
        <div className={className}>
            {iconPosition === "row" ? (
                <div className="flex items-start justify-between mb-4">
                    <span className={`material-symbols-outlined text-3xl ${color}`}>
                        {icon}
                    </span>
                </div>
            ) : (
                <span className={`material-symbols-outlined text-3xl ${color} mb-4 block`}>
                    {icon}
                </span>
            )}
            <h3
                className={`text-slate-500 text-xs font-black uppercase tracking-widest mb-1 ${labelClassName}`}
            >
                {label}
            </h3>
            <p
                className={`text-3xl font-black text-white italic tracking-tighter ${valueClassName}`}
            >
                {value}
            </p>
            {sub && (
                <p className="text-xs text-slate-500 font-semibold mt-1">{sub}</p>
            )}
        </div>
    );
}