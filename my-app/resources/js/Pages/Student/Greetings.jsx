import { Link } from "@inertiajs/react";

export default function Greetings({ name = "ALEX" }) {
    return (
        <div className="m-0 p-0 overflow-hidden">
            {/* <!-- BEGIN: Main Background Container --> */}
            <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
                {/* <!-- BEGIN: Decorative Floating Elements --> */}
                {/* <!-- Top Left Robot --> */}
                <div
                    className="absolute top-10 left-10 text-6xl floating-emoji"
                    style={{ animationDelay: '0s' }}
                >
                    🤖
                </div>
                {/* <!-- Top Right Stars --> */}
                <div
                    className="absolute top-20 right-20 text-5xl floating-emoji"
                    style={{ animationDelay: '1s' }}
                >
                    🌟
                </div>
                {/* <!-- Bottom Left Rocket --> */}
                <div
                    className="absolute bottom-20 left-20 text-7xl floating-emoji"
                    style={{ animationDelay: '2s' }}
                >
                    🚀
                </div>
                {/* <!-- Bottom Right Party Popper --> */}
                <div
                    className="absolute bottom-10 right-10 text-6xl floating-emoji"
                    style={{ animationDelay: '0.5s' }}
                >
                    🎉
                </div>
                {/* <!-- Extra sparkles for theme --> */}
                <div className="absolute top-1/4 right-1/4 text-3xl animate-pulse opacity-40 text-lime-400">
                    ✨
                </div>
                <div className="absolute bottom-1/3 left-1/4 text-3xl animate-pulse opacity-40 text-purple-500">
                    ✨
                </div>
                {/* <!-- END: Decorative Floating Elements --> */}
                {/* <!-- BEGIN: Central Content Card --> */}
                <section
                    className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center max-w-4xl mx-4 z-10"
                    data-purpose="greeting-card"
                >
                    {/* <!-- Top Icon/Speech Bubble Style Decor --> */}
                    <div className="mb-6 animate-bounce-slow">
                        <span className="text-7xl">🤖</span>
                    </div>
                    {/* <!-- Main Headline --> */}
                    <h1 className="flex flex-col gap-2 mb-8 select-none">
                        <span className="text-white text-5xl md:text-7xl font-black italic uppercase tracking-tight">
                            WELCOME,
                        </span>
                        <span className="text-lime-400 text-6xl md:text-9xl font-black uppercase tracking-tighter animate-pulse-fast">
                            {name.toUpperCase()}!
                        </span>
                    </h1>
                    {/* <!-- Subtext --> */}
                    <p className="text-zinc-400 text-xl md:text-2xl font-bold mb-12 max-w-md uppercase tracking-widest">
                        The Word-O-Matic is powered up and ready for your
                        language skills!
                    </p>
                    {/* <!-- BEGIN: Call to Action --> */}
                    <div className="w-full flex justify-center">
                        <Link
                            href="/tutorial"
                            className="group relative bg-lime-400 hover:bg-lime-300 text-zinc-950 text-2xl md:text-4xl font-black py-6 px-12 rounded-2xl border-b-[6px] border-green-800 tactile-button transition-all flex items-center gap-4 uppercase tracking-tighter active:scale-95"
                            data-purpose="continue-button"
                            id="continue-btn"
                        >
                            CONTINUE TO TUTORIAL
                            <span className="text-3xl group-hover:scale-125 transition-transform">
                                🚀
                            </span>
                        </Link>
                    </div>
                    {/* <!-- END: Call to Action --> */}
                    {/* <!-- Footer Help Text --> */}
                    <p className="mt-8 text-zinc-500 font-bold text-sm tracking-[0.2em] uppercase">
                        Ready to solve the Mystery of the Word-O-Matic?
                    </p>
                </section>
                {/* <!-- END: Central Content Card --> */}
                {/* <!-- BEGIN: Footer Branding --> */}
                <footer className="absolute bottom-8 flex gap-4">
                    <div className="bg-zinc-900/80 px-4 py-1 rounded-full flex items-center gap-2 shadow-sm border border-zinc-800">
                        <span className="text-lg">🏫</span>
                        <span className="text-xs font-black text-white">
                            GRADE 5 & 6
                        </span>
                    </div>
                    <div className="bg-zinc-900/80 px-4 py-1 rounded-full flex items-center gap-2 shadow-sm border border-zinc-800">
                        <span className="text-lg">🧩</span>
                        <span className="text-xs font-black text-lime-400 uppercase">
                            Language Fun
                        </span>
                    </div>
                </footer>
                {/* <!-- END: Footer Branding --> */}
                {/* <!-- Decorative Cog Overlay (Subtle) --> */}
                <div className="absolute bottom-24 right-24 opacity-10 pointer-events-none">
                    <svg
                        className="text-lime-400 animate-[spin_10s_linear_infinite]"
                        fill="currentColor"
                        height="120"
                        viewBox="0 0 24 24"
                        width="120"
                    >
                        <path d="M12 15a3 3 0 100-6 3 3 0 000 6z"></path>
                        <path
                            clipRule="evenodd"
                            d="M1.323 11.447C2.811 6.976 7.028 3.75 12.001 3.75c4.97 0 9.185 3.223 10.675 7.69.12.362.12.752 0 1.113-1.487 4.466-5.705 7.697-10.677 7.697-4.97 0-9.186-3.223-10.675-7.69a1.762 1.762 0 010-1.113zM17.25 12a5.25 5.25 0 11-10.5 0 5.25 5.25 0 0110.5 0z"
                            fillRule="evenodd"
                        ></path>
                    </svg>
                </div>
            </main>
            {/* <!-- END: Main Background Container --> */}
            {/* <!-- BEGIN: Logic --> */}

            {/* <!-- END: Logic --> */}
        </div>
    );
}
