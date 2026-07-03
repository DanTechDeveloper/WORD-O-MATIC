const FEEDBACK_FILES = {
    "Good!": "good.wav",
    "Great!": "great.wav",
    "Great Job!": "great_job.wav",
    "Excellent!": "excellent.wav",
    "Almost!": "almost.wav",
    "Try Again!": "try_again.wav",
    "So Close!": "so_close.wav",
    "Keep Going!": "keep_going.wav",
    "Nice Try!": "nice_try.wav",
}

function playAudio(path) {
    try {
        const audio = new Audio(path)
        audio.volume = 1.0
        audio.play()
    } catch (e) {
        // ignore
    }
}

export function playSuccessSound() {
    playAudio("/Sound Effects/word_smashed.mp3")
}

export function playBadgeUnlockSound() {
    playAudio("/Sound Effects/unlocked_badges_sfx.mp3")
}

export function playMispronounceSound() {
    playAudio("/Sound Effects/mispronounced.mp3")
}

export function playFeedbackSound(message) {
    const file = FEEDBACK_FILES[message]
    if (file) {
        playAudio("/Sound Effects/" + file)
    }
}
