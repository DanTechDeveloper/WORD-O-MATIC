const COLOR_MAP = {
    accent: {
        bg: "bg-accent",
        shadow: "rgba(163,230,53,0.4)",
    },
    secondary: {
        bg: "bg-secondary-container",
        shadow: "rgba(255,59,192,0.4)",
    },
    quest: {
        bg: "bg-quest",
        shadow: "rgba(255,59,192,0.4)",
    },
};

export default function TapToStartOverlay({ color = "accent", permissionState }) {
    const colors = COLOR_MAP[color] || COLOR_MAP.accent;

    const subtitle =
        permissionState != null
            ? permissionState === "granted"
                ? "Tap to play!"
                : permissionState === "denied"
                  ? "Permission denied"
                  : "To grant access & play"
            : "To grant access & play";

    return (
        <div className="fixed inset-0 bg-background/60 z-40 pointer-events-none flex flex-col items-center justify-end pb-[110px] sm:pb-[140px] md:pb-[160px]">
            <div className="flex flex-col items-center justify-center animate-bounce scale-90 sm:scale-100">
                <div
                    className={`${colors.bg} text-slate-950 font-black px-6 sm:px-8 py-3 sm:py-4 rounded-3xl sm:rounded-[2rem] border-4 border-white flex flex-col items-center gap-1 text-center italic uppercase tracking-tighter`}
                    style={{ boxShadow: `0 0 40px ${colors.shadow}` }}
                >
                    <span className="material-symbols-outlined text-3xl sm:text-4xl mb-0 sm:mb-1">touch_app</span>
                    <span className="text-lg sm:text-xl leading-none">Tap Microphone</span>
                    <span className="text-[9px] sm:text-[10px] md:text-xs tracking-[0.2em] opacity-70 mt-1">{subtitle}</span>
                </div>
                <div className="w-0 h-0 border-l-[15px] sm:border-l-[20px] border-r-[15px] sm:border-r-[20px] border-t-[20px] sm:border-t-[25px] border-l-transparent border-r-transparent border-t-white -mt-1 drop-shadow-2xl"></div>
            </div>
        </div>
    );
}
