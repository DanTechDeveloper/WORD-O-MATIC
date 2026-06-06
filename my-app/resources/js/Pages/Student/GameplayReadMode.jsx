import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import ReadModeMainContent from "@/Components/Student/ReadModeMainContent";
export default function GameplayReadMode() {
    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameplayHeader back={"readModeLevels"} />
                <ReadModeMainContent />
                <Microphone />
            </div>
        </>
    );
}
