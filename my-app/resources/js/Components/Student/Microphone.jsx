export default function Microphone() {
    return (
        <>
            {/* <!-- CENTER BOTTOM: Sonic Microphone UI --> */}
            <div class="relative z-50 flex flex-col items-center gap-6 mb-8">
                {/* <!-- Sonic Microphone Outer Ring --> */}
                <div class="relative group">
                    {/* <!-- Glowing Aura --> */}
                    <div class="absolute inset-0 rounded-full bg-lime-400/50 blur-[40px] animate-pulse shadow-[0_0_60px_rgba(163,230,53,0.9)]"></div>
                    {/* <!-- Main Mic Housing --> */}
                    <div class="relative flex items-center justify-center w-32 h-32 rounded-full bg-background-dark/80 border-4 border-lime-400/50 shadow-2xl backdrop-blur-xl">
                        {/* <!-- Tech Inner Ring --> */}
                        <div class="absolute w-28 h-28 rounded-full border border-dashed border-lime-400/30 animate-[spin_10s_linear_infinite]"></div>
                        {/* <!-- Core Mic Icon --> */}
                        <div class="w-20 h-20 rounded-full bg-gradient-to-tr from-primary to-lime-400 flex items-center justify-center shadow-inner ring-4 ring-lime-400/20 group-hover:scale-110 transition-transform duration-300">
                            <span class="material-symbols-outlined text-white text-5xl">
                                mic
                            </span>
                        </div>
                    </div>
                    {/* <!-- Floating Tech Bits --> */}
                    <div class="absolute -top-4 -right-2 bg-lime-400 text-slate-950 p-1 rounded-full border-2 border-white shadow-lg animate-bounce">
                        <span class="material-symbols-outlined text-sm font-black">
                            graphic_eq
                        </span>
                    </div>
                    <div class="absolute -bottom-2 -left-2 bg-primary text-white p-1 rounded-full border-2 border-white shadow-lg animate-pulse">
                        <span class="material-symbols-outlined text-sm font-black">
                            keyboard_voice
                        </span>
                    </div>
                </div>
                {/* <!-- Action Prompt --> */}
                <div class="bg-background-dark/60 backdrop-blur-md px-8 py-3 rounded-full border border-white/20 flex items-center gap-3">
                    <span class="text-white font-black italic tracking-widest uppercase text-lg">
                        Speak to Smash!
                    </span>
                    <span class="text-2xl">🎤</span>
                </div>
            </div>
        </>
    );
}
