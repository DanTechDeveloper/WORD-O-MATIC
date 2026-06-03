import { useState } from "react";
import { Link } from "@inertiajs/react";

export default function Welcome() {
    const [inGameName, setInGameName] = useState("");
    const [selectedAvatar, setSelectedAvatar] = useState(null);
    const avatars = [
        { id: 1, char: "🐱" },
        { id: 2, char: "🐶" },
        { id: 3, char: "🦊" },
        { id: 4, char: "🐸" },
    ];

    return (
        <div className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
            {/* <!-- Background decorative glow --> */}
            <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
                <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full"></div>
            </div>

            <main className="relative w-full max-w-2xl z-10">
                <section className="bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-12 relative overflow-hidden">
                    {/* Section 1: Welcome Message */}
                    <header className="text-center mb-10">
                        <h1 className="text-4xl md:text-6xl font-black text-white italic uppercase tracking-tight mb-4 leading-tight">
                            Welcome, <br />
                            <span className="text-lime-400">Explorer!</span>
                        </h1>
                    </header>

                    {/* Section 2: Name Input */}
                    <div className="space-y-4 animate-in fade-in slide-in-from-bottom-4 duration-700">
                        <label className="block text-xl font-black text-white uppercase tracking-wider ml-2">
                            What should we call you?
                        </label>
                        <input
                            type="text"
                            value={inGameName}
                            onChange={(e) => setInGameName(e.target.value)}
                            className="w-full p-5 text-2xl font-black rounded-2xl border-4 border-zinc-800 bg-zinc-950 text-lime-400 focus:border-lime-400 focus:ring-0 transition-all outline-none tactile-input placeholder:text-zinc-800"
                            placeholder="ENTER NAME"
                            maxLength={15}
                        />
                    </div>

                    {/* Section 3: Avatar Selection (Reveals after name is typed) */}
                    {name.trim().length >= 2 && (
                        <div className="mt-10 space-y-6 animate-in fade-in zoom-in duration-500">
                            <h2 className="text-xl font-black text-white uppercase tracking-wider ml-2">
                                Select your Avatar
                            </h2>
                            <div className="flex justify-center flex-wrap gap-4">
                                {avatars.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() => setSelectedAvatar(avatar.id)}
                                        className={`
                                            w-20 h-20 md:w-24 md:h-24 text-4xl md:text-5xl flex items-center justify-center rounded-2xl border-4 transition-all active:scale-95 tactile-button
                                            ${
                                                selectedAvatar === avatar.id
                                                    ? "bg-lime-400 border-white scale-105 shadow-[0_0_30px_rgba(163,230,53,0.5)]"
                                                    : "bg-zinc-950 border-zinc-800 hover:border-zinc-600"
                                            }
                                        `}
                                    >
                                        {avatar.char}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Section 4: Start Game (Reveals after avatar selection) */}
                    {selectedAvatar && (
                        <div className="mt-12 flex justify-center animate-in fade-in slide-in-from-bottom-8 duration-500">
                            <Link
                                href="/student/greetings"
                                className="group relative w-full md:w-auto bg-lime-400 hover:bg-lime-300 text-zinc-950 text-2xl md:text-3xl font-black py-5 px-16 rounded-2xl border-b-[6px] border-green-800 tactile-button transition-all flex items-center justify-center gap-4 uppercase tracking-tighter active:scale-95 active:border-b-0 active:translate-y-1"
                            >
                                <span>Begin Adventure</span>
                                <span className="text-4xl group-hover:translate-x-2 transition-transform">
                                    🚀
                                </span>
                            </Link>
                        </div>
                    )}
                </section>
            </main>

            {/* Floating Decorative Elements */}
            <div className="absolute top-10 right-10 text-6xl opacity-10 animate-bounce delay-700 pointer-events-none">
                ⭐
            </div>
            <div className="absolute bottom-10 left-10 text-6xl opacity-10 animate-pulse pointer-events-none">
                🛰️
            </div>
        </div>
    );
}