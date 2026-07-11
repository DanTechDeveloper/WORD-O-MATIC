import { useEffect } from "react";
import { playBadgeUnlockSound } from "@/utils/sounds";

export default function BadgeUnlockModal({
    badge,
    show,
    onContinue,
    buttonText = "TAP TO CONTINUE",
    current,
    total,
}) {
    useEffect(() => {
        if (show && badge) {
            playBadgeUnlockSound()
        }
    }, [show, badge])

    if (!show || !badge) return null;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-background overflow-hidden">
            <div className="absolute inset-0 bg-lime-400/10 blur-[150px] rounded-full animate-pulse" />

            <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-2xl mx-auto">
                {total > 1 && (
                    <div className="relative z-10 mb-12 flex flex-col items-center gap-2">
                        <span className="text-lime-400 font-black text-xl uppercase tracking-widest">
                            🎉 You unlocked {total} new badges!
                        </span>
                    </div>
                )}

                <div className="relative mb-8">
                    <div className="absolute inset-0 bg-lime-400/30 blur-3xl rounded-full scale-150 animate-pulse" />
                    <span className="text-[10rem] leading-none animate-bounce block relative">
                        {badge.icon}
                    </span>
                </div>

                <div
                    className="bg-lime-400 text-lime-950 font-black px-8 py-3 rounded-xl border-2 border-slate-950 text-lg uppercase tracking-widest mb-6"
                    style={{ boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.5)" }}
                >
                    New Badge Unlocked!
                </div>

                <h1 className="text-5xl md:text-7xl font-black text-lime-400 uppercase tracking-tight mb-4 drop-shadow-[0_0_30px_rgba(163,230,53,0.5)]">
                    {badge.name}
                </h1>

                <p className="font-headline-sm text-on-surface-variant mb-10 max-w-md">
                    {badge.description}
                </p>

                {badge.current_value != null && badge.threshold != null && (
                    <div className="w-full max-w-sm">
                        <div className="flex justify-between text-sm font-bold text-on-surface-variant mb-2 uppercase">
                            <span>Progress</span>
                            <span className="text-lime-400">
                                {badge.current_value}/{badge.threshold}
                            </span>
                        </div>
                        <div className="w-full bg-slate-950 h-5 rounded-full border-2 border-lime-400/40 overflow-hidden">
                            <div
                                className="h-full bg-lime-400 transition-all duration-1000"
                                style={{
                                    width: `${Math.min((badge.current_value / badge.threshold) * 100, 100)}%`,
                                    boxShadow: "inset 0 2px 4px rgba(0,0,0,0.3)",
                                }}
                            ></div>
                        </div>
                    </div>
                )}

                <button
                    onClick={onContinue}
                    className="mt-10 bg-lime-400 text-lime-950 font-black px-10 py-4 rounded-xl border-4 border-slate-950 text-xl uppercase tracking-widest active:translate-x-1 active:translate-y-1 active:shadow-none transition-all animate-pulse"
                    style={{ boxShadow: "6px 6px 0px 0px rgba(0,0,0,0.5)" }}
                >
                    {buttonText}
                </button>
            </div>
        </div>
    );
}
