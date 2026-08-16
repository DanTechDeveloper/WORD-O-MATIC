# Gameplay

> Version 1.5

## Word Blast (Read Mode)

| Property | Value |
|---|---|
| Type | Reading with speech recognition |
| Timer | 60 seconds per session |
| Presentation | Words randomized per session (`inRandomOrder()`) |
| Scoring | Tolerance-bucketed Levenshtein fuzzy match (`speechUtils.js` `isFuzzyMatch`, wraps `standardLevenshtein`) |
| Accuracy | `words_smashed / total_words * 100` |
| Update rule | Only on new best score (retries don't lower existing score) |
| Mastery | Per-word: `mastered` or `training`, stored in `student_word_mastery` |
| Routes | `/student/gameplayReadMode/{level}`, `/student/readModeLevels` |

## Story Quest (Speak Mode)

| Property | Value |
|---|---|
| Type | Speaking with paragraph content |
| Timer | 60 seconds per session |
| Presentation | Sentence-based, fixed word order |
| Scoring | Speech recognition accuracy per word |
| Update rule | Only on new best score |
| Mastery | Per-word: `mastered` or `training`, stored in `student_paragraph_mastery` |
| Routes | `/student/gameplaySpeakMode/{level}`, `/student/speakModeLevels` |

## Rules

- No speed mechanics.
- Modules sequential (level N must complete to unlock N+1).
- Game sessions logged to `game_sessions` (append-only).
- Progress overwritten on new best score only.
- Mastery toggles per word — mastered words can still appear in retries (spaced repetition).
- Completed modules are replayable for practice (results "Again" + level card "PLAY AGAIN"); retries never lower best scores or award extra points.
- Direct URL access to a locked module (`gameplayReadMode/{level}`, `gameplaySpeakMode/{level}`) is blocked: `LevelService::isModuleAccessible()` redirects to the level-select page with a flash error.

## Tutorial

Dedicated tutorial modules (`is_tutorial=true`, `level=0`) seeded in `CurriculumSeeder`:
- **Word Blast tutorial**: 5 words (a, I, see, my, the) — no timer
- **Story Quest tutorial**: "I see a cat." — no timer

Tutorial plays bypass GameSession, mastery, points, leaderboard, and gameplay badge tracking.
Progress is saved but does not affect accuracy/status calculations on `students` table.
Tutorial Complete badge flashes on Dashboard when both modes finished.

## Speech Recognition Timeout Rules

Timeouts are centralized in `useSpeechRecognition.js`: Word Blast (read mode) uses a 3-second per-word timeout, Story Quest (speak mode) a 5-second per-sentence timeout:

| Mode | Timeout Behavior |
|---|---|
| **Word Mode** | If no word match is detected within 3 seconds of word display, the word is marked as mispronounced and advances to the next word. A transcript that finalizes without matching also mispronounces immediately — no delay. |
| **Sentence Mode** | If no sentence match is detected within 5 seconds of sentence display, the sentence is marked as mispronounced. A full-length transcript that doesn't fuzzy-match also mispronounces, after a 500ms `graceEnd` guard (short feedback echoes inside the guard window are ignored). |

### Timer Synchronization

All speech recognition timeouts are owned by `useSpeechRecognition.js` and validate the target word via `timeoutRefs.target` (stored at arm time; only fires if it still matches the current `targetWord`):
- **`armSentenceTimeout` (5000ms)**: per-sentence fallback, re-armed on every transcript result
- **`armWordTimeout` (3000ms)**: per-word fallback, re-armed on every transcript result and on `targetWord` change
- **`graceEnd` (500ms, sentence mode)**: grace window before a full-length mismatch is judged mispronounced

This prevents race conditions where:
1. User speaks but doesn't complete the word/sentence within the timeout
2. The timeout fires → `onMispronounced` → `handleMispronounce()` → `moveToNextWord()`
3. Target word changes, but a pending timer armed for the old target would fire with a stale transcript — the `timeoutRefs.target` check ignores it

### Mic Gating During Feedback (echo protection)

Mode-aware `isActive` gate in the two gameplay pages:

| Mode | isActive | Why |
|---|---|---|
| Word Blast (read) | `gameState === "ACTIVE" && !isExploding` | Mic closes only for the 500ms blast window after a correct match (echo feedback there can't fuzzy-match the short target word). The word changes instantly (no fade-in prep window); a 3s `armWordTimeout` in the hook (re-armed on every recognized transcript) catches silence. |
| Story Quest (speak) | `gameState === "ACTIVE"` only | Mic stays live continuously — students read sentences back-to-back; stopping would clip the head of the next utterance. Full-sentence matching (full transcript, word count equality) makes feedback-echo mis-recapture negligible. |

## Results

Route: `/student/results/{id}`. Shows a scorecard, headline, call-to-action row, and badges.

**Scorecard** — two tiles: Score ("Score" label, or **"You played"** when the round was deadline-hit) and Words (item count). On a deadline-hit round a "Points not counted — deadline passed" note and an amber DeadlineBanner are shown; NextBadge is hidden.

**Headline** (h1) — fixed `TIME'S UP!` when the round was played after the deadline; `PERFECT!` at 100% accuracy; otherwise a motivational, deterministic pick from four accuracy bands. Low / zero scores never scold (e.g. "YOU GOT THIS!"). Selection is stable per session keyed on `session.id % pool.length` (no math in render, no useMemo).

**Celebration** — confetti overlay fires only when `accuracy >= 80%`.

**Call-to-action row** depends on state:

| State | Buttons |
|---|---|
| Game closed (`isDeadlineClosed`) | Home |
| Max level reached | Again · Home |
| Normal | Again · Next Level · Home |

**Again** is an Inertia `<Link>` (SPA navigation, not a page reload) so the BGM and
click sound survive the transition; a fresh round mounts because the resume session
is cleared at COMPLETED/GAMEOVER.

## Audio & Sound Effects

Client-side system in `resources/js/utils/sounds.js`, wired once in `app.jsx` via
`initStudentAudio()`.

- **BGM** (`BackgroundMusic.opus`, loop, vol 0.5) starts on the first interactive
  click on `/student` (browser autoplay policy). Position persists to
  `sessionStorage.wordomaticBgm` on `pagehide` and resumes from there on the next
  click after a reload. Any tap on `/student` resumes it (single choke point:
  the global click listener).
- **Duck** — SFX duck the BGM to 0.12 for 500ms (restore to 0.5).
- **Mic-live silence** — gameplay `ACTIVE` pauses BGM + sets `micLive`
  (`GameplayReadMode.jsx` / `GameplaySpeakMode.jsx`); while `micLive`, no SFX and
  no BGM resume, so the mic never records playback. BGM stays paused through
  results; a tap on results resumes it.
- **Badge-celebration silence** — `BadgeUnlockModal` sets `bgmSilenced` and
  pauses BGM; the fanfare plays per claimed badge; BGM + tap sounds return only
  on the last claimed badge (modal unmount).
- **Two-tier click SFX** — every `a, button, [role=button]` on `/student` gets a
  blip. Real commit actions are tagged `data-sfx="major"` (loud double-play +
  duck: Splash Play, avatar "THIS ONE!", dashboard mode cards, `LevelCard`,
  results Again/Next Level); everything else gets a soft blip (vol 0.35, no
  duck). Shared 200ms debounce — a double-click plays once.
- **Gameplay feedback** — `playSuccessSound` / `playMispronounceSound` /
  `playFeedbackSound` still duck the BGM.
