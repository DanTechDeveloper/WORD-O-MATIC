import { Link, usePage, router } from "@inertiajs/react";
import { useState, useEffect } from "react";

const AVATARS = [
    {
        id: "juan",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh3THY0ENh1yT1jUzhuZDc14omwHj8ER7vWjLs4Bl5Nj644mmO4vi-2ODFSRI46jpcIw9dy9Knt7TmQtiwQpJmpiLPm9g5osM_-F3hmiWuKL3NxlLO-wElY4dZwZStxx4wU0q2twHAM-EkSf1NF2kCSydiD5s_eRv9dN1982mhKmHkh4x0EoJ-O2fzcpLLq4eBcWSFNCCuuyDYCTWx71V1u1LpFvLJVaAyY3FwcSDCm1UIPlVIZ2xKYQc6EgP5XqPUFFQM8S0DEaMS",
        alt: "A vibrant, heroic robot avatar for a champion named Juan, sporting a bright pink and purple armored shell with glowing golden sensors. The robot has a triumphant, smiling digital face and is positioned against a dramatic space nebula background with swirling oranges and purples, rendered in a high-energy 3D arcade game aesthetic.",
    },
    {
        id: "kyle",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZNRCXCWU-BKlVH7Tgjxe7xWN1p6pdj6eq3gz5rq-xI-2zQtACXCDeLj1MX3dC8GVlJGsSsf2H6m0_htaEoAIVF3oC0OlFHZxoFCqlFioOp6aQajnIA0KkmsyLk3JpCSgFh53VTnpCjyn11S6nnbNSBxxilr6_7968RO1lFuzDB7DsetTOJ3-VH1ol8dN4n2eB0-mxhQpnzlRaJel8fWfnSd0suz7bV3Vbkfwpm5zGGiPJmdLjZACSQBTO2ucnqjE4W19s9itJFk2T",
        alt: "A futuristic cartoon robot avatar for a child named Kyle, featuring a sleek blue and silver metallic body, bright yellow digital eyes, and a friendly mechanical expression. The robot is set against a cosmic backdrop with soft starlight, maintaining a clean Neo-Brutalist digital art style with high contrast.",
    },
    {
        id: "ana",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlWe1RjnS_bYDv5BXC3hiaQsT2yvCP5w5e6Xqda_NyeCU41QiHJAL1xyI3348I16uTRJSw2Q04uR9tT0qNv39_Ohlqm3eKmnPv9RU_5bm9YqUDziHRlLt7-PEKzQ3nhYVRP2h0DqFC_5tLbPald-wRBwprxfR5FO1IiNieZqJ_wp21PgGXds-XIiduHNziBjxbyxwgkn9AuG8M-XDzLYUxhs_Z4nNcfiv27PswYtG0eJCeKxrFMxfx1adVVCws01UJB1Ljsbtt095C",
        alt: "A cute and intelligent robot character named Ana, designed with soft teal and white plating and large, expressive green eyes. The robot is surrounded by floating holographic alphabet letters in a deep space setting. The visual style is polished, colorful, and tactile, characteristic of premium elementary education software.",
    },
    {
        id: "leo",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBvWNTnJKPz_x6Y6lwlut0m6OV34k6Ad6idy6xF9MuNrA4nsq5xgG9KDhgndUTCgeZcaXCYH1kNYwBwQe9AJNeC9epjFdxItV7GhJeekPEUdP9EWpncXyQGXnXYEcOOmVNgvZ6xkr4lMeUGj7pAMwtMkLg9At6mQUgF-5wZJUs9_ruvCz_DdgkjnXz7kZN3QH_Oc5cVyRIVjJSBmJH0hqW0nakeG5opIFmryh8BrLChKC81cU4H8ko20W-6Z4HZ4G0tLZFW_8rEIzYX",
        alt: "Stellar Scout Leo robot avatar.",
    },
    {
        id: "zoe",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuBqGrYBtsNBrPy3RRPxbHxWzNfnlJyX1PSSkunhyMWHSQpB_6I1uDRy72V9O_yv37Abj43WPK_vG7E7SI2HuqVn4iSb-qgvEbfiVbEVCUSNVbc3B18OC58-Eb_-pD6X3yTfspzM0rzVMlf7CrNgb7jLXANV8Jz14LNVnnWkXbkbBcCRXX7KQe_-FCwoILoUZjzAGiWm69Ak6wnxaVpKJUpslUIwE8Uj_DWs8fGv4tYeafdPsah0tCtRa54J6UMw5_FL7C4xoOXoEYpF",
        alt: "Nova Navigator Zoe robot avatar.",
    },
    {
        id: "sam",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuCGBS5xKJoo6ae6nUsMvlYD0l0SmoGlhvLnkDZRwlCoTNJLgLQbKWxfgD1If2SyFBi_hKvKXjuPjfNTl7ewuRLvP2pTtDthCFlX6F143g11NE_d1iUZX3f7iKviU5NVobfa0LA0HQ8sgfJyVyeFC3vJc1Ddphgsh2WUc8mjfMH0xX2kf6_sWEgPGQo-tRuAbD3NY_nXzEGNuRbmGalQhFR25Rbhhqx-ok6Yp_EAZow8nwxa4NiwfmFc6X0cFVT4PEVQe0WbS2tMiVtb",
        alt: "Comet Cadet Sam robot avatar.",
    },
];

