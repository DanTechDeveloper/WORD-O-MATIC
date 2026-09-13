import { Head, useForm } from "@inertiajs/react";

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

            {/* HERO = FULL-SCREEN LOGIN — distill: solid indigo void, subtle scanlines only, no dotgrid/orb/shape drift per DESIGN.md §6 */}
            <section className="relative min-h-screen flex items-center justify-center pt-14 pb-20 px-4">
                <div className="absolute inset-0 pointer-events-none z-0" aria-hidden="true">
                    <style>
                        {`
                            .home-scanlines {
                                background: repeating-linear-gradient(
                                    0deg,
                                    transparent,
                                    transparent 3px,
                                    rgba(0,0,0,0.04) 3px,
                                    rgba(0,0,0,0.04) 4px
                                );
                            }
                            @media (prefers-reduced-motion: reduce) {
                                .home-scanlines { opacity: 0.6 !important; }
                            }
                        `}
                    </style>
                    <div className="home-scanlines absolute inset-0 opacity-40" />
                </div>
                <div
                    className="absolute inset-0 z-[1] pointer-events-none"
                    style={{
                        background: "radial-gradient(circle at center, rgba(12,12,31,0.4) 0%, transparent 65%)",
                    }}
                />

                {/* Content — centered login */}
                <div className="relative z-10 w-full max-w-lg mx-auto text-center">
                    {/* Title */}
                    <h1
                        className="font-black uppercase italic tracking-tighter leading-[0.9]"
                        style={{
                            fontSize: "clamp(2.5rem, 8vw, 3rem)",
                            color: "#d1bcff",
                            textShadow: "0 0 20px rgba(209,188,255,0.3)",
                        }}
                    >
                        WORD-O-MATIC
                    </h1>
                    <p className="text-on-surface-variant text-lg md:text-xl font-bold mb-8">
                        Learn Through Play
                    </p>

                    {/* Login card — centered */}
                    <div className="w-full">
                            <div className="relative bg-surface-container-high border-4 border-primary-container tactile-card rounded-2xl p-4 sm:p-6 md:p-10">
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
            </section>

            {/* FOOTER — minimal, opaque per DESIGN.md §6 no liquid glass */}
            {/* ponytail: teacher link removed — obscure via direct URL, security is role middleware not obscurity */}
            <footer className="fixed bottom-0 left-0 w-full z-40 border-t-2 border-outline/30 bg-background py-3 px-4">
                <div className="max-w-6xl mx-auto flex items-center justify-center">
                    <span className="text-sm font-black text-primary/40 font-headline-xl uppercase italic tracking-tighter">
                        WORD-O-MATIC
                    </span>
                </div>
            </footer>
        </div>
    );
}
