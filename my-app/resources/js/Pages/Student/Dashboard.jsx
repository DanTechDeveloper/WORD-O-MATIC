import { Link } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Student/DashboardLayout";
export default function Dashboard() {
    return (
        <>
            <DashboardLayout>
                <section class="mb-12">
                    <div class="bg-surface-container rounded-3xl p-8 border-4 border-primary-container neo-3d-shadow flex flex-col md:flex-row items-center justify-between gap-8 overflow-hidden relative">
                        <div class="absolute -right-10 -top-10 w-40 h-40 bg-secondary-container/10 rounded-full blur-3xl"></div>
                        <div class="relative z-10 flex-1">
                            <h2 class="text-headline-xl font-headline-xl text-primary mb-4 italic">
                                READY FOR BLAST OFF?
                            </h2>
                            <p class="text-body-lg font-body-lg text-on-surface-variant mb-6 max-w-md">
                                You're making cosmic progress! Jump back into
                                your last session and reach for the stars.
                            </p>
                            <button class="bg-lime-400 text-slate-950 px-10 py-5 rounded-2xl font-black text-headline-md uppercase border-b-[8px] border-lime-700 primary-active-3d transition-all flex items-center gap-3">
                                Continue: Speak Level 2
                                <span class="material-symbols-outlined text-3xl">
                                    arrow_forward
                                </span>
                            </button>
                        </div>
                        <div class="w-full md:w-1/3 aspect-square bg-slate-900/50 rounded-2xl border-2 border-dashed border-primary-container flex items-center justify-center">
                            <img
                                alt="Space Robot"
                                class="w-4/5 h-4/5 object-contain"
                                data-alt="A cute, chunky 3D robot character wearing a galactic explorer suit, floating in a vibrant purple and blue space nebula. The robot is designed with rounded, tactile shapes and high-contrast lime green highlights. The style is neo-brutalist and playful, with sharp directional lighting creating deep, defined shadows. The character looks encouragingly at the viewer, holding a floating digital word bubble."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuBV2holqsnD129m3TMxChpoOltZl2WKS74mx-Y9BjOc0KyZ6tm13wDkqMcEu78NUVht77qV72xz4uK45ZzW28r5y17wmQbSmaUUfYNEeRprCZYPgBmrLlbWDK4f6neKQYvSP1nOHZ5m90QnZZ_oukXlIGBgh2IMTuA2Mk8mGZgOH3rAdvrqNndJX0YrYPtJog1RrrFjwbVrOvyO2VFQT4zDzFFTA92-M_AvrtkW-158VJJetx6zUY-hZQdXrHfTXhRmOjZBRTZ-gfMK"
                            />
                        </div>
                    </div>
                </section>
                {/* <!-- Mode Selection --> */}
                <section class="grid grid-cols-1 md:grid-cols-2 gap-gutter mb-12">
                    <button class="group bg-surface-container-high border-4 border-secondary-container rounded-3xl p-8 neo-3d-shadow active-3d transition-all text-left flex items-center gap-6">
                        <div class="bg-secondary-container text-on-secondary-container w-20 h-20 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(85,0,61,1)]">
                            <span
                                class="material-symbols-outlined text-5xl"
                                style="font-variation-settings: 'FILL' 1;"
                            >
                                menu_book
                            </span>
                        </div>
                        <div>
                            <h3 class="text-headline-lg font-headline-lg text-secondary mb-1">
                                Read Mode
                            </h3>
                            <p class="text-on-surface-variant font-body-md">
                                Explore new galaxies of stories.
                            </p>
                        </div>
                    </button>
                    <button class="group bg-surface-container-high border-4 border-lime-400 rounded-3xl p-8 neo-3d-shadow active-3d transition-all text-left flex items-center gap-6">
                        <div class="bg-lime-400 text-slate-950 w-20 h-20 rounded-2xl flex items-center justify-center shadow-[4px_4px_0px_0px_rgba(26,46,5,1)]">
                            <span
                                class="material-symbols-outlined text-5xl"
                                style="font-variation-settings: 'FILL' 1;"
                            >
                                record_voice_over
                            </span>
                        </div>
                        <div>
                            <h3 class="text-headline-lg font-headline-lg text-lime-400 mb-1">
                                Speak Mode
                            </h3>
                            <p class="text-on-surface-variant font-body-md">
                                Command the cosmic communications.
                            </p>
                        </div>
                    </button>
                </section>
                {/* <!-- Progress & Achievements Bento Grid --> */}
                <div class="grid grid-cols-1 lg:grid-cols-3 gap-gutter">
                    {/* <!-- Progress Section --> */}
                    <section class="lg:col-span-2 bg-surface-container rounded-3xl border-4 border-surface-variant p-card-padding neo-3d-shadow">
                        <div class="flex justify-between items-center mb-8">
                            <h3 class="text-headline-md font-headline-md text-on-surface flex items-center gap-2">
                                <span class="material-symbols-outlined text-primary-fixed-dim">
                                    analytics
                                </span>
                                Mission Progress
                            </h3>
                        </div>
                        <div class="space-y-10">
                            {/* <!-- Progress Item 1 --> */}
                            <div>
                                <div class="flex justify-between items-end mb-4">
                                    <div>
                                        <span class="text-label-bold font-label-bold text-secondary-container uppercase">
                                            Current Mission
                                        </span>
                                        <h4 class="text-headline-md font-headline-md">
                                            Read Level 3
                                        </h4>
                                    </div>
                                    <span class="text-headline-md font-headline-md text-lime-400">
                                        70%
                                    </span>
                                </div>
                                <div class="h-6 w-full bg-slate-950 rounded-full border-2 border-surface-variant relative overflow-hidden">
                                    <div
                                        class="absolute top-0 left-0 h-full bg-secondary-container rounded-full"
                                        style="width: 70%"
                                    ></div>
                                    {/* <!-- Progress Bot --> */}
                                    <div
                                        class="absolute top-1/2 -translate-y-1/2 ml-[-12px] flex items-center justify-center"
                                        style="left: 70%"
                                    >
                                        <span class="material-symbols-outlined text-lime-400 text-3xl animate-pulse">
                                            rocket
                                        </span>
                                    </div>
                                </div>
                            </div>
                            {/* <!-- Progress Item 2 --> */}
                            <div>
                                <div class="flex justify-between items-end mb-4">
                                    <div>
                                        <span class="text-label-bold font-label-bold text-primary uppercase">
                                            Training Module
                                        </span>
                                        <h4 class="text-headline-md font-headline-md">
                                            Speak Level 2
                                        </h4>
                                    </div>
                                    <span class="text-headline-md font-headline-md text-lime-400">
                                        50%
                                    </span>
                                </div>
                                <div class="h-6 w-full bg-slate-950 rounded-full border-2 border-surface-variant relative overflow-hidden">
                                    <div
                                        class="absolute top-0 left-0 h-full bg-primary-container rounded-full"
                                        style="width: 50%"
                                    ></div>
                                    {/* <!-- Progress Bot --> */}
                                    <div
                                        class="absolute top-1/2 -translate-y-1/2 ml-[-12px] flex items-center justify-center"
                                        style="left: 50%"
                                    >
                                        <span class="material-symbols-outlined text-secondary-container text-3xl animate-pulse">
                                            smart_toy
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </section>
                    {/* <!-- Achievements Section --> */}
                    <section class="bg-surface-container rounded-3xl border-4 border-surface-variant p-card-padding neo-3d-shadow flex flex-col">
                        <h3 class="text-headline-md font-headline-md text-on-surface mb-8 flex items-center gap-2">
                            <span class="material-symbols-outlined text-tertiary">
                                workspace_premium
                            </span>
                            Badges
                        </h3>
                        <div class="grid grid-cols-2 gap-4 flex-grow">
                            <div class="bg-slate-950 rounded-2xl p-4 border-2 border-surface-variant flex flex-col items-center justify-center text-center">
                                <div class="w-16 h-16 rounded-full bg-tertiary-container/20 flex items-center justify-center mb-2">
                                    <span
                                        class="material-symbols-outlined text-tertiary text-4xl"
                                        style="font-variation-settings: 'FILL' 1;"
                                    >
                                        auto_stories
                                    </span>
                                </div>
                                <span class="text-label-bold font-label-bold text-xs uppercase text-on-surface">
                                    Word Master
                                </span>
                            </div>
                            <div class="bg-slate-950 rounded-2xl p-4 border-2 border-surface-variant flex flex-col items-center justify-center text-center">
                                <div class="w-16 h-16 rounded-full bg-secondary-container/20 flex items-center justify-center mb-2">
                                    <span
                                        class="material-symbols-outlined text-secondary text-4xl"
                                        style="font-variation-settings: 'FILL' 1;"
                                    >
                                        history_edu
                                    </span>
                                </div>
                                <span class="text-label-bold font-label-bold text-xs uppercase text-on-surface">
                                    Story Finisher
                                </span>
                            </div>
                            <div class="bg-slate-950 rounded-2xl p-4 border-2 border-surface-variant flex flex-col items-center justify-center text-center">
                                <div class="w-16 h-16 rounded-full bg-lime-400/10 flex items-center justify-center mb-2">
                                    <span
                                        class="material-symbols-outlined text-lime-400 text-4xl"
                                        style="font-variation-settings: 'FILL' 1;"
                                    >
                                        volume_up
                                    </span>
                                </div>
                                <span class="text-label-bold font-label-bold text-xs uppercase text-on-surface">
                                    Clear Speaker
                                </span>
                            </div>
                            <div class="bg-slate-950/50 rounded-2xl p-4 border-2 border-dashed border-surface-variant flex flex-col items-center justify-center text-center opacity-50">
                                <span class="material-symbols-outlined text-4xl">
                                    lock
                                </span>
                                <span class="text-label-bold font-label-bold text-xs uppercase">
                                    Locked
                                </span>
                            </div>
                        </div>
                        <button class="mt-8 w-full py-4 bg-surface-variant text-on-surface-variant rounded-xl font-label-bold uppercase border-b-4 border-slate-900 active-3d transition-all">
                            View All Badges
                        </button>
                    </section>
                </div>
            </DashboardLayout>
        </>
    );
}
