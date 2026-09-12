export default function BadgeCard({ badge, compact = false }) {
    const progressPercent =
        badge.threshold > 0
            ? Math.min((badge.current_value / badge.threshold) * 100, 100)
            : 0;

    const iconSize = compact ? "w-14 h-14 text-2xl" : "w-20 h-20 text-4xl";
    const textSize = compact ? "text-xs" : "text-sm";
    const headingSize = compact ? "font-headline-xs" : "font-headline-sm";

    return (
        <div
            className="group relative bg-surface-container-high p-4 rounded-xl border-2 border-primary-container/40 transition-transform duration-150 hover:-translate-y-1 motion-reduce:transition-none motion-reduce:hover:translate-y-0"
            style={{ boxShadow: "6px 6px 0 0 #7000ff" }}
        >
            {badge.is_earned && (
                <div
                    className="absolute -top-3 -right-1 font-black px-2 py-1 rounded-lg border-2 rotate-12 z-10 bg-primary-container text-background border-background text-xs uppercase"
                    style={{ boxShadow: "4px 4px 0 0 #3f6212" }}
                >
                    EARNED
                </div>
            )}
            <div className="flex flex-col items-center text-center space-y-3">
                <div
                    className={`${iconSize} bg-primary/20 border-4 border-primary-container rounded-full flex items-center justify-center`}
                    style={{ boxShadow: "0px 6px 0px 0px rgba(0,0,0,0.3)" }}
                >
                    <span className={iconSize}>{badge.icon}</span>
                </div>
                <div>
                    <h3
                        className={`${headingSize} text-primary uppercase tracking-tight`}
                    >
                        {badge.name}
                    </h3>
                    <p
                        className={`font-body-sm text-on-surface-variant ${textSize}`}
                    >
                        {badge.description}
                    </p>
                </div>
                <div className="w-full">
                    <div className="flex justify-between text-xs font-bold text-on-surface-variant mb-1 uppercase">
                        <span>Progress</span>
                        <span className="text-primary">
                            {badge.current_value}/{badge.threshold}
                        </span>
                    </div>
                    <div                     className="w-full bg-background h-3 rounded-full border-2 border-outline/20 overflow-hidden">
                        <div
                            className="h-full bg-primary transition-all duration-1000"
                            style={{
                                width: `${progressPercent}%`,
                                boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                            }}
                        ></div>
                    </div>
                </div>
            </div>
        </div>
    );
}
