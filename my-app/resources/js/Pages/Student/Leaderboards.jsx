import DashboardLayout from "../../Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";
export default function Leaderboards() {
    return (
        <>
            <DashboardLayout>
                <div className="max-w-full mx-auto px-margin mt-12 flex flex-col items-center">
                    {/* <!-- Hero Title Section --> */}
                    <div className="relative mb-16 text-center">
                       {/* make it big text */}
                        <h1 className="font-headline-xl text-5xl md:text-7xl leading-none uppercase italic text-white">
                            LEADERBOARDS
                        </h1>
                      
                    </div>
                    {/* <!-- Podium / Top 3 Visual --> */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-gutter items-end w-full mb-12">
                        {/* <!-- Rank 2 --> */}
                        <div className="order-2 md:order-1 flex flex-col items-center group">
                            <div className="w-24 h-24 rounded-full border-4 border-outline p-1 mb-4 relative overflow-hidden bg-surface-container">
                                <img
                                    alt="Avatar"
                                    className="w-full h-full object-cover rounded-full"
                                    data-alt="A futuristic cartoon robot avatar for a child named Kyle, featuring a sleek blue and silver metallic body, bright yellow digital eyes, and a friendly mechanical expression. The robot is set against a cosmic backdrop with soft starlight, maintaining a clean Neo-Brutalist digital art style with high contrast."
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAZNRCXCWU-BKlVH7Tgjxe7xWN1p6pdj6eq3gz5rq-xI-2zQtACXCDeLj1MX3dC8GVlJGsSsf2H6m0_htaEoAIVF3oC0OlFHZxoFCqlFioOp6aQajnIA0KkmsyLk3JpCSgFh53VTnpCjyn11S6nnbNSBxxilr6_7968RO1lFuzDB7DsetTOJ3-VH1ol8dN4n2eB0-mxhQpnzlRaJel8fWfnSd0suz7bV3Vbkfwpm5zGGiPJmdLjZACSQBTO2ucnqjE4W19s9itJFk2T"
                                />
                            </div>
                            <div className="bg-surface-container border-4 border-outline w-full pt-8 pb-6 px-4 rounded-t-3xl text-center relative neo-brutalist-shadow-purple">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-outline text-surface w-12 h-12 flex items-center justify-center rounded-full font-headline-md border-4 border-surface">
                                    2
                                </div>
                                <p className="font-headline-md text-headline-md text-white">
                                    Kyle
                                </p>
                                <p className="font-label-bold text-secondary text-label-bold">
                                    120 PTS
                                </p>
                            </div>
                        </div>
                        {/* <!-- Rank 1: Juan --> */}
                        <div className="order-1 md:order-2 flex flex-col items-center scale-110 z-10">
                            <div className="relative mb-4 group">
                                
                                <div className="w-32 h-32 rounded-full border-8 border-secondary-container p-1 relative overflow-hidden bg-primary-container shadow-[0_0_30px_rgba(255,59,192,0.4)]">
                                    <img
                                        alt="Avatar"
                                        className="w-full h-full object-cover rounded-full"
                                        data-alt="A vibrant, heroic robot avatar for a champion named Juan, sporting a bright pink and purple armored shell with glowing golden sensors. The robot has a triumphant, smiling digital face and is positioned against a dramatic space nebula background with swirling oranges and purples, rendered in a high-energy 3D arcade game aesthetic."
                                        src="https://lh3.googleusercontent.com/aida-public/AB6AXuDh3THY0ENh1yT1jUzhuZDc14omwHj8ER7vWjLs4Bl5Nj644mmO4vi-2ODFSRI46jpcIw9dy9Knt7TmQtiwQpJmpiLPm9g5osM_-F3hmiWuKL3NxlLO-wElY4dZwZStxx4wU0q2twHAM-EkSf1NF2kCSydiD5s_eRv9dN1982mhKmHkh4x0EoJ-O2fzcpLLq4eBcWSFNCCuuyDYCTWx71V1u1LpFvLJVaAyY3FwcSDCm1UIPlVIZ2xKYQc6EgP5XqPUFFQM8S0DEaMS"
                                    />
                                </div>
                            </div>
                            <div className="bg-primary-container border-4 border-secondary-container w-full pt-10 pb-8 px-4 rounded-t-3xl text-center relative shadow-[0px_8px_0px_0px_#55003d]">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-secondary-container text-white w-14 h-14 flex items-center justify-center rounded-full font-headline-md border-4 border-primary-container">
                                    1
                                </div>
                                <p className="font-headline-lg text-headline-lg text-white uppercase tracking-tight">
                                    Juan
                                </p>
                                <p className="font-label-bold text-lime-300 text-headline-md">
                                    150 PTS
                                </p>
                            </div>
                        </div>
                        {/* <!-- Rank 3 --> */}
                        <div className="order-3 md:order-3 flex flex-col items-center">
                            <div className="w-24 h-24 rounded-full border-4 border-tertiary p-1 mb-4 relative overflow-hidden bg-surface-container">
                                <img
                                    alt="Avatar"
                                    className="w-full h-full object-cover rounded-full"
                                    data-alt="A cute and intelligent robot character named Ana, designed with soft teal and white plating and large, expressive green eyes. The robot is surrounded by floating holographic alphabet letters in a deep space setting. The visual style is polished, colorful, and tactile, characteristic of premium elementary education software."
                                    src="https://lh3.googleusercontent.com/aida-public/AB6AXuAlWe1RjnS_bYDv5BXC3hiaQsT2yvCP5w5e6Xqda_NyeCU41QiHJAL1xyI3348I16uTRJSw2Q04uR9tT0qNv39_Ohlqm3eKmnPv9RU_5bm9YqUDziHRlLt7-PEKzQ3nhYVRP2h0DqFC_5tLbPald-wRBwprxfR5FO1IiNieZqJ_wp21PgGXds-XIiduHNziBjxbyxwgkn9AuG8M-XDzLYUxhs_Z4nNcfiv27PswYtG0eJCeKxrFMxfx1adVVCws01UJB1Ljsbtt095C"
                                />
                            </div>
                            <div className="bg-surface-container border-4 border-tertiary w-full pt-8 pb-6 px-4 rounded-t-3xl text-center relative neo-brutalist-shadow-purple">
                                <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-tertiary text-surface w-12 h-12 flex items-center justify-center rounded-full font-headline-md border-4 border-surface">
                                    3
                                </div>
                                <p className="font-headline-md text-headline-md text-white">
                                    Ana
                                </p>
                                <p className="font-label-bold text-tertiary text-label-bold">
                                    100 PTS
                                </p>
                            </div>
                        </div>
                    </div>
                    {/* <!-- Leaderboard Table --> */}
                    <div className="w-full bg-surface-container border-4 border-surface-variant rounded-2xl p-4 md:p-8 neo-brutalist-shadow mb-12 backdrop-blur-md bg-opacity-80">
                        <div className="flex items-center justify-between mb-6 border-b-4 border-surface-variant pb-4">
                            <h3 className="font-headline-md text-headline-md text-white flex items-center gap-2">
                                <span
                                    className="material-symbols-outlined text-secondary"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    leaderboard
                                </span>
                                GALAXY RANKINGS
                            </h3>
                            <span className="text-on-surface-variant font-label-bold text-xs">
                                TOP 100 PILOTS
                            </span>
                        </div>
                        <div className="space-y-4">
                            {/* <!-- Rank 4 --> */}
                            <div className="flex items-center justify-between p-4 bg-surface-dim border-2 border-surface-variant rounded-xl hover:translate-x-2 transition-transform duration-200">
                                <div className="flex items-center gap-6">
                                    <span className="font-headline-md text-outline w-10 text-center">
                                        4
                                    </span>
                                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest border-2 border-outline-variant overflow-hidden">
                                        <img
                                            alt="Leo"
                                            className="w-full h-full object-cover"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBvWNTnJKPz_x6Y6lwlut0m6OV34k6Ad6idy6xF9MuNrA4nsq5xgG9KDhgndUTCgeZcaXCYH1kNYwBwQe9AJNeC9epjFdxItV7GhJeekPEUdP9EWpncXyQGXnXYEcOOmVNgvZ6xkr4lMeUGj7pAMwtMkLg9At6mQUgF-5wZJUs9_ruvCz_DdgkjnXz7kZN3QH_Oc5cVyRIVjJSBmJH0hqW0nakeG5opIFmryh8BrLChKC81cU4H8ko20W-6Z4HZ4G0tLZFW_8rEIzYX"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-body-lg text-body-lg text-white">
                                            Leo
                                        </p>
                                        <p className="text-sm text-outline uppercase font-label-bold">
                                            Stellar Scout
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-headline-md text-white text-lg">
                                            92
                                        </p>
                                        <p className="text-xs text-outline uppercase font-label-bold">
                                            Points
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline">
                                        chevron_right
                                    </span>
                                </div>
                            </div>
                            {/* <!-- Rank 5 --> */}
                            <div className="flex items-center justify-between p-4 bg-surface-dim border-2 border-surface-variant rounded-xl hover:translate-x-2 transition-transform duration-200">
                                <div className="flex items-center gap-6">
                                    <span className="font-headline-md text-outline w-10 text-center">
                                        5
                                    </span>
                                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest border-2 border-outline-variant overflow-hidden">
                                        <img
                                            alt="Zoe"
                                            className="w-full h-full object-cover"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuBqGrYBtsNBrPy3RRPxbHxWzNfnlJyX1PSSkunhyMWHSQpB_6I1uDRy72V9O_yv37Abj43WPK_vG7E7SI2HuqVn4iSb-qgvEbfiVbEVCUSNVbc3B18OC58-Eb_-pD6X3yTfspzM0rzVMlf7CrNgb7jLXANV8Jz14LNVnnWkXbkbBcCRXX7KQe_-FCwoILoUZjzAGiWm69Ak6wnxaVpKJUpslUIwE8Uj_DWs8fGv4tYeafdPsah0tCtRa54J6UMw5_FL7C4xoOXoEYpF"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-body-lg text-body-lg text-white">
                                            Zoe
                                        </p>
                                        <p className="text-sm text-outline uppercase font-label-bold">
                                            Nova Navigator
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-headline-md text-white text-lg">
                                            88
                                        </p>
                                        <p className="text-xs text-outline uppercase font-label-bold">
                                            Points
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline">
                                        chevron_right
                                    </span>
                                </div>
                            </div>
                            {/* <!-- Rank 6 --> */}
                            <div className="flex items-center justify-between p-4 bg-surface-dim border-2 border-surface-variant rounded-xl hover:translate-x-2 transition-transform duration-200">
                                <div className="flex items-center gap-6">
                                    <span className="font-headline-md text-outline w-10 text-center">
                                        6
                                    </span>
                                    <div className="w-12 h-12 rounded-lg bg-surface-container-highest border-2 border-outline-variant overflow-hidden">
                                        <img
                                            alt="Sam"
                                            className="w-full h-full object-cover"
                                            src="https://lh3.googleusercontent.com/aida-public/AB6AXuCGBS5xKJoo6ae6nUsMvlYD0l0SmoGlhvLnkDZRwlCoTNJLgLQbKWxfgD1If2SyFBi_hKvKXjuPjfNTl7ewuRLvP2pTtDthCFlX6F143g11NE_d1iUZX3f7iKviU5NVobfa0LA0HQ8sgfJyVyeFC3vJc1Ddphgsh2WUc8mjfMH0xX2kf6_sWEgPGQo-tRuAbD3NY_nXzEGNuRbmGalQhFR25Rbhhqx-ok6Yp_EAZow8nwxa4NiwfmFc6X0cFVT4PEVQe0WbS2tMiVtb"
                                        />
                                    </div>
                                    <div>
                                        <p className="font-body-lg text-body-lg text-white">
                                            Sam
                                        </p>
                                        <p className="text-sm text-outline uppercase font-label-bold">
                                            Comet Cadet
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="text-right">
                                        <p className="font-headline-md text-white text-lg">
                                            75
                                        </p>
                                        <p className="text-xs text-outline uppercase font-label-bold">
                                            Points
                                        </p>
                                    </div>
                                    <span className="material-symbols-outlined text-outline">
                                        chevron_right
                                    </span>
                                </div>
                            </div>
                        </div>
                        {/* <!-- View All Footer --> */}
                        <button className="w-full mt-8 py-3 bg-surface-container-high border-2 border-dashed border-outline-variant rounded-xl text-on-surface-variant font-label-bold hover:bg-surface-variant transition-colors">
                            LOAD MORE EXPLORERS...
                        </button>
                    </div>
                    {/* <!-- Call to Action Button --> */}
                    <div className="w-full flex justify-center mb-16">
                        <Link href="/student/dashboard" className="group relative px-12 py-6 bg-lime-400 border-4 border-[#3c6e00] rounded-2xl font-headline-md text-headline-md text-[#0c2200] neo-brutalist-shadow-lime active-press-lime transition-all duration-75 uppercase italic flex items-center gap-4">
                            <span
                                className="material-symbols-outlined text-3xl font-bold"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                rocket_launch
                            </span>
                            Back to Home
                            <span className="material-symbols-outlined text-3xl group-hover:translate-x-2 transition-transform">
                                arrow_forward
                            </span>
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
