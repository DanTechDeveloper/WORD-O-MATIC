import { usePage, Link } from "@inertiajs/react";

export default function StudentProfile({ minimal = false }) {
    const { auth } = usePage().props;
    const avatar  = auth.user.student.avatar;
    return (
        <>
            <header
                class={`fixed top-0 right-0 ${minimal ? "left-0" : "left-64"} h-20 flex items-center justify-between px-8 z-40 bg-slate-950 border-b-4 border-purple-900 shadow-[0_4px_0_0_#1e1b4b]`}
            >
                <div class="flex items-center gap-4">
                    <div class="w-12 h-12 rounded-full border-2 border-lime-400 overflow-hidden shadow-[2px_2px_0px_0px_rgba(163,230,53,1)]">
                        <img
                            src={avatar}
                        />
                    </div>
                    <div>
                        <h1 class="text-headline-md font-headline-md">
                            {auth?.user?.name || "Student"}
                        </h1>
                        <div class="flex gap-3 text-label-bold font-label-bold uppercase tracking-widest items-center">
                            <span class="flex items-center gap-1 text-secondary-container">
                                <span
                                    class="material-symbols-outlined text-sm"
                                    style={{
                                        fontVariationSettings: "'FILL' 1",
                                    }}
                                >
                                    stars
                                </span>
                                <span>
                                    {auth?.user?.student?.points ?? 0} TOTAL
                                    POINTS
                                </span>
                            </span>
                        </div>
                    </div>
                </div>
                <div class="flex items-center gap-4">
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        class="flex items-center gap-2 bg-pink-600 text-white px-4 py-2 rounded-xl border-b-4 border-pink-900 active:translate-y-1 active:border-b-0 transition-all font-black text-xs uppercase"
                    >
                        <span class="material-symbols-outlined">logout</span>
                        <span class="hidden sm:inline">Exit</span>
                    </Link>
                </div>
            </header>
        </>
    );
}
