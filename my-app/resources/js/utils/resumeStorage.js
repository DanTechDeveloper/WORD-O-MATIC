/*
   Tiny resume-storage helpers. Single source of truth for the key shape:
     key  = `wordomaticResume:${moduleId}`
     value = { moduleId, currentWordIndex, wordsSmashed, currentStreak, maxStreak, timeLeft }

   Persisted in sessionStorage so a tab close = reset; survives only
   mid-round F5 / back-then-forward within the same browser tab.
*/

const KEY_PREFIX = "wordomaticResume:";

export function resumeKey(moduleId) {
    return `${KEY_PREFIX}${moduleId}`;
}

export function readResumeSession(moduleId) {
    if (typeof window === "undefined" || !moduleId) return null;
    try {
        const s = JSON.parse(sessionStorage.getItem(resumeKey(moduleId)));
        if (s?.moduleId === String(moduleId) || s?.moduleId === moduleId) {
            return s;
        }
    } catch { return null; }
    return null;
}

export function writeResumeSession(moduleId, data) {
    if (typeof window === "undefined" || !moduleId) return;
    sessionStorage.setItem(resumeKey(moduleId), JSON.stringify({ ...data, moduleId }));
}

export function clearResumeSession(moduleId) {
    if (typeof window === "undefined" || !moduleId) return;
    sessionStorage.removeItem(resumeKey(moduleId));
}
