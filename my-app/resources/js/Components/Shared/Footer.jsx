import { Link, usePage } from "@inertiajs/react";

export default function Footer() {
    const { auth } = usePage().props;
    const isStudent = auth?.user?.role === "student";
    if (isStudent) {
        return (
            <footer className="border-t-2 border-outline/20 py-3 sm:py-4 px-3 sm:px-4 md:px-6">
                <div className="max-w-6xl mx-auto flex items-center justify-center gap-1.5 sm:gap-2 md:gap-3 text-center">
                    <span className="font-black tracking-tighter italic text-primary/60 text-xs sm:text-sm">WORD-O-MATIC</span>
                </div>
            </footer>
        );
    }
    return (
        <footer className="border-t-2 border-outline/20 py-3 sm:py-4 px-3 sm:px-4 md:px-6">
            <div className="max-w-6xl mx-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between md:gap-4">
                <span className="font-black tracking-tighter italic text-primary/60 text-xs sm:text-sm">
                    WORD-O-MATIC
                </span>
                <span className="flex items-center gap-3 sm:gap-4 text-xs font-bold">
                    <Link href="/privacy" className="text-primary hover:text-primary-fixed underline-offset-4 hover:underline min-h-[44px] flex items-center px-2 -mx-2 text-[11px] sm:text-xs">
                        Privacy
                    </Link>
                    <span className="text-outline/40 mx-1">·</span>
                    <Link href="/terms" className="text-primary hover:text-primary-fixed underline-offset-4 hover:underline min-h-[44px] flex items-center px-2 -mx-2 text-[11px] sm:text-xs">
                        Terms
                    </Link>
                </span>
            </div>
        </footer>
    );
}
