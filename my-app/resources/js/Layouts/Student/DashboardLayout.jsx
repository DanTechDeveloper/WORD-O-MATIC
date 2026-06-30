import StudentProfile from "../../Components/Student/StudentProfile";
export default function DashboardLayout({ children }) {
    return (
        <div className="bg-background text-on-background font-body-md min-h-screen">
            <StudentProfile />
            <main className="w-[92%] mx-auto pt-16 lg:pt-20">
                {children}
            </main>
        </div>
    );
}
