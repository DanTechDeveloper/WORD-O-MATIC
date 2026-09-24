# Gameplay

> Version 1.8

## Word Blast (Read Mode)

| Property | Value |
|---|---|
| Type | Reading with speech recognition |
| Timer | 60 seconds per session |
| Presentation | Words randomized per session (`inRandomOrder()`) |
| Scoring | Strict exact-only (`speechUtils.js` `isWordMatch` → normalize + `===`; any non-exact transcript is Wrong; words curated for transcript fidelity) |
| Accuracy | `words_smashed / total_words * 100` |
| Update rule | Only on new best score (retries don't lower existing score) |
| Mastery | Per-word: `mastered` or `training`, stored in `student_word_mastery` |
| Routes | `/student/gameplayReadMode/{level}`, `/student/readModeLevels` |

## Story Quest (Speak Mode)

| Property | Value |
|---|---|
| Type | Speaking with short sentences (2 per level, 3-5 words each, 81 total words) |
| Timer | 60 seconds per session |
| Presentation | Sentence-based, fixed word order |
| Scoring | SSOT `isWordMatch` (`speechUtils.js`): strict exact-only after normalize, sentence-aware (ordered two-pointer + exact split-stitch + filler skip). Both Word Blast and Story Quest use the same function. Any non-exact transcript surfaces as Wrong — scoring is objective, no close-enough. |
| Update rule | Only on new best score |
| Mastery | Sentence-based reporting — per-word storage `student_paragraph_mastery` but `ParagraphModule::buildLevels` derives `sentence_stats{ sentence, mastery=sum(all words mastered?mastered:training), failed_attempts=sum(word)}` via `sentencesFromContent` `(?<=[.!?])\s+`; teacher `StudentDetails` shows Reading Performance (whole sentence + RED per failed word + raw attempt counts, RECOVERED when later mastered) , sentence progress `mastered_sentences/total_sentences` (`ReportService::sentenceCurriculumPercent`). Gameplay is sentence-driven: `useStoryQuestEngine` verdict map (BLUE current / GREEN correct / RED wrong, highlight only) + per-sentence score + ONE `scoreRatio`-tiered feedback (`Excellent!` / `Nailed It!` / `Great!` / `Awesome!`, display `Sentence Score: X / Y`) + 3s break with the 60s timer running. |
| Streak | NONE in Story Quest — `finishRound` forces paragraph `streak=0`; streak badges (`on-fire`/`blazing-streak`/`unstoppable`) read Word Blast sessions only (`BadgeService::bestSessionMetric` + `badges()` scope `module_type=word`). |
| Session detail | `game_sessions.sentence_scores` JSON nullable — per-sentence scores for SQ results (`[3,4]`, sum === `score` validated); `NULL` for Word Blast; `score` stays the authoritative aggregate. |
| Routes | `/student/gameplaySpeakMode/{level}`, `/student/speakModeLevels` |

## Rules

- No speed mechanics.
- Modules sequential (level N must complete to unlock N+1).
- Game sessions logged to `game_sessions` (append-only).
- Progress overwritten on new best score only.
- Mastery toggles per word — mastered words can still appear in retries (spaced repetition).
- Completed modules are replayable for practice (results "Again" + level card "PLAY AGAIN"); retries never lower best scores or award extra points.
- Past the report deadline, rounds are practice: only the level-unlock status advances (`ProgressService::recordWordPracticeUnlock` / `recordParagraphPracticeUnlock`) so level N+1 still opens; scores, badges, points, and leaderboards stay frozen (see CAVEATS.md BF7).
- Direct URL access to a locked module (`gameplayReadMode/{level}`, `gameplaySpeakMode/{level}`) is blocked: `LevelService::isModuleAccessible()` redirects to the level-select page with a flash error.

## Tutorial

Dedicated tutorial modules (`is_tutorial=true`, `level=0`) seeded in `CurriculumSeeder`:
- **Word Blast tutorial**: 5 words (apple, banana, puppy, kitten, hamster) — no timer

- **Story Quest tutorial**: "A puppy naps. A hamster runs." — no timer
Tutorial plays bypass GameSession, mastery, points, leaderboard, and gameplay badge tracking.
Progress is saved but does not affect accuracy/status calculations on `students` table.
Onboarding shows GameResults once, on the completing tutorial finish (Word Blast finish
lands on the dashboard's next-tutorial card instead). Tutorial Complete badge flashes
on Dashboard when both modes finished.

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

Recognition uses **Deepgram streaming ASR** (`useDeepgramRecognition.js`, model `nova-3`); the pure transcript-processing logic (SSOT `isWordMatch` — strict exact-only after normalize, sentence-aware via ordered two-pointer + exact split-stitch + filler skip; timeout arming, `graceEnd`) lives in `speechProcessors.js` and is driven by Deepgram events. A browser token is fetched from `StudentController::deepgramToken()`.

### Timeout Rules

| Mode | Timeout Behavior |
|---|---|
| **Word Mode** | After speech settles on a non-exact transcript (no new result for 1200ms), the word is marked mispronounced — no fixed wait. `is_final`/low-conf wrong still settles; authoritative wrong at `≥0.6` fires immediately (1000ms post-switch guard so a fast correct wins). A 5s `armWordTimeout` remains as the pure no-speech fallback (arms once per target, never races a pending settle). A 50ms `graceEnd` guard after a word switch suppresses stray Wrong verdicts only — a fast correct still wins inside it. |
| **Sentence Mode** | If no speech is detected for 5 **continuous** seconds (silence watchdog), the sentence is marked as mispronounced. The watchdog tracks `lastSpeechAt` (wordless finals don't re-base it), which is re-based to ACTIVE at game start so countdown silence isn't counted. A non-empty full-length transcript where the SSOT `isWordMatch` (strict exact-only, sentence-aware) fails also mispronounces, after a 500ms `graceEnd` guard — but a partial/empty authoritative final (mid-sentence pause endpointing) defers to the watchdog instead of failing the reader. The match transcript (`full`) is taken from the latest cumulative interim when present, else the accumulated finals — Deepgram partials are cumulative, so stacking them double-counts words (BF28). |

### Timer Synchronization

All speech recognition timeouts are owned by `speechProcessors.js` and validate the target via `timeoutRefs.target` (stored at arm time; only fires if it still matches the current `targetWord`):
 - **`armSentenceTimeout`**: 1s self-rescheduling silence watchdog (fires `onMispronounced` at `>=5s` of continuous silence via `lastSpeechAt`). Re-based at ACTIVE so the countdown pre-warm silence isn't miscounted.
 - **`armWordTimeout` (5000ms)**: per-word pure no-speech fallback, armed once per target (hook re-arms on `targetWord` change; never races a pending settle via the `!wordSettle` guard).
 - **`wordSettle` (1200ms)**: fires mispronounce once speech settles on a non-matching transcript (re-arms on every interim, so slow readers get pause tolerance; independent of `is_final` — Deepgram finals for low-confidence/wrong words often arrive with empty transcripts and were previously dropped, leaving only the 5s fallback).
 - **`graceEnd` (500ms sentence / 50ms word)**: wrong verdicts only — a fast correct still wins inside the window (word 50ms absorbs re-render tick, sentence 500ms).
 - **Buffered sentence batch (Story Quest, Option B)**: when the whole sentence is already in `transcript+interim` (`useDeepgramRecognition.js` `snapshotRef` + `useGameplayEngine.js` `tryConsumeBufferedWords`), the engine auto-advances remaining words with a **90ms stagger** and a **unified 600ms dismiss** for `PRONOUNCED`/`MISPRONOUNCED` + streak + `+1` points, so feedback stays sabay even on fluent reads (`GameplaySpeakMode.jsx` `snapshotRef`). Falls back to the 500ms per-word `moveToNextWord` when no buffer.

This prevents race conditions where:
1. User speaks but doesn't complete the word/sentence within the timeout
2. The timeout fires → `onMispronounced` → `handleMispronounce()` → `moveToNextWord()`
3. Target word changes, but a pending timer armed for the old target would fire with a stale transcript — the `timeoutRefs.target` check ignores it

### Mic Gating During Feedback (echo protection)

Mode-aware `isActive` gate in the two gameplay pages:

| Mode | isActive | Why |
|---|---|---|
| Word Blast (read) | `gameState === "ACTIVE" && !isExploding` | Mic is muted via the Deepgram `muted` prop during the 500ms blast window after a correct match (set before `playSuccessSound`, so echo feedback can't exactly match the short target word). The word changes instantly; a ~900ms utterance-settle timer + 5s `armWordTimeout` fallback in the hook (re-armed on every recognized transcript) catch wrong/silent speech. |
| Story Quest (speak) | `gameState === "ACTIVE"` only | Mic stays live continuously — students read sentences back-to-back; stopping would clip the head of the next utterance. Full-sentence matching (full transcript, word count equality) makes feedback-echo mis-recapture negligible. |

## Results

Route: `/student/results/{id}`. Shows a scorecard, headline, call-to-action row, and badges. The id is not addressable history — a stale id (anything but the student's newest session) redirects to the newest round's results; foreign sessions redirect to the dashboard ("Access denied"). Tutorial results render once per onboarding, on the completing finish — any earlier tutorial finish redirects to the dashboard instead, and direct visits to a non-completing tutorial session bounce to the dashboard while onboarding is incomplete (post-onboarding replays still render).

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
