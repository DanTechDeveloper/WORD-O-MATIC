import DashboardLayout from "@/Layouts/Student/DashboardLayout";
import { Link } from "@inertiajs/react";
export default function Badges() {
    return (
        <>
            <DashboardLayout>
                <div className="max-w-full mx-auto px-margin pt-12">
                    {/* <!-- Section Header --> */}
                    <div className="mb-12 text-center">
                        <h2 className="text-7xl font-bold text-on-background uppercase tracking-tighter mb-4 drop-shadow-[4px_4px_0px_rgba(114,18,255,1)]">
                             ACHIEVEMENTS
                        </h2>
                        <p className="text-xl font-bold text-on-surface-variant max-w-2xl mx-auto">
                            Your cosmic journey is paying off, Cadet! Check out
                            the powerful artifacts you've unlocked in the
                            linguistics nebula.
                        </p>
                    </div>
                    {/* <!-- Achievements Grid --> */}
                    <div class="grid grid-cols-1 md:grid-cols-3 gap-gutter">
                        {/* <!-- Achievement Card 1: Word Master --> */}
                        <div class="group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 badge-card-hover shadow-[8px_8px_0px_0px_#14532d]">
                            <div class="absolute -top-6 -right-2 bg-[#a3e635] text-[#064e3b] font-black px-4 py-2 rounded-lg border-2 border-[#064e3b] rotate-12 shadow-[4px_4px_0px_0px_#064e3b] z-10">
                                MASTERED!
                            </div>
                            <div class="flex flex-col items-center text-center space-y-6">
                                <div class="w-32 h-32 bg-[#a3e635] border-4 border-[#064e3b] rounded-full flex items-center justify-center text-6xl shadow-[0px_6px_0px_0px_#064e3b]">
                                    🏅
                                </div>
                                <div>
                                    <h3 class="font-headline-md text-headline-md text-[#a3e635] mb-2 uppercase tracking-tight">
                                        Word Master
                                    </h3>
                                    <p class="font-body-md text-body-md text-on-surface-variant">
                                        90% accuracy
                                    </p>
                                </div>
                                <div class="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                    <div
                                        class="h-full bg-[#a3e635] w-[90%]"
                                        style={{
                                            boxShadow:
                                                "inset 0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        {/* <!-- Achievement Card 2: Story Finisher --> */}
                        <div class="group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 badge-card-hover shadow-[8px_8px_0px_0px_#7000ff]">
                            <div class="absolute -top-6 -right-2 bg-primary-container text-white font-black px-4 py-2 rounded-lg border-2 border-slate-950 -rotate-6 shadow-[4px_4px_0px_0px_#1a1a2e] z-10">
                                LEGEND
                            </div>
                            <div class="flex flex-col items-center text-center space-y-6">
                                <div class="w-32 h-32 bg-primary-container border-4 border-slate-950 rounded-full flex items-center justify-center text-6xl shadow-[0px_6px_0px_0px_#3c0090]">
                                    📖
                                </div>
                                <div>
                                    <h3 class="font-headline-md text-headline-md text-primary mb-2 uppercase tracking-tight">
                                        Story Finisher
                                    </h3>
                                    <p class="font-body-md text-body-md text-on-surface-variant">
                                        Completed Story Mode
                                    </p>
                                </div>
                                <div class="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                    <div
                                        class="h-full bg-primary-container w-full"
                                        style={{
                                            boxShadow:
                                                "inset 0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        {/* <!-- Achievement Card 3: Clear Speaker --> */}
                        <div class="group relative bg-surface-container border-4 border-purple-900 p-card-padding rounded-xl transition-all duration-200 badge-card-hover shadow-[8px_8px_0px_0px_#890064]">
                            <div class="absolute -top-6 -right-2 bg-secondary-container text-white font-black px-4 py-2 rounded-lg border-2 border-slate-950 rotate-3 shadow-[4px_4px_0px_0px_#3c002a] z-10">
                                UNLOCKED
                            </div>
                            <div class="flex flex-col items-center text-center space-y-6">
                                <div class="w-32 h-32 bg-secondary-container border-4 border-slate-950 rounded-full flex items-center justify-center text-6xl shadow-[0px_6px_0px_0px_#890064]">
                                    🎤
                                </div>
                                <div>
                                    <h3 class="font-headline-md text-headline-md text-secondary mb-2 uppercase tracking-tight">
                                        Clear Speaker
                                    </h3>
                                    <p class="font-body-md text-body-md text-on-surface-variant">
                                    High speaking score
                                    </p>
                                </div>
                                <div class="w-full bg-slate-900 h-4 rounded-full border-2 border-purple-900 overflow-hidden">
                                    <div
                                        class="h-full bg-secondary-container w-[75%]"
                                        style={{
                                            boxShadow:
                                                "inset 0 2px 4px rgba(0,0,0,0.3)",
                                        }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* <!-- Visual Decorative Area (Bento-style supplementary content) --> */}
                    <div class="mt-gutter grid grid-cols-1 md:grid-cols-2 gap-gutter">
                        <div class="bg-surface-container-high border-4 border-purple-900 rounded-2xl p-card-padding flex items-center gap-6 shadow-[8px_8px_0px_0px_rgba(112,0,255,1)]">
                            <img
                                class="w-24 h-24 rounded-full border-4 border-primary shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] object-cover"
                                data-alt="A stylized digital illustration of a cute, friendly space robot floating in a cosmic playground. The robot features glowing electric pink accents and a lime green visor, matching the neon brutalist color scheme of the application. The background is a deep space purple with floating geometric shapes and colorful nebulae, creating an energetic and encouraging atmosphere for young learners."
                                src="https://lh3.googleusercontent.com/aida-public/AB6AXuDs9SKYxmu4ujHbbXQyn3b5UwgUPORrzECiKin6nvzRYctiwaF2cOpnH-h2zbtWxQKe6T2DRXiO1yLce8o-bFgPSC87nsfYglFG5zqMG5wpu6I7w8WHIHDKxXR9nCHPfsZYIfmMyBVWE0xg-_QcWIw_jC5PcMsgSdkfrJi2fFuBIC6XOi26R1D6z_yJ66IqmuUqrMtVmb-i0i9FxXsPFfl7ZIDe1_OJO9iiH5wrsM6S_lKnDPbLfU1R-i8AKp8Uh0IolSZ0wD36UbQv"
                            />
                            <div>
                                <h4 class="font-headline-md text-on-surface">
                                    Galaxy Progress
                                </h4>
                                <p class="font-body-md text-on-surface-variant">
                                    You've explored 4 out of 10 linguistic
                                    constellations this week!
                                </p>
                            </div>
                        </div>
                        <div class="bg-surface-container-high border-4 border-purple-900 rounded-2xl p-card-padding flex items-center gap-6 shadow-[8px_8px_0px_0px_rgba(255,59,192,1)] overflow-hidden relative">
                            <div class="z-10">
                                <h4 class="font-headline-md text-on-surface">
                                    Daily Streak
                                </h4>
                                <p class="font-body-md text-on-surface-variant">
                                    12 Days and counting! You're on fire, Cadet!
                                </p>
                            </div>
                            <div class="absolute right-0 top-0 h-full w-24 bg-secondary-container opacity-20 rotate-12 translate-x-8"></div>
                            <span
                                class="material-symbols-outlined text-6xl text-secondary opacity-50 absolute right-4"
                                data-icon="local_fire_department"
                            >
                                local_fire_department
                            </span>
                        </div>
                    </div>
                    {/* <!-- Back Button Section --> */}
                    <div class="mt-16 flex justify-center">
                        <Link href="/student/dashboard" className="bg-[#a3e635] text-[#064e3b] font-headline-md text-headline-md px-12 py-6 rounded-2xl border-4 border-[#064e3b] shadow-[0px_8px_0px_0px_#064e3b] active:translate-y-1 active:shadow-[0px_4px_0px_0px_#064e3b] transition-all flex items-center gap-3 active-press">
                            <span
                                class="material-symbols-outlined text-4xl"
                                data-icon="rocket"
                            >
                                rocket
                            </span>
                            BACK TO HOME
                        </Link>
                    </div>
                </div>
            </DashboardLayout>
        </>
    );
}
