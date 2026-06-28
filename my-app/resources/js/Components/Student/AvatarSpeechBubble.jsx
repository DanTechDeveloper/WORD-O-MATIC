export default function AvatarSpeechBubble({
    emoji,
    title,
    message,
    bodyUrl,
    onClick,
    footerText,
    position = "bottom",
    className = "",
}) {
    const positionClass =
        position === "center"
            ? "flex flex-col items-center gap-6 animate-fade-in px-4"
            : "fixed z-50 bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4";

    return (
        <div className={`${positionClass} ${className}`}>
            <button
                onClick={onClick}
                className="bg-white/95 backdrop-blur-sm rounded-3xl px-8 py-5 shadow-2xl border-2 border-lime-400 min-w-[260px] max-w-[360px] cursor-pointer hover:scale-105 active:scale-95 transition-all duration-200 text-center animate-fade-in"
            >
                <p className="text-2xl font-black uppercase tracking-tight text-zinc-900 flex items-center justify-center gap-2">
                    <span className="text-3xl">{emoji}</span>
                    {title}
                </p>
                <p className="text-base font-bold text-zinc-600 mt-2 leading-snug">
                    {message}
                </p>
                <p className="text-xs font-black uppercase tracking-wider text-lime-600 mt-4">
                    {footerText || "Tap here to continue →"}
                </p>
            </button>
            {bodyUrl && (
                <img
                    src={bodyUrl}
                    alt="Your Avatar"
                    className="w-48 h-auto md:w-64 lg:w-80 object-contain drop-shadow-[0_0_80px_rgba(163,230,53,0.35)] animate-bounce-slow"
                />
            )}
        </div>
    );
}
