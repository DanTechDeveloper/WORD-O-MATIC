/*
   Tiny resume-storage helpers. Single source of truth for the key shape:
     key  = `wordomaticResume:${moduleId}`
     value = { moduleId, scope, currentWordIndex, wordsSmashed, currentStreak,
               maxStreak, timeLeft, savedAt, wordOrder? }

   Pending commit helpers (same file, separate key):
     key  = `wordomaticPending:${moduleId}`
     value = { moduleId, scope, saveEndpoint, words_smashed, words_processed,
               streak, sentence_scores?, client_token?, createdAt }
   Synchronous write before router.post so an F5 while finishRound is
   slow still has the payload to replay on next mount.

   Persisted in sessionStorage so a tab close = reset; survives only
   mid-round F5 / back-then-forward within the same browser tab.

   SCOPE — "word" (Word Blast) or "para" (Story Quest). NOT in the key on
   purpose: WordModule id 3 and ParagraphModule id 3 are the SAME integer
   (CurriculumSeeder alternates both in one range(1,10) loop), so a shared key
   let a Story Quest round be resumed as a Word Blast round — wrong index, and
   a wordOrder of paragraph word ids. `scope` in the payload closes that on
   read. Keeping it out of the key means records written before this shipped
   (no scope) still resume, so nobody loses a round on deploy.
   A record with no scope is accepted by either game: it can only be a
   pre-deploy record, and a round is 60s.

    Security:
    - timeLeft is UX-only, never trusted server-side; clamped 0-60 on read.
      The clock pauses while away (no wall-clock drain): ACTIVE time is still
      capped at 60s of live play, and no reset path exists because every tick
      rewrites the current timeLeft.
    - saveEndpoint is client-controlled; replay whitelists allowed endpoints only.
*/

const KEY_PREFIX = "wordomaticResume:";
const PENDING_PREFIX = "wordomaticPending:";
const ALLOWED_ENDPOINTS = ["/student/saveWordProgress", "/student/saveParagraphProgress"];

export function resumeKey(moduleId) {
    return `${KEY_PREFIX}${moduleId}`;
}

export function readResumeSession(moduleId, scope = null) {
    if (typeof window === "undefined" || !moduleId) return null;
    try {
        const s = JSON.parse(sessionStorage.getItem(resumeKey(moduleId)));
        if (s?.moduleId === String(moduleId) || s?.moduleId === moduleId) {
            if (scope && s.scope && s.scope !== scope) return null;
            // ponytail: clamp only — the clock PAUSES while the student is
            // away (Back/LevelsPage) and resumes where it left off. An older
            // wall-clock drain was removed: it could never prevent a 60s reset
            // (every tick writes the current timeLeft, so no reset path exists)
            // and it turned CONTINUE-after-a-minute into an instant GAMEOVER.
            // savedAt is still written by the writers but no longer read here.
            if (typeof s.timeLeft === "number") {
                s.timeLeft = Math.max(0, Math.min(60, Math.floor(s.timeLeft)));
            }
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

export function pendingKey(moduleId) {
    return `${PENDING_PREFIX}${moduleId}`;
}

export function readPendingSession(moduleId, scope = null) {
    if (typeof window === "undefined" || !moduleId) return null;
    try {
        const s = JSON.parse(sessionStorage.getItem(pendingKey(moduleId)));
        if (s?.moduleId === String(moduleId) || s?.moduleId === moduleId) {
            if (scope && s.scope && s.scope !== scope) return null;
            // ponytail: strip tampered endpoint — replay whitelists only
            if (s.saveEndpoint && !ALLOWED_ENDPOINTS.includes(s.saveEndpoint)) {
                delete s.saveEndpoint;
            }
            return s;
        }
    } catch { return null; }
    return null;
}

export function writePendingSession(moduleId, data) {
    if (typeof window === "undefined" || !moduleId) return;
    sessionStorage.setItem(pendingKey(moduleId), JSON.stringify({ ...data, moduleId }));
}

export function clearPendingSession(moduleId) {
    if (typeof window === "undefined" || !moduleId) return;
    sessionStorage.removeItem(pendingKey(moduleId));
}
