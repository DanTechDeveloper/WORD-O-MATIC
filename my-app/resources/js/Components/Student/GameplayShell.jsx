import GameplayHeader from "@/Components/Student/GameplayHeader";
import Microphone from "@/Components/Student/Microphone";
import GameOverModal from "@/Components/Student/GameOverModal";
import DeniedModal from "@/Components/Student/DeniedModal";
import SettingsModal from "@/Components/Student/SettingsModal";

export default function GameplayShell({
    module,
    gameState,
    currentWordIndex,
    totalWords,
    currentScore,
    onPlayAgain,
    showPointsFeedback,
    pointsFeedbackValue,
    backToMapUrl,
    isSettingsOpen,
    onOpenSettings,
    onCloseSettings,
    musicVolume,
    setMusicVolume,
    sfxVolume,
    setSfxVolume,
    onRestart,
    scoreEmphasize,
    onExit,
    onTimeUp,
    children,
}) {
    return (
        <>
            <GameOverModal
                gameState={gameState}
                currentWordIndex={currentWordIndex}
                totalWords={totalWords}
                onPlayAgain={onPlayAgain}
                backToMapUrl={backToMapUrl}
            />
            <DeniedModal gameState={gameState} />

            <SettingsModal
                isOpen={isSettingsOpen}
                onClose={onCloseSettings}
                musicVolume={musicVolume}
                setMusicVolume={setMusicVolume}
                sfxVolume={sfxVolume}
                setSfxVolume={setSfxVolume}
                onRestart={onRestart}
                onExit={onExit}
            />

            <div className="bg-background text-on-background font-body-md h-screen flex flex-col overflow-hidden">
                <GameplayHeader
                    level={module ? `${module.level} - ${module.title}` : ""}
                    onOpenSettings={onOpenSettings}
                    isActive={gameState === "ACTIVE"}
                    scoreEmphasize={scoreEmphasize}
                    isPaused={isSettingsOpen}
                    wordsSmashed={currentScore}
                    onTimeUp={onTimeUp}
                    showPointsFeedback={showPointsFeedback}
                    pointsFeedbackValue={pointsFeedbackValue}
                />

                {children}

                <div>
                    <Microphone
                        isListening={gameState === "ACTIVE"}
                        disabled={gameState === "COUNTDOWN"}
                    />
                </div>
            </div>
        </>
    );
}
