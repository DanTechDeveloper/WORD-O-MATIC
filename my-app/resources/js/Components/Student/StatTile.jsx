export default function StatTile({ label, value, valueClassName = "text-lime-400", note }) {
    return (
        <div className="flex-1 bg-surface-container rounded-2xl py-6 px-4 text-center border border-surface-variant/20">
            <div className="text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-1">{label}</div>
            <div className={`text-5xl sm:text-6xl font-black ${valueClassName}`}>{value}</div>
            {note && <div className="text-xs font-semibold text-on-surface-variant mt-2">{note}</div>}
        </div>
    );
}