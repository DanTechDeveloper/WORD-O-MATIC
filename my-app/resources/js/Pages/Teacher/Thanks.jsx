import { Head, Link, usePage } from "@inertiajs/react";

export default function Thanks() {
    const { flash } = usePage().props;
    const sent = flash?.sent ?? null;
    const failed = flash?.failed ?? null;
    const reportedAt = flash?.reported_at ?? null;

    return (
        <div className="min-h-screen bg-background text-on-background flex flex-col">
            <Head title="Reports Sent — Word-O-Matic">
                <meta name="description" content="Report emails sent summary." />
            </Head>
            <div className="flex-1 max-w-xl mx-auto w-full px-4 py-12 text-center">
                <div className="bg-surface-container border-2 border-outline/30 rounded-2xl p-8">
                    <span className="material-symbols-outlined text-5xl text-accent" aria-hidden="true">
                        check_circle
                    </span>
                    <h1 className="mt-3 text-2xl font-black tracking-tighter">Reports sent</h1>
                    <p className="mt-2 text-sm text-on-surface-variant">Your class report emails were processed.</p>
                    <div className="mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3 text-center">
                        <div className="bg-background rounded-xl p-3 border-2 border-outline/20">
                            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Sent</p>
                            <p className="text-xl font-black text-accent">{sent ?? "—"}</p>
                        </div>
                        <div className="bg-background rounded-xl p-3 border-2 border-outline/20">
                            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">Failed</p>
                            <p className="text-xl font-black text-error">{failed ?? "—"}</p>
                        </div>
                        <div className="bg-background rounded-xl p-3 border-2 border-outline/20">
                            <p className="text-xs font-black uppercase tracking-widest text-on-surface-variant">When</p>
                            <p className="text-xs font-bold text-on-surface whitespace-normal break-words [overflow-wrap:anywhere] leading-tight block">{reportedAt ?? "—"}</p>
                        </div>
                    </div>
                    <div className="mt-6 flex justify-center gap-3">
                        <Link
                            href="/teacher/reports"
                            className="inline-flex items-center gap-2 bg-accent text-background font-black uppercase text-sm px-6 py-3 rounded-xl border-b-[4px] border-accent-deep"
                        >
                            Back to Reports
                        </Link>
                        <Link href="/teacher/dashboard" className="inline-flex items-center gap-2 bg-surface-container-high text-on-surface font-bold text-sm px-6 py-3 rounded-xl border-2 border-outline/30">
                            Dashboard
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
