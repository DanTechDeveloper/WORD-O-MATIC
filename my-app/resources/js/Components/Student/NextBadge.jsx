export default function NextBadge({ badge }) {
    const pct = badge.threshold > 0 ? Math.min((badge.current_value / badge.threshold) * 100, 100) : 0;
    const nearComplete = pct >= 80;
    return (
        <div className="bg-surface-container rounded-2xl p-5 border border-surface-variant/20 flex items-center gap-4">
            <div className="w-16 h-16 bg-primary/10 rounded-xl flex items-center justify-center flex-shrink-0 border border-primary/20">
                <span className="material-symbols-outlined text-4xl text-primary">{badge.icon}</span>
            </div>
            <div className="flex-1 min-w-0">
                <div className="text-base font-bold text-on-surface mb-2 truncate">
                    Next: {badge.name}
                </div>
                <div className="h-4 bg-background rounded-full overflow-hidden border border-surface-variant/10">
                    <div
                        className={`h-full rounded-full transition-all duration-1000 ${nearComplete ? "bg-accent shadow-[0_0_12px_2px_rgba(163,230,53,0.6)]" : "bg-primary"}`}
                        style={{ width: `${pct}%` }}
                    />
                </div>
            </div>
            {nearComplete && <span className="material-symbols-outlined text-2xl text-accent">auto_awesome</span>}
        </div>
    );
}
