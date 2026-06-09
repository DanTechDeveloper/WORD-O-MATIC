export default function CountdownGameplay({ gameState, countdownValue }) {
    return (
        <>
            {gameState === "COUNTDOWN" && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/60 backdrop-blur-2xl">
                    <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[150px] opacity-40 animate-pulse"></div>
                    <span className="relative z-10 text-[12rem] font-black text-lime-400 italic animate-bounce drop-shadow-[0_0_50px_rgba(163,230,53,0.8)]">
                        {countdownValue}
                    </span>
                </div>
            )}
        </>
    );
}
