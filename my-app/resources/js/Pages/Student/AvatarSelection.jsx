import { usePage, router } from "@inertiajs/react";

const AVATARS = [
    {
        id: "juan",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuDh3THY0ENh1yT1jUzhuZDc14omwHj8ER7vWjLs4Bl5Nj644mmO4vi-2ODFSRI46jpcIw9dy9Knt7TmQtiwQpJmpiLPm9g5osM_-F3hmiWuKL3NxlLO-wElY4dZwZStxx4wU0q2twHAM-EkSf1NF2kCSydiD5s_eRv9dN1982mhKmHkh4x0EoJ-O2fzcpLLq4eBcWSFNCCuuyDYCTWx71V1u1LpFvLJVaAyY3FwcSDCm1UIPlVIZ2xKYQc6EgP5XqPUFFQM8S0DEaMS",
        alt: "Champion Juan robot avatar",
    },
    {
        id: "kyle",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAZNRCXCWU-BKlVH7Tgjxe7xWN1p6pdj6eq3gz5rq-xI-2zQtACXCDeLj1MX3dC8GVlJGsSsf2H6m0_htaEoAIVF3oC0OlFHZxoFCqlFioOp6aQajnIA0KkmsyLk3JpCSgFh53VTnpCjyn11S6nnbNSBxxilr6_7968RO1lFuzDB7DsetTOJ3-VH1ol8dN4n2eB0-mxhQpnzlRaJel8fWfnSd0suz7bV3Vbkfwpm5zGGiPJmdLjZACSQBTO2ucnqjE4W19s9itJFk2T",
        alt: "Stellar Kyle robot avatar",
    },
    {
        id: "ana",
        url: "https://lh3.googleusercontent.com/aida-public/AB6AXuAlWe1RjnS_bYDv5BXC3hiaQsT2yvCP5w5e6Xqda_NyeCU41QiHJAL1xyI3348I16uTRJSw2Q04uR9tT0qNv39_Ohlqm3eKmnPv9RU_5bm9YqUDziHRlLt7-PEKzQ3nhYVRP2h0DqFC_5tLbPald-wRBwprxfR5FO1IiNieZqJ_wp21PgGXds-XIiduHNziBjxbyxwgkn9AuG8M-XDzLYUxhs_Z4nNcfiv27PswYtG0eJCeKxrFMxfx1adVVCws01UJB1Ljsbtt095C",
        alt: "Genius Ana robot avatar",
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

export default function AvatarSelection() {
    const handleAvatarSelect = (avatar) => {
        router.post(
            route("student.updateAvatar"),
            { avatar_url: avatar.url },
            {
                onError: (errors) => {
                    console.error("Failed to update avatar:", errors);
                },
            },
        );
    };

    return (
        <div className="fixed inset-0 z-[90] bg-zinc-950 flex flex-col items-center justify-center p-6">
            <div className="max-w-2xl w-full text-center">
                <h2 className="text-white text-4xl md:text-6xl font-black uppercase italic tracking-tight mb-12">
                    SELECT YOUR <span className="text-purple-500">HERO</span>
                </h2>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-8 max-w-lg mx-auto">
                    {AVATARS.map((avatar) => (
                        <button
                            key={avatar.id}
                            onClick={() => handleAvatarSelect(avatar)}
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
    );
}
