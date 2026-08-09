export default function AvatarChip({
    src,
    alt,
    size = "w-12 h-12",
    className = "",
    fallbackIcon = "person",
}) {
    return (
        <div
            className={`${size} rounded-lg bg-slate-950 border-2 border-lime-400 overflow-hidden shrink-0 ${className}`}
        >
            {src ? (
                <img
                    src={src}
                    alt={alt}
                    className="w-full h-full object-cover"
                />
            ) : (
                <span className="material-symbols-outlined text-slate-500 text-xl">
                    {fallbackIcon}
                </span>
            )}
        </div>
    );
}