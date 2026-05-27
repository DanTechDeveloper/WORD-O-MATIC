import StudentFeatures from "@Components/Student/StudentFeatures";
import StudentProfile from "@Components/Student/StudentProfile";
export default function DashboardLayout({ children }) {
    return <>
        <div class="bg-background text-on-background font-body-md min-h-screen pb-32">
            <StudentProfile />
            <main class="max-w-6xl mx-auto px-margin mt-10">
                {children}
            </main>
            <StudentFeatures />
        </div>
    </>
}