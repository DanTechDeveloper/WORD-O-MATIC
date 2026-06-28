export function playSuccessSound() {
    try {
        const audio = new Audio("/Sound Effects/word_smashed.mp3")
        audio.volume = 1.0
        audio.play()
    } catch (e) {
        // ignore
    }
}

export function playBadgeUnlockSound() {
    try {
        const audio = new Audio("/Sound Effects/unlocked_badges_sfx.mp3")
        audio.volume = 1.0
        audio.play()
    } catch (e) {
        // ignore
    }
}

export function speakText(text) {
    try {
        if (!("speechSynthesis" in window)) return
        window.speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.rate = 1.0
        utterance.pitch = 1.1
        utterance.volume = 1.0
        window.speechSynthesis.speak(utterance)
    } catch (e) {
        // ignore
    }
}
