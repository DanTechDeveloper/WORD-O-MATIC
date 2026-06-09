export default function DeniedModal({ gameState }) {
    return (
        <>
            {gameState === "DENIED" && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
                    {/* Dynamic Background Aura */}
                    <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[120px] opacity-30 animate-pulse"></div>

                    <div className="relative bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border-2 border-white/10 shadow-2xl max-w-md text-center overflow-hidden">
                        {/* Tech Decoration */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="w-24 h-24 bg-gradient-to-tr from-primary to-lime-400 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl ring-4 ring-white/10">
                                <span className="material-symbols-outlined text-white text-5xl font-black">
                                    mic_off
                                </span>
                            </div>

                            <h2 className="text-white text-4xl font-black uppercase italic mb-4 tracking-tighter">
                                Sync Failure!
                            </h2>
                            <p className="text-white/70 text-lg font-bold mb-10 leading-relaxed">
                                Microphone link is{" "}
                                <span className="text-lime-400">offline</span>.
                                Please authorize system access to continue
                                word-smashing mission!
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
