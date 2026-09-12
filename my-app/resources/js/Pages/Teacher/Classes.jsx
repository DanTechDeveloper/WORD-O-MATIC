import { Head } from "@inertiajs/react";
import DashboardLayout from "@/Layouts/Teacher/DashboardLayout";

export default function Classes() {
    return (
        <>
            <Head title="Classes — Word-O-Matic">
                <meta name="description" content="Manage classes on Word-O-Matic." />
            </Head>
            <DashboardLayout>
                <div className="flex items-center justify-between"></div>
            </DashboardLayout>
        </>
    );
}
