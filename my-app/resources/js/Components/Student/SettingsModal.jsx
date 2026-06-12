export default function SettingsModal({
    isOpen,
    onClose,
    audio,
    onUpdateAudio,
    onRestart,
    onExit,
}) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[120] flex items-center justify-center bg-slate-950/80 backdrop-blur-2xl p-6">
            <div className="relative bg-on-background/10 border-2 border-white/10 p-10 rounded-[3rem] w-full max-w-lg shadow-2xl overflow-hidden">
                <h2 className="text-white text-5xl font-black uppercase italic mb-10 text-center tracking-tighter">
                    Paused
                </h2>

                {/* Audio Sliders */}
                <div className="space-y-8 mb-12">
                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-white/60 font-black uppercase tracking-widest text-xs">
                            <span>Music Volume</span>
                            <span className="text-lime-400">
                                {audio.music}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={audio.music}
                            onChange={(e) =>
                                onUpdateAudio("music", e.target.value)
                            }
                            className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-primary"
                        />
                    </div>

                    <div className="space-y-4">
                        <div className="flex justify-between items-center text-white/60 font-black uppercase tracking-widest text-xs">
                            <span>Sound FX</span>
                            <span className="text-fuchsia-400">
                                {audio.sfx}%
                            </span>
                        </div>
                        <input
                            type="range"
                            min="0"
                            max="100"
                            value={audio.sfx}
                            onChange={(e) =>
                                onUpdateAudio("sfx", e.target.value)
                            }
                            className="w-full h-3 bg-white/10 rounded-full appearance-none cursor-pointer accent-fuchsia-500"
                        />
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col gap-4">
                    <button
                        onClick={onClose}
                        className="w-full bg-lime-400 text-slate-950 text-xl font-black py-5 rounded-2xl uppercase shadow-[0_6px_0_0_#1a2e05] active:translate-y-1 active:shadow-none transition-all"
                    >
                        Resume Mission
                    </button>

                    <div className="grid grid-cols-2 gap-4">
                        <button
                            onClick={onRestart}
                            className="bg-white/5 border-2 border-white/10 text-white text-sm font-black py-4 rounded-2xl uppercase hover:bg-white/10 transition-all"
                        >
                            Restart
                        </button>
                        <button
                            onClick={onExit}
                            className="bg-white/5 border-2 border-white/10 text-white text-sm font-black py-4 rounded-2xl uppercase hover:bg-white/10 transition-all"
                        >
                            Exit to Map
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
