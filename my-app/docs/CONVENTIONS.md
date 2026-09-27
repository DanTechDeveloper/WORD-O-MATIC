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
- Connectivity is detected in exactly one place: `resources/js/utils/connection.js` (the store: `isReachable` / `reason` / `probe` / `markUnreachable`, no React, listeners registered once in `initConnection()`), read by `Components/Shared/OfflineGuard.jsx`, which is mounted once from `app.jsx` as a sibling of `<App/>` — so it covers student, teacher, and guest. Never re-add an offline check per page, and never in a controller. Never `navigator.onLine`: it reports only that the interface is up, so a captive portal or dead AP read as online. The guard itself must never **subscribe** to the store — it keeps `offline` as local state and reads the store for WHAT is wrong (copy, block decision) and WHETHER to block, never WHETHER to raise; a subscription would re-raise the modal on every failed mic-tap probe. It raises on exactly four things: mount while unreachable, the browser `offline` event, a blocked GET (`inertia:before`), and a dead request (`inertia:exception`). CANCEL dismisses and keeps the current screen — the guard has no Inertia import and never navigates (an offline `router.visit` fails silently), so onboarding/tutorial routing stays entirely in the controllers and `CheckStudentOnboarding`. CANCEL is a bare `setOffline(false)`: it does not probe and does not touch the store, so the next GET re-raises the modal. RETRY runs a real `probe()` and never reloads the page.
- **Polling is TEACHER-ONLY** — `hooks/Teacher/useLiveStats.js`, called from exactly five pages (`Dashboard`, `Students`, `StudentDetails`, `Leaderboards`, `Badges`). Students never poll: 40 kids on shared devices is a different cost shape than one teacher watching a dashboard, and the no-polling rule in `utils/connection.js` still stands for the student runtime. Never import the hook from a `hooks/Student/` or `Pages/Student/` file. A page opts in simply by calling it — **there is no runtime allowlist**, because an unmounted page costs nothing, which is why the hook lives in the page and not in `DashboardLayout`. Four rules, all load-bearing: it must use **raw `fetch`**, never `router.get` (which would replace page props and reset `DashboardLayout`'s `useEffect([searchResults])` → `setActiveIndex(-1)`, breaking the teacher search on every tick); it must gate on **`document.visibilityState`**, which is per-TAB so N open tabs still cost one poll; it must forward **`window.location.search`** rather than take params, so the live payload is filtered identically by construction; and the endpoint must stay **watermark-gated** so an unchanged tick is two cheap queries and a `{"changed":false}`, not a re-run of every aggregate. **A poll failure must never call `markUnreachable`** — that lock is what stops a teacher heartbeat from writing the student runtime's connection state, and the backoff (`10 → 20 → 40 → 60s`) is what lets it self-heal, because a server outage never fires the window `online` event. `markReachable()` **is** called on success, and that is the self-heal for a false positive from a genuine `inertia:exception`. Every page also passes `enabled: getDeadlineInfo(auth?.deadline).phase !== "closed"`, which reports `Final` and stops the poll — post-cutoff `saveWordProgress` writes no `GameSession` and no `students` row, so both watermark halves are frozen for good. That same gate excludes `Reports.jsx` for free.
- A fatal ASR error (Deepgram socket death) returns the round to IDLE via `refillRoundClock()` from `useGameplayCore` — never `setGameState("IDLE")` directly, or the Story Quest `verdicts` survive and every already-read sentence becomes a dead input. Always call `handleFatalError()` first (it persists the aborted round).
- Connectivity gating in `lib/speechProcessors.js` is **asymmetric**: gate the **watchdogs** (`armWordTimeout` / `armSentenceTimeout` — they report silence, and silence from a dead link is not the child's fault) and never gate the **speech-verdict** functions (`processWordModeResult` / `processSentenceModeResult` — they judge real speech, and an offline early-return there marks every child Wrong). Use `navigator.onLine === false`, never `!navigator.onLine` — it is `undefined` under Node/SSR and a truthiness test fails *closed* there.
- Offline gating of a **round start** lives in `handleMicrophoneClick` as a **silent** `if (!(await probeConnection())) return;`, never mid-round: an ACTIVE round has a real score banked and the child must keep seeing the current word. Use the store's imperative `probe()`, not the `online` state (state lags an event by a render) and not `navigator.onLine` (a link with no uplink reads as online). There is **no click-reaction channel** — the modal is not a reaction to a tap. Instead `useGameplayCore` owns the one `online`/`offline` subscription and feeds `offline={!online}` to `Microphone` and `noConnection={!online}` to `TapToStartOverlay`, so the kid reads "No Connection" **on the control he tapped**. Answering a play tap with a connection modal reads as a broken app. The one write the child can lose is the round save, and the guard's `inertia:exception` trigger covers it: that is a save, not a play tap, so a modal is the honest answer there. `TapToStartOverlay` is `pointer-events-none` — the `Microphone` is the single entry point, so no per-button wiring is needed. On the mic, `offline` outranks `disabled` ("Get Ready!" promises a countdown that offline will never run) and a mic that cannot work stops pulsing.

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
