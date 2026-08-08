const SIZES = {
    sm: { box: "w-10 h-10 rounded-xl", icon: "text-xl" },
    md: { box: "w-12 h-12 rounded-xl", icon: "text-2xl" },
    lg: { box: "w-14 h-14 rounded-xl", icon: "text-3xl" },
};

export default function StudentAvatar({ url, alt = "", size = "md" }) {
    const s = SIZES[size] || SIZES.md;
    return (
        <div className={`${s.box} overflow-hidden flex items-center justify-center bg-surface-container-high`}>
            {url ? (
                <img src={url} alt={alt} className="w-full h-full object-cover" />
            ) : (
                <span className={`material-symbols-outlined ${s.icon} text-on-surface-variant`}>person</span>
            )}
        </div>
    );
}