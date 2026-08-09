const ACCENTS = {
    lime: {
        badge: "border-lime-400 shadow-[4px_4px_0_0_#3f6212]",
        text: "text-lime-400",
        manage: "bg-purple-500 text-white border-slate-950 shadow-[4px_4px_0_0_#4c1d95] hover:shadow-[2px_2px_0_0_#4c1d95]",
    },
    sky: {
        badge: "border-sky-400 shadow-[4px_4px_0_0_#075985]",
        text: "text-sky-400",
        manage: "bg-amber-500 text-white border-slate-950 shadow-[4px_4px_0_0_#78350f] hover:shadow-[2px_2px_0_0_#78350f]",
    },
};

export default function ModuleCard({
    level,
    title = `Module ${level}`,
    meta,
    accent = "lime",
    isAdd = false,
    disabled = false,
    onClick,
    manageLabel = "Manage",
}) {
    const a = ACCENTS[accent];
    return (
        <div
            className={`bg-slate-900 rounded-[2.5rem] border-4 border-slate-800 p-6 md:p-8 flex flex-col items-center justify-center text-center shadow-[10px_10px_0_0_#020617] hover:translate-x-1 hover:translate-y-1 hover:shadow-none transition-all group ${
                disabled ? "cursor-not-allowed opacity-40" : "cursor-pointer"
            }`}
            onClick={() => {
                if (disabled) return;
                onClick?.();
            }}
        >
            <div
                className={`w-16 h-16 rounded-2xl bg-slate-950 border-2 border-lime-400 flex items-center justify-center mb-4 transition-transform ${a.badge} ${
                    isAdd ? "" : "rotate-3 group-hover:rotate-0"
                }`}
            >
                {isAdd ? (
                    <span
                        className={`material-symbols-outlined text-2xl ${a.text}`}
                    >
                        add_box
                    </span>
                ) : (
                    <span className={`text-2xl font-black ${a.text}`}>
                        {(level ?? "").toUpperCase()}
                    </span>
                )}
            </div>
            <p className="text-lg font-black text-white uppercase italic tracking-tighter mb-1 truncate w-full px-2">
                {title}
            </p>
            {meta ? (
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest truncate w-full px-2">
                    {meta}
                </p>
            ) : isAdd ? (
                <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">
                    Level {(level ?? "").toUpperCase()}
                </p>
            ) : null}
            {!isAdd && (
                <button
                    className={`mt-6 w-full px-4 py-3 rounded-xl border-4 font-black uppercase italic text-xs tracking-tighter hover:translate-y-0.5 hover:shadow-none transition-all flex items-center justify-center gap-2 disabled:opacity-30 disabled:cursor-not-allowed ${a.manage}`}
                    disabled={disabled}
                    onClick={(e) => {
                        e.stopPropagation();
                        if (disabled) return;
                        onClick?.();
                    }}
                >
                    <span className="material-symbols-outlined text-sm">
                        edit_note
                    </span>
                    {manageLabel}
                </button>
            )}
        </div>
    );
}