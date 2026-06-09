import { Link } from "@inertiajs/react";

export default function GameOverModal({
    gameState,
    currentWordIndex,
    totalWords,
    onPlayAgain,
}) {
    if (gameState !== "GAMEOVER") return null;

    const accuracy =
        totalWords > 0
            ? ((currentWordIndex / totalWords) * 100).toFixed(2)
            : 0;

    return (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-slate-950/80 backdrop-blur-xl p-6">
            <div className="absolute w-96 h-96 bg-gradient-to-tr from-primary via-fuchsia-500 to-lime-400 blur-[120px] opacity-30 animate-pulse"></div>

            <div className="relative bg-white/5 backdrop-blur-3xl p-12 rounded-[3.5rem] border-2 border-white/10 shadow-2xl max-w-md text-center overflow-hidden">

                <div className="relative z-10">
                    <h2 className="text-white text-4xl font-black uppercase mb-4">
                        GAME OVER!
                    </h2>

                    <div className="space-y-4 mb-10 text-left">
                        <p className="text-white text-2xl font-black">
                            Words Smashed:{" "}
                            <span className="text-lime-400">
                                {currentWordIndex}
                            </span>
                        </p>

                        <p className="text-white text-2xl font-black">
                            Total Words:{" "}
                            <span className="text-fuchsia-400">
                                {totalWords}
                            </span>
                        </p>

                        <p className="text-white text-2xl font-black">
                            Accuracy Rate:{" "}
                            <span className="text-primary">
                                {accuracy}%
                            </span>
                        </p>
                    </div>

                    <div className="flex flex-col gap-4">
                        <button
                            onClick={onPlayAgain}
                            className="w-full bg-lime-400 text-slate-950 text-2xl font-black py-6 rounded-2xl uppercase"
                        >
                            Play Again
                        </button>

                        <Link
                        href="/student/speakModeLevels"
                            className="w-full bg-white/5 border-2 border-white/10 text-white text-xl font-black py-5 rounded-2xl uppercase"
                        >
                            Back To Map
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}