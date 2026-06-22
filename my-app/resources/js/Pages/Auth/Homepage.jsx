import { useState, useMemo } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const FALLING_WORDS = [
    "vocabulary", "explore", "discover", "master", "practice",
    "speak", "listen", "learn", "achieve", "progress"
];

const features = [
    {
        icon: "📖",
        title: "Read Mode",
        desc: "Build vocabulary through engaging reading exercises with real-time pronunciation guidance.",
    },
    {
        icon: "🎤",
        title: "Speak Mode",
        desc: "Practice speaking with AI-powered feedback to improve fluency and confidence.",
    },
    {
        icon: "🏆",
        title: "Badges & Rewards",
        desc: "Earn badges and track achievements as you progress through each learning milestone.",
    },
    {
        icon: "📊",
        title: "Progress Tracking",
        desc: "Monitor your improvement with detailed analytics and personalized learning insights.",
    },
];

export default function Homepage() {
    const [mobileOpen, setMobileOpen] = useState(false);

    const COLORS = ["#a78bfa", "#bef264", "#ffffff"];

    const fallingWords = useMemo(() =>
        FALLING_WORDS.map((word, i) => ({
            word,
            left: `${Math.random() < 0.5 ? Math.random() * 20 : 70 + Math.random() * 30}%`,
            delay: `${Math.random() * 15}s`,
            duration: `${8 + Math.random() * 12}s`,
            size: `${1 + Math.random() * 1.5}rem`,
            opacity: 0.08 + Math.random() * 0.07,
            color: COLORS[i % COLORS.length],
        })),
    []);

    const { data, setData, post, processing, errors, reset } = useForm({
        name: "",
        pin: "",
    });

    const handleSubmit = (e) => {
        e.preventDefault();
        post("/", {
            onFinish: () => reset("pin"),
        });
    };

    const scrollTo = (id) => {
        setMobileOpen(false);
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    };

    return (
        <div className="min-h-screen bg-zinc-950 text-white">
            <Head title="Word-O-Matic - Learn Through Play" />

            {/* HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-zinc-950/90 backdrop-blur-md border-b border-zinc-800">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <h1 className="text-2xl font-black text-purple-500 uppercase italic tracking-tighter">
                            WORD-O-MATIC
                        </h1>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollTo("features")}
                            className="text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className="text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors"
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollTo("login")}
                            className="text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest transition-colors"
                        >
                            Login
                        </button>
                        <Link
                            href="/teacher/login"
                            className="px-5 py-2.5 bg-purple-600 hover:bg-purple-500 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-b-[3px] border-purple-950 active:translate-y-0.5"
                        >
                            Teacher Login
                        </Link>
                    </nav>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className="md:hidden p-2 text-zinc-400 hover:text-white"
                        aria-label="Toggle menu"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            {mobileOpen ? (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M6 18L18 6M6 6l12 12"
                                />
                            ) : (
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M4 6h16M4 12h16M4 18h16"
                                />
                            )}
                        </svg>
                    </button>
                </div>

                {mobileOpen && (
                    <div className="md:hidden bg-zinc-900 border-b border-zinc-800 px-4 py-4 space-y-3">
                        <button
                            onClick={() => scrollTo("features")}
                            className="block w-full text-left text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest py-2"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className="block w-full text-left text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest py-2"
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollTo("login")}
                            className="block w-full text-left text-zinc-400 hover:text-white font-bold uppercase text-xs tracking-widest py-2"
                        >
                            Login
                        </button>
                        <Link
                            href="/teacher/login"
                            className="block text-center px-5 py-3 bg-purple-600 hover:bg-purple-500 rounded-xl font-black uppercase text-xs tracking-widest transition-all border-b-[3px] border-purple-950"
                        >
                            Teacher Login
                        </Link>
                    </div>
                )}
            </header>

            {/* HERO */}
            <section className="relative min-h-screen flex items-center justify-center pt-16 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none">
                    <style>{`
                        @keyframes wordFall {
                            0% { transform: translateY(-120vh); opacity: 0; }
                            10% { opacity: 1; }
                            90% { opacity: 1; }
                            100% { transform: translateY(120vh); opacity: 0; }
                        }
                        @keyframes float {
                            0%, 100% { transform: translateY(0) rotate(0deg); }
                            50% { transform: translateY(-30px) rotate(180deg); }
                        }
                        @keyframes floatReverse {
                            0%, 100% { transform: translateY(0) rotate(0deg); }
                            50% { transform: translateY(30px) rotate(-180deg); }
                        }
                    `}</style>
                    {fallingWords.map((w, i) => (
                        <span
                            key={i}
                            className="absolute font-black uppercase italic tracking-tighter text-white select-none"
                            style={{
                                left: w.left,
                                top: 0,
                                fontSize: w.size,
                                opacity: w.opacity,
                                color: w.color,
                                textShadow: `0 0 10px ${w.color}40`,
                                filter: `blur(0.5px)`,
                                animation: `wordFall ${w.duration} linear ${w.delay} infinite`,
                            }}
                        >
                            {w.word}
                        </span>
                    ))}
                    <div className="absolute inset-0 bg-gradient-to-b from-zinc-950/70 via-zinc-950/30 to-zinc-950/70 pointer-events-none" />

                    <div className="absolute top-[15%] left-[8%] w-4 h-4 border-2 border-purple-500/30 rounded-full animate-[float_6s_ease-in-out_infinite]" />
                    <div className="absolute top-[30%] right-[12%] w-3 h-3 bg-lime-400/20 rotate-45 animate-[floatReverse_8s_ease-in-out_infinite]" />
                    <div className="absolute bottom-[25%] left-[15%] w-5 h-5 border-2 border-purple-400/20 rounded-full animate-[float_7s_ease-in-out_infinite_1s]" />
                    <div className="absolute top-[60%] right-[8%] w-3 h-3 bg-white/10 rotate-45 animate-[floatReverse_5s_ease-in-out_infinite_0.5s]" />
                    <div className="absolute bottom-[15%] right-[20%] text-lg opacity-10 animate-[float_9s_ease-in-out_infinite_2s]">✦</div>
                    <div className="absolute top-[10%] right-[35%] text-xs opacity-10 animate-[floatReverse_7s_ease-in-out_infinite_1.5s]">✦</div>

                    <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[160px] rounded-full"></div>
                    <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-lime-500 opacity-5 blur-[160px] rounded-full"></div>
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
                        Learn
                        <br />
                        <span className="text-lime-400">Through</span>
                        <br />
                        Play
                    </h1>
                    <p className="mt-6 text-zinc-400 text-lg md:text-xl max-w-2xl mx-auto font-bold">
                        Word-O-Matic combines reading and speaking exercises
                        with gamified progression to make vocabulary building
                        fun and effective.
                    </p>
                    <button
                        onClick={() => scrollTo("login")}
                        className="mt-10 px-10 py-5 bg-lime-400 text-zinc-950 rounded-2xl border-b-[6px] border-green-800 font-black uppercase italic text-lg tracking-tight hover:bg-lime-300 transition-all active:translate-y-1 active:border-b-[2px] shadow-[0_10px_30px_-10px_rgba(163,230,53,0.5)]"
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-20 md:py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-center mb-4">
                        Why <span className="text-lime-400">Word-O-Matic</span>
                    </h2>
                    <p className="text-zinc-500 text-center font-bold uppercase text-xs tracking-[0.2em] mb-16">
                        Everything you need to master vocabulary
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="bg-zinc-900 border-4 border-zinc-800 rounded-[28px] p-6 md:p-8 hover:border-lime-400/30 transition-all duration-300"
                            >
                                <span className="text-4xl block mb-4">
                                    {f.icon}
                                </span>
                                <h3 className="text-lg font-black uppercase italic mb-3">
                                    {f.title}
                                </h3>
                                <p className="text-zinc-400 text-sm leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="py-20 md:py-32 px-4 bg-zinc-900/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                        About <span className="text-lime-400">the Project</span>
                    </h2>
                    <div className="w-20 h-1 bg-lime-400 mx-auto mb-8 rounded-full"></div>
                    <p className="text-zinc-300 text-lg md:text-xl leading-relaxed">
                        Word-O-Matic is an interactive learning platform
                        designed for students to build vocabulary through
                        reading and speaking exercises. Teachers can create
                        custom word and paragraph modules, track student
                        progress, and assign targeted exercises — all within a
                        gamified environment that keeps learners engaged and
                        motivated.
                    </p>
                </div>
            </section>

            {/* STUDENT LOGIN */}
            <section
                id="login"
                className="py-20 md:py-32 px-4 flex items-center justify-center"
            >
                <div className="relative w-full max-w-lg">
                    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-purple-600 opacity-10 blur-[120px] rounded-full pointer-events-none"></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-900 opacity-10 blur-[120px] rounded-full pointer-events-none"></div>

                    <div className="relative bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-8 md:p-10 shadow-[20px_20px_0_0_#1e1b4b]">
                        <header className="text-center mb-8">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-white">
                                Student{" "}
                                <span className="text-lime-400">Login</span>
                            </h2>
                            <p className="text-zinc-500 text-xs font-black uppercase tracking-[0.2em] mt-2">
                                Enter your credentials
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                        Name:
                                    </label>
                                    <input
                                        type="text"
                                        className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="Identification Name..."
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p className="text-red-500 text-xs font-black uppercase ml-2">
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label className="text-sm font-black uppercase tracking-widest text-zinc-400 ml-2">
                                        PIN:
                                    </label>
                                    <input
                                        type="password"
                                        value={data.pin}
                                        onChange={(e) =>
                                            setData("pin", e.target.value)
                                        }
                                        className="w-full p-5 bg-zinc-950 border-4 border-zinc-800 rounded-2xl text-white font-bold focus:border-lime-400 outline-none transition-all placeholder:text-zinc-800"
                                        placeholder="XXXX"
                                    />
                                    {errors.pin && (
                                        <p className="text-red-500 text-xs font-black uppercase ml-2">
                                            {errors.pin}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full py-6 mt-4 rounded-2xl border-b-[8px] font-black uppercase italic text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 bg-lime-400 text-zinc-950 border-green-800 hover:bg-lime-300 shadow-[0_10px_20px_-10px_rgba(163,230,53,0.5)]"
                            >
                                <span>LOGIN</span>
                                <span className="text-3xl">🚀</span>
                            </button>
                        </form>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t border-zinc-800 py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
                    <div className="flex items-center gap-2">
                         <h1 className="text-2xl font-black text-purple-500 uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </h1>
                    </div>
                    <div className="flex items-center gap-6 text-xs font-black uppercase tracking-widest text-zinc-500">
                        <Link
                            href="/teacher/login"
                            className="hover:text-purple-400 transition-colors"
                        >
                            Teacher Login
                        </Link>
                        <button
                            onClick={() => scrollTo("features")}
                            className="hover:text-white transition-colors"
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className="hover:text-white transition-colors"
                        >
                            About
                        </button>
                    </div>
                    <p className="text-[10px] text-zinc-600 font-black uppercase tracking-[0.3em]">
                        Word-O-Matic Terminal v1.0.4
                    </p>
                </div>
            </footer>
        </div>
    );
}
