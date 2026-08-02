# Resume & Timer Policy (Read/Side-Quest Gameplay)

## Rule
A student who hard-refreshes OR navigates away from an **in-progress** Word Blast /
Story Quest round resumes **mid-round**: same word index, streak, and a continuous
timer — no "Tap to Start" overlay, no 3-2-1 countdown on resume.

## Storage contract (client, tab-scoped)
- Key: `wordomaticResume:${moduleId}` in `sessionStorage`
  (read/write/clear via `resources/js/utils/resumeStorage.js`)
- Value: `{ moduleId, currentWordIndex, wordsSmashed, currentStreak, maxStreak, timeLeft }`
- Tab close → clears automatically (sessionStorage).
- Cleared on: round complete (`COMPLETED`), time-up/timeout (`GAMEOVER`), or
  explicit restart.

## Hydration flow
1. `LevelsPage` scans each unlocked `module.id` for a stored resume session.
   Modules with one render a **CONTINUE** button on `LevelCard` (ghost variant,
   `bg-accent` text color); others render **PLAY** (primary `bg-accent` fill).
2. Clicking **CONTINUE** navigates to `/<gameUrl>/<moduleId>?resume=true`.
3. `useResumeSession(moduleId, { signal: "true" })`:
   - If session + `?resume=true` → returns `{ session, isResume: true }`
   - Else → `{ session: null, isResume: false }`
4. `useGameplayEngine`:
   - `useResumeSession` is consumed by both pages.
   - When `isResume === true` AND a session exists → engine initialises
     `gameState` to `"ACTIVE"` (not `"IDLE"`/`"COUNTDOWN"`), skipping the
     3-2-1 gate and the TapToStart overlay.
   - When no resume → normal `"IDLE"` → `startGame()` → `"COUNTDOWN"` → timer.

## Timer ownership
- The engine owns the 60s tick (`timeLeft` in `useState`, persisted every turn).
- A refresh at `10s` resumes at `10s` (engine hydrates `timeLeft` from storage).
  `GameplayHeader` no longer runs its own 60s interval.

## Security note (out of scope here)
Session storage persists per *tab*; it never crosses users (same-origin/tab-isolated).
It only stores in-progress counters, not auth tokens.
