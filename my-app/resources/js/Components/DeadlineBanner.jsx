export default function DeadlineBanner({ isDeadlineClosed }) {
    if (!isDeadlineClosed) return null;

    return (
        <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500 rounded-xl flex items-start gap-3">
            <span
                className="material-symbols-outlined text-amber-600"
                style={{ fontVariationSettings: "'FILL' 1" }}
            >
                emoji_events
            </span>
            <p className="text-amber-600 font-semibold">
                The report period is closed. Keep playing — new points and badges
                count for the next one!
            </p>
        </div>
    );
}
