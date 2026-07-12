import { usePage, Link } from "@inertiajs/react";

export default function StudentProfile() {
    const { auth } = usePage().props;
    const avatar  = auth.user.student.avatar;
    return (
        <header className="fixed top-0 left-0 right-0 h-16 lg:h-20 flex items-center justify-between px-4 lg:px-8 z-40 bg-background border-b-2 border-outline">
            <div className="flex items-center gap-2 lg:gap-4 min-w-0">
                <div className="w-10 h-10 lg:w-12 lg:h-12 shrink-0 rounded-full border-2 border-lime-400 overflow-hidden shadow-[2px_2px_0px_0px_rgba(163,230,53,1)]">
                    <img
                        src={avatar}
                        alt="Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
                <div className="min-w-0">
                    <h1 className="text-sm lg:text-headline-md font-headline-md truncate">
                        {auth?.user?.name || "Student"}
                    </h1>
                    <div className="flex gap-3 text-label-bold font-label-bold uppercase tracking-widest items-center">
                        <span className="flex items-center gap-1 text-lime-400">
                            <span
                                className="material-symbols-outlined text-sm"
                                style={{ fontVariationSettings: "'FILL' 1" }}
                            >
                                stars
                            </span>
                            <span className="hidden sm:inline">
                                {auth?.user?.student?.points ?? 0} PTS
                            </span>
                            <span className="sm:hidden">
                                {auth?.user?.student?.points ?? 0}
                            </span>
                        </span>
                    </div>
                </div>
            </div>
            <div className="flex items-center gap-4 shrink-0">
                <Link
                    href="/logout"
                    method="post"
                    as="button"
                    className="flex items-center gap-2 bg-pink-600 text-white px-3 lg:px-4 py-2 rounded-xl border-b-2 border-pink-900 active:translate-y-0.5 active:border-b-0 transition-all font-black text-xs uppercase"
                >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    <span className="hidden sm:inline">Exit</span>
                </Link>
            </div>
        </header>
    );
}
