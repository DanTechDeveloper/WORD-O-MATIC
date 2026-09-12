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
              ? "fixed z-50 bottom-4 sm:bottom-8 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 right-auto sm:right-6 flex flex-col items-center gap-4 w-[92vw] sm:w-auto"
              : position === "bottom-left"
                ? "fixed z-50 bottom-8 left-6 flex flex-col items-center gap-4"
                : "fixed z-50 bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4";

    return (
        <div className={`${positionClass} ${className}`}>
            <button
                onClick={onClick}
                className={`bg-surface-container-high rounded-3xl px-6 sm:px-10 py-4 sm:py-6 shadow-[6px_6px_0_0_#7000ff] border-2 ${accent.border} min-w-[280px] sm:min-w-[300px] max-w-[92vw] sm:max-w-[440px] cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 text-center animate-fade-in motion-reduce:transition-none`}
            >
                <p className="text-2xl font-black uppercase tracking-tight text-on-surface flex items-center justify-center gap-2">
                    <span className="material-symbols-outlined text-3xl" aria-hidden="true">{emoji}</span>
                    {title}
                </p>
                <p className="text-base font-bold text-on-surface-variant mt-2 leading-snug">
                    {message}
                </p>
                {footerText !== null && (
                    <p className={`text-xs font-black uppercase tracking-wider ${accent.text} mt-3`}>
                        {footerText || "Tap here to continue"}
                    </p>
                )}
            </button>
            {bodyUrl && (
                <img
                    src={bodyUrl}
                    alt="Your avatar guide"
                    className={`w-32 xs:w-40 sm:w-48 h-auto md:w-64 lg:w-80 object-contain motion-reduce:animate-none`}
                    style={{ filter: "drop-shadow(0 0 20px rgba(112,0,255,0.2))" }}
                />
            )}
        </div>
    );
}
