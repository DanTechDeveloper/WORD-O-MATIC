import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import SpeakModeMainContent from "@/Components/Student/SpeakModeMainContent";
import { useState } from "react";

export default function GameplaySpeakMode({ module }) {
    const [currentWordIndex, setCurrentWordIndex] = useState(0);

    // Split the content into individual words
    const words = module?.content ? module.content.split(/\s+/) : [];

    // Function to move to the next word (this will be triggered by your Speech Recognition logic)
    const handleNextWord = () => {
        setCurrentWordIndex((prev) => Math.min(prev + 1, words.length));
    };

    return (
        <>
            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameplayHeader back={"speakModeLevels"} />
                <SpeakModeMainContent
                    words={words}
                    currentWordIndex={currentWordIndex}
                />
                {/* Added onClick for testing, you can replace this with your STT logic */}
                <div onClick={handleNextWord}>
                    <Microphone />
                </div>
            </div>
        </>
    );
}
