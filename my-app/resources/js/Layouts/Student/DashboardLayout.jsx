import StudentProfile from "../../Components/Student/StudentProfile";
import StudentFeatures from "../../Components/Student/StudentFeatures";
export default function DashboardLayout({ children }) {
    return <>
        <div className="bg-background text-on-background font-body-md min-h-screen pb-32">
            <StudentProfile />
            <main className="max-w-7xl w-full mx-auto px-margin mt-10">
                {children}
            </main>
            <div className="max-w-7xl w-full mx-auto px-margin">
                <StudentFeatures />
            </div>
        </div>
    </>
}