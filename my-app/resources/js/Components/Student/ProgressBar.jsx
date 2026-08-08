export default function ProgressBar({ value = 0, barClassName = "bg-accent", trackClassName = "bg-background/60 border border-outline/30", heightClassName = "h-3", durationClassName = "duration-700" }) {
    const pct = Math.min(Math.max(value, 0), 100);
    return (
        <div className={`w-full ${trackClassName} ${heightClassName} rounded-full overflow-hidden`}>
            <div
                className={`h-full rounded-full transition-all ease-out ${durationClassName} ${barClassName}`}
                style={{ width: `${pct}%` }}
            />
        </div>
    );
}