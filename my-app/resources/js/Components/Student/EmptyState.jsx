export default function EmptyState({ icon = "inbox", title, message }) {
    return (
        <div className="text-center py-20">
            <span className="material-symbols-outlined text-6xl text-on-surface-variant mb-4 block">{icon}</span>
            <p className="font-black uppercase tracking-widest text-base text-on-surface-variant">{title}</p>
            {message && <p className="text-sm text-on-surface-variant/60 mt-2">{message}</p>}
        </div>
    );
}