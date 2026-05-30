export default function GameplayReadMode() {
    return (
        <div>
            <div className="bg-slate-950 text-on-background font-body-md min-h-screen flex flex-col">
                {/* <!-- Main Content Canvas --> */}
                <main className="flex-grow flex flex-col items-start justify-center px-margin max-w-7xl mx-auto w-full py-20">
                    <div className="w-full relative">
                        <div className="font-headline-xl text-left leading-tight tracking-tight select-none text-4xl md:text-5xl lg:text-6xl">
                            <span className="text-purple-900/40">
                                In a distant nebula, a brave{" "}
                            </span>
                            <span className="relative inline-block bg-lime-400 text-slate-950 px-4 rounded-sm neo-shadow-lime py-0.5">
                                <span className="blinking-cursor"></span>
                                galactic explorer
                            </span>
                            <span className="text-purple-900/40 opacity-50">
                                {" "}
                                prepares to chart the unknown clusters of the
                                binary sun system. The engines hum with plasma
                                energy as the navigation bot calculates the
                                hyperspace jump sequence.
                            </span>
                        </div>
                    </div>
                </main>
            </div>
        </div>
    );
}
