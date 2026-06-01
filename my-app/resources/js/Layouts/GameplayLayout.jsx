import Microphone from "../Components/Student/Microphone";
export default function GameplayLayout({ children }) {
    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                {children}
                <Microphone />
            </div>
        </>
    );
}
