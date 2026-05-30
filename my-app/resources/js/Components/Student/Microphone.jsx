export default function Microphone() {
    return (
        <>
            {/* <!-- CENTER BOTTOM: Sonic Microphone UI --> */}
            <div className="relative z-50 flex flex-col items-center gap-6 mb-3">
                {/* <!-- Sonic Microphone Outer Ring --> */}
                <div className="relative group">
                    {/* <!-- Glowing Aura --> */}
                    <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 opacity-40 blur-[45px] animate-pulse shadow-[0_0_50px_rgba(var(--primary-rgb),0.3),0_0_50px_rgba(163,230,53,0.3)]"></div>
                    {/* <!-- Main Mic Housing --> */}
                    <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-on-background/10 border-4 border-on-background/10 shadow-2xl backdrop-blur-xl">
                        {/* <!-- Tech Inner Ring --> */}
                        <div className="absolute w-28 h-28 rounded-full border border-dashed border-primary/30 animate-[spin_10s_linear_infinite]"></div>
                        {/* <!-- Core Mic Icon --> */}
                        <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-lime-400 flex items-center justify-center shadow-inner ring-4 ring-white/10 group-hover:scale-110 transition-transform duration-300">
                            <span className="material-symbols-outlined text-white text-5xl">
                                mic
                            </span>
                        </div>
                    </div>
                    {/* <!-- Floating Tech Bits --> */}
                    <div className="absolute -top-4 -right-2 bg-lime-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-lg animate-bounce">
                        <span className="material-symbols-outlined text-sm font-black">
                            graphic_eq
                        </span>
                    </div>
                    <div className="absolute -bottom-2 -left-2 bg-primary text-white p-1 rounded-full border-2 border-white shadow-lg animate-pulse">
                        <span className="material-symbols-outlined text-sm font-black">
                            keyboard_voice
                        </span>
                    </div>
                </div>
                {/* <!-- Action Prompt --> */}
                <div className="bg-on-background/10 backdrop-blur-md px-8 py-3 rounded-full border border-white/10 flex items-center gap-3 shadow-xl">
                    <span className="text-on-background font-black italic tracking-widest uppercase text-lg">
                        Speak to Smash!
                    </span>
                    <span className="text-2xl">🎤</span>
                </div>
            </div>
        </>
    );
}
