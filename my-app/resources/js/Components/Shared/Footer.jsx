import { Link, usePage } from "@inertiajs/react";

export default function Footer() {
    const { auth } = usePage().props;
    const isStudent = auth?.user?.role === "student";
    if (isStudent) {
        return (
            <footer className="border-t-2 border-outline/20 py-4 px-4">
                <div className="max-w-6xl mx-auto flex items-center justify-center gap-2 text-sm">
                    <span className="font-black tracking-tighter italic text-primary/60">WORD-O-MATIC</span>
                </div>
            </footer>
        );
    }
    return (
        <footer className="border-t-2 border-outline/20 py-4 px-4">
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2 text-sm">
                <span className="font-black tracking-tighter italic text-primary/60">
                    WORD-O-MATIC
                </span>
                <span className="flex items-center gap-3 text-xs font-bold">
                    <Link href="/privacy" className="text-primary hover:text-primary-fixed underline-offset-4 hover:underline">
                        Privacy
                    </Link>
                    <span className="text-outline/40">·</span>
                    <Link href="/terms" className="text-primary hover:text-primary-fixed underline-offset-4 hover:underline">
                        Terms
                    </Link>
                </span>
            </div>
        </footer>
    );
}
