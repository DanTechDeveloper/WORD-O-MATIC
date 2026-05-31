import { Link } from "@inertiajs/react";

export default function Login() {
    const handleSubmit = (e) => {
        e.preventDefault();
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-zinc-950 text-white p-4 overflow-x-hidden relative">
            {/* Background decorative glow */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>

            <main className="relative w-full max-w-2xl z-10">
                <section className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    <header className="text-center mb-10">
                        <h1 className="text-4xl md:text-5xl font-black text-white italic uppercase tracking-tight mb-4 leading-tight">
                            Teacher <br />
                            <span className="text-lime-400">Control Panel</span>
                        </h1>
                    
                    </header>

                    <form className="space-y-8" onSubmit={handleSubmit}>
                        <div className="flex flex-col gap-3">
                            <label className="text-xl font-black text-white uppercase tracking-wider ml-2">
                                Username:
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    className="w-full p-5 pr-14 text-xl font-semibold rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-white focus:border-lime-400 focus:ring-0 transition-all outline-none tactile-input"
                                    placeholder="Enter username..."
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-2xl">
                                    👤
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col gap-3">
                            <label className="text-xl font-black text-white uppercase tracking-wider ml-2">
                                Password:
                            </label>
                            <div className="relative">
                                <input
                                    type="password"
                                    className="w-full p-5 pr-14 text-xl font-semibold rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-white focus:border-lime-400 focus:ring-0 transition-all outline-none tactile-input"
                                    placeholder="Enter password..."
                                />
                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-2xl">
                                    🔑
                                </div>
                            </div>
                        </div>

                        <div className="flex flex-col items-center pt-6">
                            <button
                                className="group relative w-full md:w-auto bg-lime-400 hover:bg-lime-300 text-zinc-950 text-2xl md:text-3xl font-black py-5 px-16 rounded-2xl border-b-[6px] border-green-800 tactile-button transition-all flex items-center justify-center gap-4 uppercase tracking-tighter active:scale-95"
                                type="submit"
                            >
                                <span>LOGIN</span>
                                <span className="text-3xl group-hover:scale-125 transition-transform">
                                    🚀
                                </span>
                            </button>
                            <p className="mt-8 text-zinc-500 font-bold text-center uppercase text-sm tracking-[0.2em]">
                                Ready to override the Word-O-Matic?
                            </p>
                        </div>
                    </form>

                    {/* Background Visual Accents */}
                    <div className="absolute bottom-4 right-4 text-5xl opacity-10 pointer-events-none rotate-12 text-lime-400">
                        ⚙️
                    </div>
                    <div className="absolute top-4 right-8 text-5xl opacity-10 pointer-events-none -rotate-12 text-purple-400">
                        💬
                    </div>
                    <div className="absolute bottom-20 left-4 text-5xl opacity-5 pointer-events-none text-white">
                        ⚡
                    </div>
                </section>
            </main>
        </div>
    );
}