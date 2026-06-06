import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
export default function GameplaySpeakMode() {
    const storySegments = [
        {
            text: "In a distant nebula, a brave ",
            className: "text-on-background/40",
        },
        {
            text: "galactic explorer",
            className:
                "relative inline-block bg-lime-400 text-slate-950 px-4 rounded-sm neo-shadow-lime py-0.5",
            hasCursor: true,
        },
        {
            text: " prepares to chart the unknown clusters of the binary sun system. The engines hum with plasma energy as the navigation bot calculates the hyperspace jump sequence.",
            className: "text-purple-900/40 opacity-50",
        },
    ];

    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameplayHeader back={"speakModeLevels"} />
                <SpeakModeMainContent storySegments={storySegments} />
                <Microphone />
            </div>
        </>
    );
}
