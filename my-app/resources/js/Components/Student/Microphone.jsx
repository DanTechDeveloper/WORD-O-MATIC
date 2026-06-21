import { memo } from "react";

const Microphone = memo(function Microphone({ isListening, disabled, onClick }) {
    return (
        <>
            {/* <!-- CENTER BOTTOM: Sonic Microphone UI --> */}
            <div className="relative z-50 flex flex-col items-center gap-4 sm:gap-5 md:gap-6 mb-1 sm:mb-2 md:mb-3">
                {/* <!-- Sonic Microphone Outer Ring --> */}
                <button
                    disabled={disabled}
                    onClick={onClick}
                    className={`relative group outline-none transition-all duration-300 ${disabled ? "opacity-50 grayscale cursor-not-allowed" : "active:scale-95"}`}
                >
                    {/* <!-- Glowing Aura --> */}
                    <div
                        className={`absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[30px] sm:blur-[40px] md:blur-[45px] shadow-[0_0_50px_rgba(var(--primary-rgb),0.3),0_0_50px_rgba(163,230,53,0.3)] transition-opacity duration-500 ${isListening ? "opacity-80 animate-pulse" : "opacity-40 group-hover:opacity-60"}`}
                    ></div>

                    {/* <!-- Main Mic Housing --> */}
                    <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-on-background/10 border-2 sm:border-3 md:border-4 border-on-background/10 shadow-2xl backdrop-blur-xl">
                        {/* <!-- Tech Inner Ring --> */}
                        <div
                            className={`absolute w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border border-dashed border-primary/30 ${isListening ? "animate-[spin_3s_linear_infinite] border-primary" : "animate-[spin_10s_linear_infinite]"}`}
                        ></div>

                        {/* <!-- Core Mic Icon --> */}
                        <div
                            className={`w-16 h-16 sm:w-18 sm:h-18 md:w-20 md:h-20 rounded-full bg-gradient-to-tr from-primary to-lime-400 flex items-center justify-center shadow-inner ring-4 ring-white/10 transition-transform duration-300 ${isListening ? "scale-110 ring-lime-400/50" : "group-hover:scale-110"}`}
                        >
                            <span
                                className={`material-symbols-outlined text-white text-4xl sm:text-5xl transition-all ${isListening ? "scale-125" : ""}`}
                            >
                                {isListening ? "graphic_eq" : "mic"}
                            </span>
                        </div>
                    </div>

                    {/* <!-- Floating Tech Bits --> */}
                    <div
                        className={`absolute -top-4 -right-2 bg-lime-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-lg ${isListening ? "animate-spin" : "animate-bounce"}`}
                    >
                        <span className="material-symbols-outlined text-[10px] sm:text-sm font-black">
                            graphic_eq
                        </span>
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-primary text-white p-1 rounded-full border-2 border-white shadow-lg animate-pulse">
                        <span className="material-symbols-outlined text-[10px] sm:text-sm font-black">
                            keyboard_voice
                        </span>
                    </div>
                </button>

                {/* <!-- Action Prompt --> */}
                <div
                    className={`bg-on-background/10 backdrop-blur-md px-4 sm:px-6 md:px-8 py-2 sm:py-3 rounded-full border border-white/10 flex items-center gap-2 sm:gap-3 shadow-xl transition-all duration-300 ${isListening ? "border-lime-400/50 scale-105" : ""}`}
                >
                    <span className="text-on-background font-black italic tracking-widest uppercase text-sm sm:text-base md:text-lg whitespace-nowrap">
                        {isListening
                            ? "Listening..."
                            : disabled
                              ? "Get Ready!"
                              : "Speak to Smash!"}
                    </span>
                    <span className="text-xl sm:text-2xl">🎤</span>
                </div>
            </div>
        </>
    );
});

export default Microphone;
