import { router } from "@inertiajs/react";

const BGM_STORAGE_KEY = "wordomaticBgm"

let bgm = null
let restoreTimer = null
let micLive = false
let bgmSilenced = false

export function setMicLive(on) {
    micLive = on
}

export function setBgmSilenced(on) {
    bgmSilenced = on
}

function saveBgmPosition() {
    if (!bgm || isNaN(bgm.currentTime)) return
    try {
        sessionStorage.setItem(BGM_STORAGE_KEY, JSON.stringify({ currentTime: bgm.currentTime }))
    } catch {}
}

function clearBgmPosition() {
    try {
        sessionStorage.removeItem(BGM_STORAGE_KEY)
    } catch {}
}

function stopBackgroundMusic() {
    if (!bgm) return
    clearTimeout(restoreTimer)
    bgm.pause()
    bgm.currentTime = 0
    clearBgmPosition()
}

export function pauseBackgroundMusic() {
    if (!bgm || bgm.paused) return
    clearTimeout(restoreTimer)
    bgm.pause()
}

export function startBackgroundMusic() {
    if (bgm) {
        if (bgm.paused) bgm.play()
        return
    }
    bgm = new Audio("/Sound Effects/BackgroundMusic.opus")
    bgm.loop = true
    bgm.volume = 0.5
    let saved = null
    try {
        saved = JSON.parse(sessionStorage.getItem(BGM_STORAGE_KEY) || "null")
    } catch {}
    if (saved?.currentTime) bgm.currentTime = saved.currentTime
    bgm.play().catch(() => {})
}

export function initStudentAudio() {
    document.addEventListener("click", (e) => {
        if (!location.pathname.startsWith("/student")) return
        if (micLive || bgmSilenced) return
        startBackgroundMusic()
        const el = e.target.closest("a, button, [role=button]")
        if (!el) return
        if (e.target.closest('[data-sfx="major"]')) playClickSound()
        else playSoftBlip()
    })
    router.on("navigate", ({ detail }) => {
        if (!detail.page.url.startsWith("/student")) stopBackgroundMusic()
    })
    window.addEventListener("pagehide", saveBgmPosition)
}

function duck() {
    if (!bgm || bgm.paused) return
    clearTimeout(restoreTimer)
    bgm.volume = 0.12
    restoreTimer = setTimeout(() => (bgm.volume = 0.5), 500)
}

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

function playAudio(path, volume = 1.0, { duck: shouldDuck = true } = {}) {
    if (shouldDuck) duck()
    try {
        const audio = new Audio(path)
        audio.volume = volume
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

let lastClickSoundAt = 0

function playClickDebounced() {
    const now = Date.now()
    if (now - lastClickSoundAt < 200) return false
    lastClickSoundAt = now
    return true
}

export function playClickSound() {
    if (!playClickDebounced()) return;
    playAudio("/Sound Effects/BUTTON_CLICKED.mp3")
}

export function playSoftBlip() {
    if (!playClickDebounced()) return
    playAudio("/Sound Effects/BUTTON_CLICKED.mp3", 0.50, { duck: false }) 
}
