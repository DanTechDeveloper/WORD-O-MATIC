export default function DeadlineBanner({ isDeadlineClosed, message }) {
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
                {message ?? "The Great Word Challenge is taking a break! Your points are safe play again soon for a brand-new adventure!"}
            </p>
        </div>
    );
}
