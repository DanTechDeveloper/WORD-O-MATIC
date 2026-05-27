import StudentProfile from "../../Components/Student/StudentProfile";
import StudentFeatures from "../../Components/Student/StudentFeatures";
export default function DashboardLayout({ children, minimal = false }) {
    return <>
        <div className={`bg-background text-on-background font-body-md min-h-screen ${minimal ? 'pb-16' : 'pb-32'}`}>
            <StudentProfile />
            <main className={`${minimal ? 'max-w-full' : 'max-w-7xl'} w-full mx-auto px-margin mt-10`}>
                {children}
            </main>
            {!minimal && (
                <div className="max-w-7xl w-full mx-auto px-margin">
                    <StudentFeatures />
                </div>
            )}
        </div>
    </>
}