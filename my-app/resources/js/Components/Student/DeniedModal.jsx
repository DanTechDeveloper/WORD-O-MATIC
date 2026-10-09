export default function DeniedModal({ gameState, onRetry }) {
    return (
        <>
            {gameState === "DENIED" && (
                <div
                    className="fixed inset-0 z-[110] flex items-center justify-center bg-background/80 p-6"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Microphone blocked"
                >
                    {/* Dynamic Background Aura */}
                    <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[120px] opacity-30 animate-pulse"></div>

                    <div className="relative bg-white/5 backdrop-blur-3xl p-6 sm:p-8 md:p-12 rounded-[2.5rem] sm:rounded-[3rem] md:rounded-[3.5rem] border-2 border-white/10 shadow-2xl max-w-md text-center overflow-hidden">
                        {/* Tech Decoration */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-primary/20 rounded-full blur-3xl"></div>
                        <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-lime-400/20 rounded-full blur-3xl"></div>

                        <div className="relative z-10">
                            <div className="w-20 h-20 sm:w-22 sm:h-22 md:w-24 md:h-24 bg-gradient-to-tr from-primary to-lime-400 rounded-full flex items-center justify-center mx-auto mb-6 sm:mb-7 md:mb-8 shadow-xl ring-4 ring-white/10">
                                <span className="material-symbols-outlined text-white text-4xl sm:text-5xl font-black">
                                    mic_off
                                </span>
                            </div>

                            <h2 className="text-white text-3xl sm:text-4xl font-black uppercase italic mb-3 sm:mb-4 tracking-tighter">
                                Sync Failure!
                            </h2>
                            <p className="text-white/70 text-base sm:text-lg font-bold mb-8 sm:mb-10 leading-relaxed">
                                Microphone link is{" "}
                                <span className="text-lime-400">offline</span>.
                                Please authorize system access to continue
                                word-smashing mission!
                            </p>

                            {/* ponytail: manual escape hatch. Permissions.onchange does
                                NOT fire everywhere (iOS Safari mic access is a
                                Settings.app journey and never re-prompts; older Firefox
                                is the same). Without this button those kids had no way
                                out of the modal at all — the automatic recovery edge in
                                the gameplay pages never gets a chance to run.

                                Granted → permissionState flips → the page's effect calls
                                refillRoundClock and unmounts this. Still denied →
                                nothing changes, so a retry costs a kid nothing.
                                Copy is second-person, same register as the copy above. */}
                            <button
                                type="button"
                                onClick={() => onRetry?.()}
                                data-sfx="major"
                                autoFocus
                                className="tactile-button mx-auto flex items-center justify-center gap-2 bg-accent text-surface-container-lowest font-black px-8 py-4 rounded-xl border-2 border-surface-container-lowest text-lg uppercase tracking-[0.12em] hover:bg-accent-hover"
                            >
                                <span className="material-symbols-outlined text-2xl" aria-hidden="true">
                                    mic
                                </span>
                                Try Again
                            </button>
                            <p className="text-white/50 text-xs font-bold uppercase tracking-wider mt-4">
                                Already allowed it? Reload the page.
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
