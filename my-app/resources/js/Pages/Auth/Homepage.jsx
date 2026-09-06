import { Head, useForm, Link } from "@inertiajs/react";
import GameplayDemo from "@/Components/Student/GameplayDemo";

const SHAPES = [
    { size: 28, color: "#d1bcff", left: "8%",  delay: 0,    dur: 18, rotate: 45  },
    { size: 44, color: "#7000ff", left: "22%", delay: 3,    dur: 22, rotate: 0   },
    { size: 20, color: "#ff3bc0", left: "55%", delay: 1,    dur: 16, rotate: 45  },
    { size: 36, color: "#d1bcff", left: "70%", delay: 5,    dur: 20, rotate: 22  },
    { size: 24, color: "#ffb77f", left: "88%", delay: 2,    dur: 24, rotate: 45  },
    { size: 32, color: "#7000ff", left: "40%", delay: 7,    dur: 19, rotate: 0   },
    { size: 18, color: "#ff3bc0", left: "62%", delay: 4,    dur: 21, rotate: 45  },
    { size: 40, color: "#d1bcff", left: "12%", delay: 6,    dur: 17, rotate: 30  },
];

const focusRing =
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-secondary-container focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export default function Homepage() {
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

    return (
        <div className="min-h-screen bg-background text-on-background overflow-hidden">
            <Head title="Word-O-Matic - Learn Through Play" />

            {/* HERO = FULL-SCREEN LOGIN */}
            <section className="relative min-h-screen flex items-center justify-center pt-14 pb-20 px-4">
                {/* Arcade background layers */}
                <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
                    <style>
                        {`
                            .home-grid-bg {
                                background-image: radial-gradient(circle, rgba(112,0,255,0.15) 1px, transparent 1px);
                                background-size: 32px 32px;
                            }
                            .home-grid-fine {
                                background-image: radial-gradient(circle, rgba(209,188,255,0.04) 1px, transparent 1px);
                                background-size: 16px 16px;
                            }
                            .home-scanlines {
                                background: repeating-linear-gradient(
                                    0deg,
                                    transparent,
                                    transparent 3px,
                                    rgba(0,0,0,0.04) 3px,
                                    rgba(0,0,0,0.04) 4px
                                );
                            }
                            @keyframes home-glow-pulse {
                                0%, 100% { transform: translate(-50%, -50%) scale(1); opacity: 0.15; }
                                50%      { transform: translate(-50%, -50%) scale(1.08); opacity: 0.25; }
                            }
                            @keyframes home-shape-drift {
                                0%   { transform: translateY(0) rotate(var(--sr)); opacity: 0; }
                                10%  { opacity: var(--op); }
                                90%  { opacity: var(--op); }
                                100% { transform: translateY(-110vh) rotate(calc(var(--sr) + 180deg)); opacity: 0; }
                            }
                            @media (prefers-reduced-motion: reduce) {
                                .home-shape, .home-glow { animation: none !important; opacity: 0.3 !important; }
                            }
                        `}
                    </style>
                    <div className="home-grid-bg absolute inset-0" />
                    <div className="home-grid-fine absolute inset-0" />
                    <div
                        className="home-glow absolute rounded-full"
                        style={{
                            width: "600px",
                            height: "600px",
                            left: "50%",
                            top: "50%",
                            transform: "translate(-50%, -50%)",
                            background: "radial-gradient(circle, rgba(112,0,255,0.2) 0%, rgba(112,0,255,0.05) 50%, transparent 70%)",
                            boxShadow: "0 0 80px 40px rgba(112,0,255,0.08)",
                            animation: "home-glow-pulse 5s ease-in-out infinite",
                        }}
                    />
                    {SHAPES.map((s, i) => (
                        <div
                            key={i}
                            className="home-shape absolute"
                            style={{
                                width: s.size,
                                height: s.size,
                                left: s.left,
                                bottom: "-60px",
                                backgroundColor: s.color,
                                opacity: 0.12,
                                boxShadow: "4px 4px 0 0 #4c1d95",
                                transform: `rotate(${s.rotate}deg)`,
                                "--sr": `${s.rotate}deg`,
                                "--op": 0.12 + (i % 3) * 0.04,
                                animation: `home-shape-drift ${s.dur}s linear ${s.delay}s infinite`,
                            }}
                        />
                    ))}
                    <div className="home-scanlines absolute inset-0" />
                </div>

                {/* Vignette */}
                <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{
                        background: "radial-gradient(circle at center, rgba(12,12,31,0.6) 0%, rgba(12,12,31,0.2) 40%, transparent 60%)",
                    }}
                />

                {/* Content */}
                <div className="relative z-10 w-full max-w-7xl mx-auto text-center">
                    {/* Title */}
                    <h1
                        className="font-black uppercase italic tracking-tighter leading-[0.9]"
                        style={{
                            fontSize: "clamp(2.5rem, 10vw, 3rem)",
                            color: "#d1bcff",
                            textShadow: "0 0 20px rgba(209,188,255,0.3)",
                        }}
                    >
                        WORD-O-MATIC
                    </h1>
                    <p className="text-on-surface-variant text-lg md:text-xl font-bold">
                        Learn Through Play
                    </p>
            
                    {/* Split layout: demo left, login right */}
                    <div className="flex flex-col lg:flex-row items-center gap-10 lg:gap-20">
                        {/* Left: Gameplay demo carousel */}
                        <div className="flex-1 w-full max-w-2xl hidden lg:block">
                            <GameplayDemo />
                        </div>

                        {/* Right: Login card */}
                        <div className="w-full max-w-lg">
                            <div className="relative bg-surface-container-high border-4 border-primary-container tactile-card rounded-2xl p-6 md:p-10">
                                <header className="text-center mb-6">
                                    <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-on-surface">
                                        Student{" "}
                                        <span className="text-accent">Login</span>
                                    </h2>
                                    <p className="text-on-surface-variant text-sm font-bold mt-2">
                                        Enter your name and PIN
                                    </p>
                                </header>

                                <form onSubmit={handleSubmit} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="name"
                                                className="text-base font-black text-on-surface-variant ml-2"
                                            >
                                                Your name
                                            </label>
                                            <input
                                                id="name"
                                                name="name"
                                                type="text"
                                                autoComplete="username"
                                                aria-invalid={errors.name ? "true" : undefined}
                                                aria-describedby={errors.name ? "name-error" : undefined}
                                                className="w-full p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl text-on-surface text-lg font-bold focus:border-accent outline-none transition-all placeholder:text-on-surface-variant/40"
                                                placeholder="Your name"
                                                value={data.name}
                                                onChange={(e) => setData("name", e.target.value)}
                                            />
                                            {errors.name && (
                                                <p id="name-error" aria-live="polite" className="text-error text-sm font-bold ml-2">
                                                    {errors.name}
                                                </p>
                                            )}
                                        </div>
                                        <div className="space-y-2">
                                            <label
                                                htmlFor="pin"
                                                className="text-base font-black text-on-surface-variant ml-2"
                                            >
                                                Your PIN
                                            </label>
                                            <input
                                                id="pin"
                                                name="pin"
                                                type="text"
                                                inputMode="numeric"
                                                autoComplete="off"
                                                aria-invalid={errors.pin ? "true" : undefined}
                                                aria-describedby={errors.pin ? "pin-error" : undefined}
                                                className="w-full p-5 bg-surface-container-lowest border-4 border-outline rounded-2xl text-on-surface text-lg font-bold focus:border-accent outline-none transition-all placeholder:text-on-surface-variant/40 tracking-[0.3em]"
                                                placeholder="••••"
                                                value={data.pin}
                                                onChange={(e) => setData("pin", e.target.value)}
                                            />
                                            {errors.pin && (
                                                <p id="pin-error" aria-live="polite" className="text-error text-sm font-bold ml-2">
                                                    {errors.pin}
                                                </p>
                                            )}
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={processing}
                                        data-sfx="major"
                                        className={`w-full py-5 md:py-6 mt-2 rounded-2xl border-b-[6px] md:border-b-[8px] border-accent-deep font-black uppercase italic text-xl md:text-2xl tracking-tighter transition-all active:translate-y-1 active:border-b-[2px] flex items-center justify-center gap-3 bg-accent text-[#0c0c1f] hover:bg-accent-hover disabled:opacity-70 tactile-button ${focusRing}`}
                                    >
                                        <span className="material-symbols-outlined text-3xl" aria-hidden="true">
                                            play_arrow
                                        </span>
                                        <span>{processing ? "Starting..." : "PLAY"}</span>
                                    </button>
                                    <p className="text-center text-on-surface-variant text-sm font-bold">
                                        Ask your teacher for help!
                                    </p>
                                </form>
                            </div>
                        </div>
                    </div>

                    {/* Mobile-only demo (below login) */}
                    <div className="block lg:hidden mt-10">
                        <GameplayDemo />
                    </div>
                </div>
            </section>

            {/* FOOTER — minimal */}
            <footer className="fixed bottom-0 left-0 w-full z-40 border-t-2 border-outline/50 bg-background/60 backdrop-blur-sm py-3 px-4">
                <div className="max-w-6xl mx-auto flex items-center justify-between">
                    <span className="text-sm font-black text-primary/40 font-headline-xl uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </span>
                    <Link
                        href="/teacher/login"
                        className={`text-sm font-bold text-on-surface-variant/50 hover:text-accent transition-colors rounded ${focusRing}`}
                    >
                        Teacher Login
                    </Link>
                </div>
            </footer>
        </div>
    );
}
