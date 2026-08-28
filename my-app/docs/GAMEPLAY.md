# Gameplay

> Version 1.6

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

### Guide gating (TAP TO CONTINUE before play)
The avatar guide board (`AvatarSpeechBubble`) must be completed — the student taps TAP TO
CONTINUE through every step — before the play action becomes available. Enforced as
`!isTutorial || guideDone` at every play entry point:
- **Dashboard** — the highlighted Play link is blocked (`blockTarget`) until `guideDone`.
- **LevelsPage** — the tutorial `LevelCard` is `disabled` via a `disabled` prop until `guideDone`.
- **Gameplay pages** — `handleMicrophoneClick` early-returns while `isTutorial && !guideDone`,
  so the mic can't start the round until the guide is finished (the `TapToStartOverlay` was
  already gated on `guideDone`).

### Mistake coach (cheer-only)
During tutorial gameplay, a mispronunciation shows a reusable `AvatarSpeechBubble` that
**cheers only** — no correction and no retry loop. `GameplayReadMode.jsx` /
`GameplaySpeakMode.jsx` hold a `coachActive` / `coachLeaving` state driven by the engine's
`isMispronounced` / `feedbackType`: the bubble appears on each mistake, **stays** through
repeated mistakes, and fades (300ms opacity transition) only when the word is hit correct.
Rendered `bottom-left`, no `onClick`. The engine, speech hook, and `MainContent` components
are untouched — the bubble is pure reuse. Non-tutorial sessions never render it.

### Completion congrats
After both modes are done, the "Tutorial Complete" badge flashes on the Dashboard
(`BadgeUnlockFlow`). When the student dismisses the last badge, `Dashboard.jsx` shows a
congratulations `AvatarSpeechBubble` ("YOU DID IT!"). Gated by the `tutorial-complete` badge
being in `flash.new_badges`, so it fires only at completion, not on later visits.

## Speech Recognition (Deepgram)

Recognition uses **Deepgram streaming ASR** (`useDeepgramRecognition.js`, model `nova-3`); the pure transcript-processing logic (fuzzy match, timeout arming, `graceEnd`) lives in `useSpeechRecognition.js` and is driven by Deepgram events. A browser token is fetched from `StudentController::deepgramToken()`.

### Timeout Rules

| Mode | Timeout Behavior |
|---|---|
| **Word Mode** | After speech settles on a transcript that doesn't fuzzy-match the target (no new result for ~900ms), the word is marked mispronounced immediately — no fixed wait. `is_final` is also a fast-path. A 5s `armWordTimeout` remains as the no-speech fallback (catches a silent student). A 500ms `graceEnd` guard after a word switch suppresses stray finals. |
| **Sentence Mode** | If no speech is detected for 5 **continuous** seconds (silence watchdog), the sentence is marked as mispronounced. The watchdog tracks `lastSpeechAt`, which is re-based to ACTIVE at game start so countdown silence isn't counted. A full-length transcript that doesn't fuzzy-match also mispronounces, after a 500ms `graceEnd` guard. The match transcript (`full`) is taken from the latest cumulative interim when present, else the accumulated finals — Deepgram partials are cumulative, so stacking them double-counts words (BF28). |

### Timer Synchronization

All speech recognition timeouts are owned by `useSpeechRecognition.js` (processors) and validate the target via `timeoutRefs.target` (stored at arm time; only fires if it still matches the current `targetWord`):
 - **`armSentenceTimeout`**: 1s self-rescheduling silence watchdog (fires `onMispronounced` at `>=5s` of continuous silence via `lastSpeechAt`). Re-based at ACTIVE so the countdown pre-warm silence isn't miscounted.
 - **`armWordTimeout` (5000ms)**: per-word no-speech fallback, re-armed on every transcript result and on `targetWord` change.
 - **`wordSettle` (~900ms)**: fires mispronounce once speech settles on a non-matching transcript (independent of `is_final` — Deepgram finals for low-confidence/wrong words often arrive with empty transcripts and were previously dropped, leaving only the 5s fallback).
 - **`graceEnd` (500ms, both modes)**: grace window after a target switch / before a full-length mismatch is judged mispronounced.

This prevents race conditions where:
1. User speaks but doesn't complete the word/sentence within the timeout
2. The timeout fires → `onMispronounced` → `handleMispronounce()` → `moveToNextWord()`
3. Target word changes, but a pending timer armed for the old target would fire with a stale transcript — the `timeoutRefs.target` check ignores it

### Mic Gating During Feedback (echo protection)

Mode-aware `isActive` gate in the two gameplay pages:

| Mode | isActive | Why |
|---|---|---|
| Word Blast (read) | `gameState === "ACTIVE" && !isExploding` | Mic is muted via the Deepgram `muted` prop during the 500ms blast window after a correct match (set before `playSuccessSound`, so echo feedback can't fuzzy-match the short target word). The word changes instantly; a ~900ms utterance-settle timer + 5s `armWordTimeout` fallback in the hook (re-armed on every recognized transcript) catch wrong/silent speech. |
| Story Quest (speak) | `gameState === "ACTIVE"` only | Mic stays live continuously — students read sentences back-to-back; stopping would clip the head of the next utterance. Full-sentence matching (full transcript, word count equality) makes feedback-echo mis-recapture negligible. |

## Results

Route: `/student/results/{id}`. Shows a scorecard, headline, call-to-action row, and badges. The id is not addressable history — a stale id (anything but the student's newest session) redirects to the newest round's results; foreign sessions redirect to the dashboard ("Access denied").

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
