import { Head, Link, usePage } from "@inertiajs/react";
import Footer from "@/Components/Shared/Footer";

export default function Terms() {
    const { auth } = usePage().props;
    const backHref = auth?.user?.role === "teacher" ? "/teacher/dashboard" : auth?.user?.role === "student" ? "/student/dashboard" : "/";
    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <Head title="Terms — Word-O-Matic">
                <meta name="description" content="Terms of use for Word-O-Matic classroom reading platform." />
            </Head>
            <div className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
                <Link href={backHref} className="text-sm font-bold text-primary hover:underline">
                    ← Back
                </Link>
                <h1 className="mt-6 text-3xl font-black tracking-tighter">Terms of Use</h1>
                <p className="mt-2 text-sm text-on-surface-variant">Last updated: September 2026</p>
                <div className="mt-6 space-y-4 text-sm leading-6 text-on-surface-variant">
                    <p>Word-O-Matic is provided for classroom learning. Use it as directed by your teacher.</p>
                    <p>Classroom license only. No public pricing tiers. No resale. Accounts are provisioned by teachers.</p>
                    <p>Do not share PINs outside your class. Teachers may reset a PIN to keep access safe.</p>
                    <p>Content (word modules, paragraphs) is owned by the school or licensed for classroom use.</p>
                </div>
            </div>
            <Footer />
        </div>
    );
}
