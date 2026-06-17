import StudentProfile from "../../Components/Student/StudentProfile";
import StudentFeatures from "../../Components/Student/StudentFeatures";
export default function DashboardLayout({ children, minimal = false }) {
    return (
        <>
            <div
                className={`bg-background text-on-background font-body-md min-h-screen ${minimal ? "pb-16" : "lg:pl-64 pb-20 lg:pb-0"}`}
            >
                <StudentProfile minimal={minimal} />
                <main
                    className={`${minimal ? "max-w-full pt-10" : "max-w-full pt-32"} w-[92%] mx-auto`}
                >
                    {children}
                </main>
                {!minimal && <StudentFeatures />}
            </div>
        </>
    );
}