export default function Greetings() {
    const { auth } = usePage().props;
    const name = auth?.user?.name || "STUDENT";

    const [phase, setPhase] = useState("splash"); // splash, avatar, ready
    const [selectedAvatar, setSelectedAvatar] = useState(AVATARS[0]);

    useEffect(() => {
        if (phase === "splash") {
            const timer = setTimeout(() => {
                setPhase("avatar");
            }, 2500);
            return () => clearTimeout(timer);
        }
    }, [phase]);

    const handleAvatarSelect = (avatar) => {
        setSelectedAvatar(avatar);
        // Placeholder for backend persistence
        /*
        router.post('/student/profile/avatar', { avatar }, {
            preserveScroll: true,
            onSuccess: () => setPhase("ready")
        });
        */
        setPhase("ready");
    };

    return (
        <div className="m-0 p-0 overflow-hidden">
            <style>
                {`
                    @keyframes scan {
                        0% { top: -10%; }
                        100% { top: 110%; }
                    }
                    @keyframes flicker {
                        0% { opacity: 1; }
                        50% { opacity: 0.8; }
                        100% { opacity: 1; }
                    }
                    .animate-scan {
                        animation: scan 3s linear infinite;
                    }
                    .animate-flicker {
                        animation: flicker 0.1s infinite;
                    }
                `}
            </style>

            {/* <!-- BEGIN: Main Background Container --> */}
            <main className="min-h-screen w-full flex flex-col items-center justify-center relative overflow-hidden bg-zinc-950">
                {/* <!-- Phase 1: Splash Screen Overlay --> */}
                {phase === "splash" && (
                    <div className="fixed inset-0 z-[100] bg-zinc-950 flex flex-col items-center justify-center">
                        <div className="absolute inset-0 pointer-events-none overflow-hidden">
                            <div className="w-full h-1 bg-lime-400/20 absolute animate-scan shadow-[0_0_15px_rgba(163,230,53,0.5)]"></div>
                        </div>
                        <div className="text-center animate-flicker">
                            <h2 className="text-lime-400 text-6xl md:text-8xl font-black italic tracking-tighter mb-4">
                                WORD-O-MATIC
                            </h2>
                            <p className="text-white font-mono tracking-[0.5em] text-sm md:text-lg uppercase opacity-70">
                                System Booting...
                            </p>
                        </div>
                    </div>
                )}

                {/* <!-- BEGIN: Decorative Floating Elements --> */}
                {/* <!-- Top Left Robot --> */}
                <div
                    className="absolute top-10 left-10 text-6xl floating-emoji"
                    style={{ animationDelay: "0s" }}
                >
                    🤖
                </div>
                {/* <!-- Top Right Stars --> */}
                <div
                    className="absolute top-20 right-20 text-5xl floating-emoji"
                    style={{ animationDelay: "1s" }}
                >
                    🌟
                </div>
                {/* <!-- Bottom Left Rocket --> */}
                <div
                    className="absolute bottom-20 left-20 text-7xl floating-emoji"
                    style={{ animationDelay: "2s" }}
                >
                    🚀
                </div>
                {/* <!-- Bottom Right Party Popper --> */}
                <div
                    className="absolute bottom-10 right-10 text-6xl floating-emoji"
                    style={{ animationDelay: "0.5s" }}
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

                {/* <!-- Phase 2: Avatar Selection Overlay --> */}
                {phase === "avatar" && (
                    <div className="fixed inset-0 z-[90] bg-zinc-950/90 backdrop-blur-xl flex flex-col items-center justify-center p-6">
                        <div className="max-w-2xl w-full text-center">
                            <h2 className="text-white text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-12">
                                SELECT YOUR{" "}
                                <span className="text-purple-500">HERO</span>
                            </h2>
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
                                {AVATARS.map((avatar) => (
                                    <button
                                        key={avatar.id}
                                        onClick={() =>
                                            handleAvatarSelect(avatar)
                                        }
                                        className="aspect-square rounded-3xl bg-zinc-900 border-4 border-zinc-800 hover:border-lime-400 hover:bg-zinc-800 transition-all hover:scale-110 active:scale-95 overflow-hidden p-2"
                                    >
                                        <img
                                            src={avatar.url}
                                            alt={avatar.alt}
                                            className="w-full h-full object-cover rounded-2xl"
                                        />
                                    </button>
                                ))}
                            </div>
                            <p className="mt-12 text-zinc-500 font-bold uppercase tracking-widest animate-pulse">
                                Tap to choose your avatar
                            </p>
                        </div>
                    </div>
                )}

                {/* <!-- BEGIN: Central Content Card --> */}
                <section
                    className={`bg-zinc-900 border-4 border-purple-900 tactile-card rounded-[40px] p-12 md:p-20 relative overflow-hidden flex flex-col items-center text-center max-w-4xl mx-4 z-10 w-full md:w-[90%] transition-opacity duration-1000 ${phase === "ready" ? "opacity-100" : "opacity-0"}`}
                    data-purpose="greeting-card"
                >
                    {/* <!-- Top Icon/Speech Bubble Style Decor --> */}
                    <div className="mb-6 animate-bounce-slow">
                        <img
                            src={selectedAvatar.url}
                            alt={selectedAvatar.alt}
                            className="w-32 h-32 md:w-40 md:h-40 object-cover rounded-full border-4 border-lime-400 shadow-[0_0_20px_rgba(163,230,53,0.4)]"
                        />
                    </div>
                    {/* <!-- Main Headline --> */}
                    <h1 className="flex flex-col gap-2 mb-8 select-none max-w-full">
                        <span className="text-white text-4xl md:text-5xl font-black italic uppercase tracking-tight">
                            WELCOME,
                        </span>
                        <span className="text-lime-400 text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tight break-words px-4">
                            {name.toUpperCase()}!
                        </span>
                    </h1>

                    {/* <!-- BEGIN: Call to Action --> */}
                    <div className="w-full flex justify-center">
                        <Link
                            href="/student/tutorial"
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
        </div>
    );
}
