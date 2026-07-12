import { useState } from "react";
import { Head, useForm, Link } from "@inertiajs/react";

const features = [
    {
        icon: "menu_book",
        title: "WORD BLAST Mode",
        desc: "Build vocabulary through engaging reading exercises with real-time pronunciation guidance.",
    },
    {
        icon: "mic",
        title: "STORY QUEST Mode",
        desc: "Practice speaking with AI-powered feedback to improve fluency and confidence.",
    },
    {
        icon: "emoji_events",
        title: "Badges & Rewards",
        desc: "Earn badges and track achievements as you progress through each learning milestone.",
    },
    {
        icon: "bar_chart",
        title: "Progress Tracking",
        desc: "Monitor your improvement with detailed analytics and personalized learning insights.",
    },
];

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Homepage() {
    const [mobileOpen, setMobileOpen] = useState(false);

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
        <div className="min-h-screen bg-background text-on-background">
            <Head title="Word-O-Matic - Learn Through Play" />

            {/* HEADER */}
            <header className="fixed top-0 left-0 w-full z-50 bg-background border-b-4 border-outline">
                <div className="max-w-7xl mx-auto px-4 md:px-8 flex items-center justify-between h-16">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-primary font-headline-xl uppercase italic tracking-tighter">
                            WORD-O-MATIC
                        </span>
                    </div>

                    <nav className="hidden md:flex items-center gap-8">
                        <button
                            onClick={() => scrollTo("features")}
                            className={`text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest transition-colors rounded ${focusRing}`}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className={`text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest transition-colors rounded ${focusRing}`}
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollTo("login")}
                            className={`text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest transition-colors rounded ${focusRing}`}
                        >
                            Login
                        </button>
                        <Link
                            href="/teacher/login"
                            className={`px-5 py-2.5 bg-transparent border-2 border-outline rounded-xl font-black uppercase text-xs tracking-widest text-on-surface-variant hover:text-accent hover:border-accent transition-all ${focusRing}`}
                        >
                            Teacher Login
                        </Link>
                    </nav>

                    <button
                        onClick={() => setMobileOpen(!mobileOpen)}
                        className={`md:hidden p-2 text-on-surface-variant hover:text-on-surface rounded ${focusRing}`}
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
                    <div className="md:hidden bg-surface-container-high border-b-4 border-outline px-4 py-4 space-y-3">
                        <button
                            onClick={() => scrollTo("features")}
                            className={`block w-full text-left text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest py-2 rounded ${focusRing}`}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className={`block w-full text-left text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest py-2 rounded ${focusRing}`}
                        >
                            About
                        </button>
                        <button
                            onClick={() => scrollTo("login")}
                            className={`block w-full text-left text-on-surface-variant hover:text-on-surface font-bold uppercase text-xs tracking-widest py-2 rounded ${focusRing}`}
                        >
                            Login
                        </button>
                        <Link
                            href="/teacher/login"
                            className={`block text-center px-5 py-3 bg-transparent border-2 border-outline rounded-xl font-black uppercase text-xs tracking-widest text-on-surface-variant hover:text-accent hover:border-accent transition-all ${focusRing}`}
                        >
                            Teacher Login
                        </Link>
                    </div>
                )}
            </header>

            {/* HERO */}
            <section className="relative min-h-screen flex items-center justify-center pt-16">
                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase italic tracking-tighter leading-[0.9]">
                        Learn
                        <br />
                        <span className="text-accent">Through</span>
                        <br />
                        Play
                    </h1>
                    <p className="mt-6 text-on-surface-variant text-lg md:text-xl max-w-2xl mx-auto font-bold">
                        Word-O-Matic combines reading and speaking exercises
                        with gamified progression to make vocabulary building
                        fun and effective.
                    </p>
                    <button
                        onClick={() => scrollTo("login")}
                        className={`mt-10 px-10 py-5 bg-accent text-[#0c0c1f] rounded-2xl border-b-[6px] border-accent-deep font-black uppercase italic text-lg tracking-tight hover:bg-accent-hover transition-all active:translate-y-1 active:border-b-[2px] ${focusRing}`}
                    >
                        Get Started
                    </button>
                </div>
            </section>

            {/* FEATURES */}
            <section id="features" className="py-20 md:py-32 px-4">
                <div className="max-w-6xl mx-auto">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-center mb-4">
                        Why <span className="text-accent">Word-O-Matic</span>
                    </h2>
                    <p className="text-on-surface-variant text-center font-bold uppercase text-xs tracking-widest mb-16">
                        Everything you need to master vocabulary
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                        {features.map((f, i) => (
                            <div
                                key={i}
                                className="bg-surface-container-high border-4 border-outline rounded-2xl p-6 md:p-8 tactile-card hover:border-accent/30 transition-all duration-300"
                            >
                                <span className="material-symbols-outlined text-4xl block mb-4 text-primary">
                                    {f.icon}
                                </span>
                                <h3 className="text-lg font-black uppercase italic mb-3">
                                    {f.title}
                                </h3>
                                <p className="text-on-surface-variant text-sm leading-relaxed">
                                    {f.desc}
                                </p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ABOUT */}
            <section id="about" className="py-20 md:py-32 px-4 bg-surface-container/50">
                <div className="max-w-4xl mx-auto text-center">
                    <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter mb-6">
                        About <span className="text-accent">the Project</span>
                    </h2>
                    <div className="w-20 h-1 bg-accent mx-auto mb-8 rounded-full" />
                    <p className="text-on-surface text-lg md:text-xl leading-relaxed">
                        Word-O-Matic is an interactive learning platform
                        designed for students to build vocabulary through
                        reading and speaking exercises. Teachers can create
                        custom word and paragraph modules, track student
                        progress, and assign targeted exercises all within a
                        gamified environment that keeps learners engaged and
                        motivated.
                    </p>
                </div>
            </section>

            {/* STUDENT LOGIN */}
            <section
                id="login"
                className="py-20 md:py-32 px-4 flex items-center justify-center relative overflow-hidden"
            >
                <div className="relative w-full max-w-lg">
                    <div className="relative bg-surface-container-high border-4 border-primary-container tactile-card rounded-2xl p-6 md:p-10">
                        <header className="text-center mb-8">
                            <h2 className="text-3xl font-black uppercase italic tracking-tighter text-on-surface">
                                Student{" "}
                                <span className="text-accent">Login</span>
                            </h2>
                            <p className="text-on-surface-variant text-xs font-black uppercase tracking-widest mt-2">
                                Enter your name &amp; PIN
                            </p>
                        </header>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-5">
                                <div className="space-y-2">
                                    <label
                                        htmlFor="name"
                                        className="text-sm font-black uppercase tracking-widest text-on-surface-variant ml-2"
                                    >
                                        Name:
                                    </label>
                                    <input
                                        id="name"
                                        name="name"
                                        type="text"
                                        autoComplete="username"
                                        aria-invalid={
                                            errors.name ? "true" : undefined
                                        }
                                        aria-describedby={
                                            errors.name
                                                ? "name-error"
                                                : undefined
                                        }
                                        className="w-full p-4 md:p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl text-on-surface font-bold focus:border-accent outline-none transition-all placeholder:text-on-surface-variant/40"
                                        placeholder="Your name"
                                        value={data.name}
                                        onChange={(e) =>
                                            setData("name", e.target.value)
                                        }
                                    />
                                    {errors.name && (
                                        <p
                                            id="name-error"
                                            aria-live="polite"
                                            className="text-error text-xs font-black uppercase ml-2"
                                        >
                                            {errors.name}
                                        </p>
                                    )}
                                </div>
                                <div className="space-y-2">
                                    <label
                                        htmlFor="pin"
                                        className="text-sm font-black uppercase tracking-widest text-on-surface-variant ml-2"
                                    >
                                        PIN:
                                    </label>
                                    <input
                                        id="pin"
                                        name="pin"
                                        type="text"
                                        inputMode="numeric"
                                        autoComplete="off"
                                        aria-invalid={
                                            errors.pin ? "true" : undefined
                                        }
                                        aria-describedby={
                                            errors.pin
                                                ? "pin-error"
                                                : undefined
                                        }
                                        className="w-full p-4 md:p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl text-on-surface font-bold focus:border-accent outline-none transition-all placeholder:text-on-surface-variant/40 tracking-[0.3em]"
                                        placeholder="••••"
                                        value={data.pin}
                                        onChange={(e) =>
                                            setData("pin", e.target.value)
                                        }
                                    />
                                    {errors.pin && (
                                        <p
                                            id="pin-error"
                                            aria-live="polite"
                                            className="text-error text-xs font-black uppercase ml-2"
                                        >
                                            {errors.pin}
                                        </p>
                                    )}
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={processing}
                                className={`w-full py-5 md:py-6 mt-4 rounded-2xl border-b-[6px] md:border-b-[8px] border-accent-deep font-black uppercase italic text-xl md:text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 bg-accent text-[#0c0c1f] hover:bg-accent-hover disabled:opacity-70 ${focusRing}`}
                            >
                                <span>
                                    {processing ? "Logging in…" : "LOGIN"}
                                </span>
                                <span className="material-symbols-outlined text-3xl">
                                    rocket_launch
                                </span>
                            </button>
                            <p className="text-center text-on-surface-variant text-xs font-bold">
                                Ask your teacher if you don't know your name or
                                PIN.
                            </p>
                        </form>
                    </div>
                </div>
            </section>

            {/* FOOTER */}
            <footer className="border-t-4 border-outline py-10 px-4">
                <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-8 md:gap-6 text-center md:text-left">
                    <div className="flex items-center gap-2">
                        <span className="text-2xl font-black text-primary font-headline-xl uppercase italic tracking-tighter">
                            WORD-O-MATIC
                        </span>
                    </div>
                    <div className="flex flex-wrap justify-center items-center gap-4 md:gap-6 text-xs font-black uppercase tracking-widest text-on-surface-variant">
                        <Link
                            href="/teacher/login"
                            className={`hover:text-accent transition-colors rounded ${focusRing}`}
                        >
                            Teacher Login
                        </Link>
                        <button
                            onClick={() => scrollTo("features")}
                            className={`hover:text-on-surface transition-colors rounded ${focusRing}`}
                        >
                            Features
                        </button>
                        <button
                            onClick={() => scrollTo("about")}
                            className={`hover:text-on-surface transition-colors rounded ${focusRing}`}
                        >
                            About
                        </button>
                    </div>
                </div>
            </footer>
        </div>
    );
}
