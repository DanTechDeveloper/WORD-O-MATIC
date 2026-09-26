# Conventions

> Version 1.4

## PHP / Laravel

- Laravel naming: snake_case tables, camelCase methods, singular models.
- One responsibility per method.
- Comments explain _why_, not _what_.
- Reusable logic in Services, not Controllers.
- Validation: inline `$request->validate()` in controllers (not Form Requests).
- Auth: middleware-based (`EnsureUserRole`), no Policy files.
- Normalize before validate: trim/lowercase user input BEFORE `$request->validate()` so unique rules see the value that will actually be stored (e.g. student IDs, emails, word module words).
- Multi-row writes: normalize all rows → validate wildcard rules → one `DB::transaction` (atomic; no partial batches).
- Case-insensitive duplicate checks run in PHP, not DB collation — MySQL's ci collation differs from SQLite (tests).

## React / Inertia

- Plain JSX, functional components.
- Local state (`useState`). No global state.
- Reuse from `resources/js/Components/`.
- Pages: `resources/js/Pages/{Student,Teacher,Auth}/`.
- Hooks: `resources/js/hooks/`.
- Forms: `router.post` / `router.put` (Inertia), `useForm` for modals.
- `useForm.post(url, options)` sends the form's OWN data state — set it with `setData` before `post`; the options object is for callbacks only, never a payload.
- JSON endpoints (`/student/updateWordMastery`, `/student/updateParagraphMastery`): axios + `response()->noContent()`.
- Interactive elements on `/student` get an automatic click SFX (global listener in `initStudentAudio`). Tag real commit actions with `data-sfx="major"` (loud + BGM duck); un-tagged elements stay soft (vol 0.35, no duck). SFX via `utils/sounds.js` helpers, never `new Audio()` inline.
- Connectivity is detected in exactly one place: `Components/Shared/OfflineGuard.jsx`, mounted once from `app.jsx` (covers student, teacher, and guest). Never re-add an offline check per page. CANCEL dismisses and keeps the current screen — the guard has no Inertia import and never navigates (an offline `router.visit` fails silently), so onboarding/tutorial routing stays entirely in the controllers and `CheckStudentOnboarding`. RETRY re-reads the flag; it never reloads the page.
- A fatal ASR error (Deepgram socket death) returns the round to IDLE via `refillRoundClock()` from `useGameplayCore` — never `setGameState("IDLE")` directly, or the Story Quest `verdicts` survive and every already-read sentence becomes a dead input. Always call `handleFatalError()` first (it persists the aborted round).
- Connectivity gating in `lib/speechProcessors.js` is **asymmetric**: gate the **watchdogs** (`armWordTimeout` / `armSentenceTimeout` — they report silence, and silence from a dead link is not the child's fault) and never gate the **speech-verdict** functions (`processWordModeResult` / `processSentenceModeResult` — they judge real speech, and an offline early-return there marks every child Wrong). Use `navigator.onLine === false`, never `!navigator.onLine` — it is `undefined` under Node/SSR and a truthiness test fails *closed* there.
- Offline gating of a **round start** lives in `handleMicrophoneClick` as a **silent** `if (navigator.onLine === false) return;`, never mid-round: an ACTIVE round has a real score banked and the child must keep seeing the current word. There is **no click-reaction channel** — the modal is not a reaction to a tap. Instead `useGameplayCore` owns the one `online`/`offline` subscription and feeds `offline={!online}` to `Microphone` and `noConnection={!online}` to `TapToStartOverlay`, so the kid reads "No Connection" **on the control he tapped**. Answering a play tap with a connection modal reads as a broken app. `TapToStartOverlay` is `pointer-events-none` — the `Microphone` is the single entry point, so no per-button wiring is needed. On the mic, `offline` outranks `disabled` ("Get Ready!" promises a countdown that offline will never run) and a mic that cannot work stops pulsing.

## Files

- One responsibility per file.
- Models in `app/Models/`, controllers in `app/Http/Controllers/`, services in `app/Services/`.

## Database

- New field: migration → `$fillable` → controller response.
- Morph maps: `AppServiceProvider::boot()`.
- All foreign keys on `user_id` use `cascadeOnDelete`.

## Testing

- `RefreshDatabase`. SQLite in-memory. Mail driver: `array`.

## General

- Extend before create.
- After each task: list files changed + what changed + untouched + follow-up.
- Never name a destructured option after a module-level function — `playAudio(path, { duck })` shadowed the `duck()` helper and crashed every SFX call (`duck is not a function`). Rename the option (`duck: shouldDuck`).
