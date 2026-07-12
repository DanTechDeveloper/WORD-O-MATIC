export default function AvatarSpeechBubble({
    emoji,
    title,
    message,
    bodyUrl,
    onClick,
    footerText,
    position = "bottom",
    color = "primary",
    className = "",
}) {
    const accentMap = {
        primary: {
            border: "border-primary",
            text: "text-primary",
            glow: "drop-shadow-[0_0_80px_rgba(112,0,255,0.35)]",
        },
        secondary: {
            border: "border-secondary-container",
            text: "text-secondary-container",
            glow: "drop-shadow-[0_0_80px_rgba(255,59,192,0.35)]",
        },
        accent: {
            border: "border-accent",
            text: "text-accent",
            glow: "drop-shadow-[0_0_80px_rgba(163,230,53,0.35)]",
        },
        quest: {
            border: "border-quest",
            text: "text-quest",
            glow: "drop-shadow-[0_0_80px_rgba(56,189,248,0.35)]",
        },
    };
    const accent = accentMap[color] || accentMap.primary;

    const positionClass =
        position === "center"
            ? "flex flex-col items-center gap-6 animate-fade-in px-4"
            : position === "bottom-right"
              ? "fixed z-50 bottom-8 right-6 flex flex-col items-center gap-4"
              : "fixed z-50 bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4";

    return (
        <div className={`${positionClass} ${className}`}>
            <button
                onClick={onClick}
                className={`bg-surface-container-high rounded-3xl px-10 py-6 shadow-2xl border-2 ${accent.border} min-w-[300px] max-w-[440px] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 text-center animate-fade-in`}
            >
                <p className="text-3xl font-black uppercase tracking-tight text-on-surface flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-4xl">{emoji}</span>
                    {title}
                </p>
                <p className="text-lg font-bold text-on-surface-variant mt-2 leading-snug">
                    {message}
                </p>
                <p className={`text-sm font-black uppercase tracking-wider ${accent.text} mt-4`}>
                    {footerText || "Tap here to continue →"}
                </p>
            </button>
            {bodyUrl && (
                <img
                    src={bodyUrl}
                    alt="Your Avatar"
                    className={`w-48 h-auto md:w-64 lg:w-80 object-contain ${accent.glow} animate-bounce-slow`}
                />
            )}
        </div>
    );
}
