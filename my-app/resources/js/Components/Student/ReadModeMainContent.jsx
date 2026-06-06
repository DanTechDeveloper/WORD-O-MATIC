export default function ReadModeMainContent() {
    return (
        <>
            <div className="flex-1 w-full relative overflow-visible pointer-events-none">
                {/* <!-- Word 1: Falling Syntax --> */}
                <div className="absolute top-[10%] left-[15%] animate-bounce">
                    <div className="bg-white/90 backdrop-blur-md px-8 py-3 rounded-xl shadow-2xl rotate-[-5deg] border-4 border-indigo-400">
                        <span className="text-indigo-900 text-4xl font-black tracking-tighter uppercase italic">
                            Syntax
                        </span>
                    </div>
                    <span class="absolute -top-4 -right-4 text-3xl">✨</span>
                </div>
                {/* <!-- Word 2: Exploded Bomb (Good Job) --> */}
                <div class="absolute top-[30%] left-[45%] flex flex-col items-center justify-center animate-pulse">
                    {/* <!-- Exploding Bubble Effect --> */}
                    <div class="absolute w-64 h-64 bg-primary/40 rounded-full blur-3xl"></div>
                    <div class="relative z-10 text-center">
                        <p class="text-white text-7xl font-black drop-shadow-[0_10px_0_rgba(0,0,0,0.4)] tracking-tighter uppercase [text-shadow:_-4px_-4px_0_#000,4px_-4px_0_#000,-4px_4px_0_#000,4px_4px_0_#000,8px_8px_0_#ec5b13]">
                            GOOD JOB!
                        </p>
                        <div class="flex gap-4 justify-center mt-4">
                            <span class="text-5xl">💥</span>
                            <span class="text-5xl animate-bounce">💣</span>
                            <span class="text-5xl">💥</span>
                        </div>
                    </div>
                </div>
                {/* <!-- Word 3: Falling Grammar --> */}
                <div
                    className="absolute top-[20%] right-[10%] animate-bounce"
                    style={{ animationDelay: "1s" }}
                >
                    <div className="bg-white/90 backdrop-blur-md px-8 py-3 rounded-xl shadow-2xl rotate-[8deg] border-4 border-pink-400">
                        <span className="text-pink-900 text-4xl font-black tracking-tighter uppercase italic">
                            Grammar
                        </span>
                    </div>
                    <span className="absolute -top-4 -left-4 text-3xl">🔥</span>
                </div>
                {/* <!-- Word 4: Distant Word --> */}
                <div
                    className="absolute top-[50%] left-[10%] opacity-80 scale-75 animate-bounce"
                    style={{ animationDuration: "3s" }}
                >
                    <div className="bg-white/60 backdrop-blur-sm px-6 py-2 rounded-xl shadow-xl rotate-[15deg]">
                        <span className="text-purple-900 text-3xl font-black tracking-tighter uppercase">
                            Context
                        </span>
                    </div>
                </div>
                {/* <!-- Word 5: Linguistic Bomb ready to pop --> */}
                <div className="absolute top-[60%] right-[20%] animate-pulse">
                    <div className="bg-primary p-4 rounded-full border-4 border-white shadow-2xl flex items-center justify-center">
                        <span className="text-white text-2xl font-black tracking-tighter uppercase italic px-4">
                            Linguistic
                        </span>
                    </div>
                    <span class="absolute -bottom-2 -right-2 text-4xl">💣</span>
                </div>
            </div>
        </>
    );
}
