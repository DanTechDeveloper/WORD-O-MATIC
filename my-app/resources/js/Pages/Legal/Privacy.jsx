import { Head, Link, usePage } from "@inertiajs/react";
import Footer from "@/Components/Shared/Footer";

export default function Privacy() {
    const { auth } = usePage().props;
    const backHref = auth?.user?.role === "teacher" ? "/teacher/dashboard" : auth?.user?.role === "student" ? "/student/dashboard" : "/";
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <Head title="Privacy Policy — Word-O-Matic">
                <meta name="description" content="Privacy Policy for Word-O-Matic classroom reading platform." />
            </Head>
            <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
                <Link href={backHref} className="text-sm font-bold text-primary hover:underline">
                    ← Back
                </Link>
                <h1 className="mt-6 text-3xl font-black tracking-tighter">Privacy Policy</h1>
                <p className="mt-2 text-sm text-on-surface-variant">Last updated: September 2026</p>
                <div className="mt-6 space-y-4 text-sm leading-6 text-on-surface-variant">
                    <p>
                        Word-O-Matic is a classroom tool. Student accounts use name plus 4-digit PIN. PINs are stored bcrypt only and are reset only — never readable. Teachers provision accounts and own class data.
                    </p>
                    <p>
                        {/* ponytail: no analytics on student track COPPA — add teacher analytics clause only when VITE_ANALYTICS_ID is set */}
                        No analytics runs on student pages. Teacher pages may load analytics only when configured via environment, and never on student routes.
                    </p>
                    <p>We store progress, word mastery, and badges to power learning. No advertising, no sale of data.</p>
                    <p>
                        Questions: contact your teacher or school administrator. For formal requests, email the school office listed on your class materials.
                    </p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
