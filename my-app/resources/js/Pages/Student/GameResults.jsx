import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";

export default function GameResults({ session, moduleTitle, totalItems }) {
    const accuracy = session.accuracy;
    const isPerfect = parseFloat(accuracy) >= 100;

    return (
        <DashboardLayout minimal={true}>
            <main class="relative px-margin py-12 flex flex-col items-center justify-center min-h-[calc(100vh-176px)]">
                {/* <!-- Success Header Section --> */}
                <div class="relative z-10 text-center mb-12">
                   
                    <h1 class="font-headline-xl text-secondary-container tracking-tighter drop-shadow-[4px_4px_0px_#3c0090] mb-2 uppercase">
                        🚀 MISSION COMPLETE!
                    </h1>
                    <p class="font-headline-md text-primary tracking-wide">
                        YOU'RE A LINGUISTIC LEGEND!
                    </p>
                </div>
                {/* <!-- Stats Grid (Bento Style) --> */}
                <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter w-full max-w-4xl z-10">
                    {/* <!-- Score Card --> */}
                    <div class="bg-surface-container p-card-padding border-4 border-primary-container rounded-xl neo-brutal-shadow-purple flex flex-col items-center text-center">
                        <span class="font-label-bold text-on-surface-variant mb-4">
                            🏆 TOTAL SCORE
                        </span>
                        <div class="relative w-40 h-40 flex items-center justify-center mb-4">
                            {/* <!-- Progress Ring Representation --> */}
                            <svg class="w-full h-full -rotate-90">
                                <circle
                                    class="text-surface-container-highest"
                                    cx="80"
                                    cy="80"
                                    fill="transparent"
                                    r="70"
                                    stroke="currentColor"
                                    stroke-width="12"
                                ></circle>
                                <circle
                                    class="text-secondary-container"
                                    cx="80"
                                    cy="80"
                                    fill="transparent"
                                    r="70"
                                    stroke="currentColor"
                                    stroke-dasharray="440"
                                    stroke-dashoffset="88"
                                    stroke-width="12"
                                ></circle>
                            </svg>
                            <div class="absolute flex flex-col">
                                <span class="font-headline-xl text-white">
                                    80
                                </span>
                                <span class="font-label-bold text-on-surface-variant">
                                    / 100
                                </span>
                            </div>
                        </div>
                        <div class="bg-primary-container px-4 py-2 rounded-full font-label-bold text-white uppercase tracking-widest">
                            LEVEL UP!
                        </div>
                    </div>
                    {/* <!-- Accuracy Card --> */}
                    <div class="bg-surface-container p-card-padding border-4 border-on-tertiary-fixed-variant rounded-xl neo-brutal-shadow-lime flex flex-col items-center text-center">
                        <span class="font-label-bold text-on-surface-variant mb-4">
                            🎯 ACCURACY RATE
                        </span>
                        <div class="flex-1 flex flex-col items-center justify-center">
                            <div class="text-[80px] font-black text-[#bcff00] leading-none mb-2 italic drop-shadow-[4px_4px_0px_#1a3300]">
                                80%
                            </div>
                            <div class="w-full h-4 bg-surface-container-highest rounded-full overflow-hidden border-2 border-black">
                                <div class="h-full bg-[#bcff00] w-[80%]"></div>
                            </div>
                        </div>
                        <div class="mt-6 flex items-center gap-2 text-tertiary">
                            <span
                                class="material-symbols-outlined"
                                data-icon="bolt"
                            >
                                bolt
                            </span>
                            <span class="font-label-bold">FAST REFLEXES!</span>
                        </div>
                    </div>
                </div>
                {/* <!-- Action Buttons --> */}
                <section class="w-full max-w-4xl mt-12 z-10">
                    <h2 class="font-headline-md text-primary tracking-wide mb-6 uppercase text-center">
                        ✨ COSMIC QUESTS IN PROGRESS
                    </h2>
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-gutter">
                        {/* <!-- Quest Card 1 --> */}
                        <div class="bg-surface-container p-4 border-4 border-primary-container rounded-xl neo-brutal-shadow-purple flex items-center gap-4">
                            <div class="bg-surface-container-highest p-3 rounded-lg opacity-50 grayscale">
                                <span
                                    class="material-symbols-outlined text-white text-2xl"
                                    data-icon="auto_stories"
                                >
                                    auto_stories
                                </span>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-end mb-2">
                                    <span class="font-label-bold text-white uppercase">
                                        Story Finisher
                                    </span>
                                    <span class="text-[10px] font-black text-on-surface-variant tracking-widest">
                                        2/3 STORIES
                                    </span>
                                </div>
                                <div class="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden border-2 border-black">
                                    <div class="h-full bg-secondary-container w-[66%]"></div>
                                </div>
                            </div>
                        </div>
                        {/* <!-- Quest Card 2 --> */}
                        <div class="bg-surface-container p-4 border-4 border-on-tertiary-fixed-variant rounded-xl neo-brutal-shadow-lime flex items-center gap-4">
                            <div class="bg-surface-container-highest p-3 rounded-lg opacity-50 grayscale">
                                <span
                                    class="material-symbols-outlined text-white text-2xl"
                                    data-icon="record_voice_over"
                                >
                                    record_voice_over
                                </span>
                            </div>
                            <div class="flex-1">
                                <div class="flex justify-between items-end mb-2">
                                    <span class="font-label-bold text-white uppercase">
                                        Clear Speaker
                                    </span>
                                    <span class="text-[10px] font-black text-on-surface-variant tracking-widest">
                                        75% / 100%
                                    </span>
                                </div>
                                <div class="w-full h-3 bg-surface-container-highest rounded-full overflow-hidden border-2 border-black">
                                    <div class="h-full bg-[#bcff00] w-[75%]"></div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>
                <div class="flex flex-col sm:flex-row gap-6 mt-12 w-full max-w-2xl z-10">
                    <button class="flex-1 bg-tertiary text-on-tertiary-fixed font-headline-md py-6 rounded-xl border-4 border-black neo-brutal-shadow-orange flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:bg-tertiary-fixed">
                        <span
                            class="material-symbols-outlined"
                            data-icon="refresh"
                        >
                            refresh
                        </span>
                        RETRY
                    </button>
                    <button class="flex-1 bg-primary-container text-white font-headline-md py-6 rounded-xl border-4 border-black neo-brutal-shadow-purple flex items-center justify-center gap-3 active:translate-x-1 active:translate-y-1 active:shadow-none transition-all hover:brightness-110">
                        <span
                            class="material-symbols-outlined"
                            data-icon="home"
                        >
                            home
                        </span>
                        BACK TO MENU
                    </button>
                </div>
             
            </main>
        </DashboardLayout>
    );
}
