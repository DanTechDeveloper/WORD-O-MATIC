# Resume & Timer Policy (Read/Side-Quest Gameplay)

## Rule
A student who hard-refreshes OR navigates away from an **in-progress** Word Blast /
Story Quest round resumes **mid-round**: same word index, streak, and a continuous
timer — no "Tap to Start" overlay, no 3-2-1 countdown on resume.

## Storage contract (client, tab-scoped)
- Key: `wordomaticResume:${moduleId}` in `sessionStorage`
  (read/write/clear via `resources/js/utils/resumeStorage.js`)
- Value: `{ moduleId, currentWordIndex, wordsSmashed, currentStreak, maxStreak, timeLeft }`
  plus Story Quest only: `verdicts` (per-word correct/wrong map) + `sentenceScores`
  (completed-sentence scores) — written by `useStoryQuestEngine` over the same key.
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
4. `useWordBlastEngine` / `useStoryQuestEngine` (shared core `useGameplayCore`):
    - `useResumeSession` is consumed by both pages.
    - When `isResume === true` AND a session exists → engine initialises
      `gameState` to `"ACTIVE"` (not `"IDLE"`/`"COUNTDOWN"`), skipping the
      3-2-1 gate and the TapToStart overlay.
    - When no resume → normal `"IDLE"` → `startGame()` → `"COUNTDOWN"` → timer.
    - Story Quest render rule (locked): fresh mount starts neutral with a
      start-here pulse (no static highlight until speech begins, karaoke
      sweep follows interim); resume mount shows restored verdicts plus a
      you-are-here marker at the resumed index (it is mid-round).

## Timer ownership
- The engine owns the 60s tick (`timeLeft` in `useState`, persisted every turn).
- A refresh at `10s` resumes at `10s` (engine hydrates `timeLeft` from storage).
  `GameplayHeader` no longer runs its own 60s interval.

## In-round pause (not session resume)
The pause button inside a live round is a different mechanism from the session
resume above and must not be conflated:

| | Session resume (this file) | In-round pause (`GAMEPLAY.md`) |
|---|---|---|
| Trigger | F5 / navigate away, then CONTINUE | Pause button on `GameplayHeader` |
| Mechanism | `wordomaticResume:<moduleId>` in `sessionStorage` | `gameState = "PAUSED"` (in-memory) |
| Timer | hydrates `timeLeft` from storage | stops via the existing `ACTIVE` gate |
| On return | `gameState` boots straight to `ACTIVE` | `COUNTDOWN` 3-2-1 → `ACTIVE` |
| Writes | writes on every `ACTIVE` turn | writes nothing |

Pausing does **not** clear or write the resume key. Exiting to Home **does**
clear it (`clearResume()` in `handleExitConfirm`), so an abandoned round shows
PLAY on `LevelsPage`; the key survives only F5 / refresh / browser Back within
the tab.

## Security note (out of scope here)
Session storage persists per *tab*; it never crosses users (same-origin/tab-isolated).
It only stores in-progress counters, not auth tokens.
