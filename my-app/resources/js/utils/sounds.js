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

export function playTimeWarningSound() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 660;
        gain.gain.setValueAtTime(0.2, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.2);
        setTimeout(() => ctx.close(), 300);
    } catch (e) {
        // ignore
    }
}

export function playFeedbackSound(message) {
    const file = FEEDBACK_FILES[message]
    if (file) {
        playAudio("/Sound Effects/" + file)
    }
}
