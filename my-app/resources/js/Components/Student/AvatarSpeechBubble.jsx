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
    variant = "full",
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

    const isMini = variant === "mini";
    const isToast = variant === "toast";
    const positionClass =
        isToast
            ? "fixed z-50 top-3 sm:top-4 left-1/2 -translate-x-1/2 flex flex-row items-center gap-3 w-[92vw] sm:w-auto max-w-[92vw] sm:max-w-[360px]"
            : position === "center"
              ? "flex flex-col items-center gap-6 animate-fade-in px-4"
              : position === "bottom-right"
                ? isMini
                    ? "fixed z-50 bottom-[88px] xs:bottom-[96px] sm:bottom-[108px] md:bottom-[120px] lg:bottom-4 right-3 sm:right-4 left-auto translate-x-0 flex flex-col items-center gap-2 w-auto max-w-[340px] sm:max-w-[400px]"
                    : "fixed z-50 bottom-[100px] sm:bottom-[120px] md:bottom-[132px] lg:bottom-8 left-1/2 sm:left-auto -translate-x-1/2 sm:translate-x-0 right-auto sm:right-6 flex flex-col items-center gap-4 w-[92vw] sm:w-auto lg:w-auto"
                : position === "bottom-left"
                  ? isMini
                      ? "fixed z-50 bottom-[88px] xs:bottom-[96px] sm:bottom-[108px] md:bottom-[120px] lg:bottom-4 left-3 sm:left-4 flex flex-col items-center gap-2 w-auto max-w-[340px] sm:max-w-[400px]"
                      : "fixed z-50 bottom-[100px] sm:bottom-[120px] md:bottom-[132px] lg:bottom-8 left-6 flex flex-col items-center gap-4"
                  : isMini
                    ? "fixed z-50 bottom-[88px] xs:bottom-[96px] sm:bottom-[108px] md:bottom-[120px] lg:bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 w-auto max-w-[340px]"
                    : "fixed z-50 bottom-[100px] sm:bottom-[120px] md:bottom-[132px] lg:bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4";

    return (
        <div className={`${positionClass} ${className}`}>
            {/* ponytail: arcade wash behind bubble+avatar — bg + lime radial, same technique as BadgeUnlockModal */}
            {position !== "center" && (
                <div
                    className="pointer-events-none absolute inset-0 -z-10 bg-background"
                    aria-hidden="true"
                    style={{
                        background: "radial-gradient(ellipse at 50% 85%, rgba(163,230,53,0.12), transparent 65%)",
                    }}
                />
            )}
            <button
                onClick={onClick}
                className={`${isToast ? "flex-1 " : ""}bg-surface-container-high rounded-3xl shadow-[6px_6px_0_0_#7000ff] border-2 ${accent.border} cursor-pointer hover:scale-[1.02] active:scale-[0.98] transition-transform duration-150 text-center animate-fade-in motion-reduce:transition-none ${isMini ? "px-6 sm:px-7 py-4 sm:py-5 min-w-[260px] sm:min-w-[300px] max-w-[340px] sm:max-w-[400px]" : isToast ? "px-4 py-3 min-w-0 max-w-none flex flex-row items-center gap-3 text-left" : "px-7 sm:px-12 py-5 sm:py-7 min-w-[300px] sm:min-w-[340px] max-w-[92vw] sm:max-w-[520px]"}`}
            >
                <p className={`${isMini ? "text-2xl sm:text-3xl" : isToast ? "text-base" : "text-3xl sm:text-4xl"} font-black uppercase tracking-tight text-on-surface flex items-center ${isToast ? "justify-start" : "justify-center"} gap-2`}>
                    <span className={`material-symbols-outlined ${isMini ? "text-2xl sm:text-3xl" : isToast ? "text-lg" : "text-4xl"}`} aria-hidden="true">{emoji}</span>
                    {title}
                </p>
                <p className={`${isMini ? "text-base sm:text-lg" : isToast ? "text-xs" : "text-lg sm:text-xl"} font-bold text-on-surface-variant ${isToast ? "mt-0 truncate" : "mt-2 leading-snug"}`}>
                    {message}
                </p>
                {footerText !== null && !isToast && (
                    <p className={`text-xs font-black uppercase tracking-wider ${accent.text} mt-3`}>
                        {footerText || "Tap here to continue"}
                    </p>
                )}
            </button>
            {bodyUrl && !isToast && (
                <img
                    src={bodyUrl}
                    alt="Your avatar guide"
                    className={`${isMini ? "w-24 xs:w-28 sm:w-32 md:w-40 max-h-[30vh] sm:max-h-[32vh]" : "w-36 xs:w-44 sm:w-56 md:w-72 lg:w-96 max-h-[38vh] sm:max-h-[42vh]"} h-auto object-contain animate-bounce-slow motion-reduce:animate-none`}
                    style={{ filter: "drop-shadow(0 0 20px rgba(112,0,255,0.2))" }}
                />
            )}
            {bodyUrl && isToast && (
                <img src={bodyUrl} alt="" className="w-10 h-10 rounded-full object-cover shrink-0 hidden xs:block" aria-hidden="true" />
            )}
        </div>
    );
}
