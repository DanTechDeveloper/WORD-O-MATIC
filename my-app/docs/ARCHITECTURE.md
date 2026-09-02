# Architecture

> Version 1.9

## Backend

| Layer | Role |
|---|---|
| Controllers | `UserController`, `StudentController`, `TeacherController`, `ReportController` — thin, delegate to services |
| Services | `ProgressService`, `BadgeService`, `LevelService`, `ReportService` |
| Middleware | `HandleInertiaRequests` (global data), `EnsureUserRole` (role gate), `CheckStudentOnboarding` (avatar) |
| Models | 14 Eloquent models — `StudentProfile` exposes an appended `finalAverage` accessor (`round((wb+sq)/2, 2)`, null when either accuracy is 0, mirroring `ProgressService::finalAverage`) |
| Validation | Inline `$request->validate()` in controllers |
| Auth | Middleware-based (`role:teacher` / `role:student`), no Policy files |
| Notifications | Laravel Mail queued (`Mail::to()->queue()`) |

## Frontend

| Layer | Detail |
|---|---|
| Framework | React 18 + Inertia.js v2 |
| Build | Vite 8 (`@vitejs/plugin-react`, `laravel-vite-plugin`) |
| CSS | Tailwind 3 (`@tailwindcss/forms`) |
| Charts | Recharts 3.8 |
| HTTP | Inertia `router`/`useForm` for pages; axios for the 2 JSON mastery endpoints (`response()->noContent()`) |
| Audio | Client-side BGM + SFX in `resources/js/utils/sounds.js` — see GAMEPLAY.md §Audio |
| Pages | `resources/js/Pages/{Auth,Student,Teacher,Testing}/` |
| Components | `resources/js/Components/` |
| Hooks | `resources/js/hooks/` |

## Data Flow

```
Action → Controller → Service → Model → DB
                         ↓
HandleInertiaRequests::share() ← session flash + auth
                         ↓
              Inertia Response → React $page.props
```

Global props: `auth.user`, `flash.*`, `teacher` flags. Lazy-loaded closures, no extra queries unless accessed.
Axios JSON endpoints (mastery toggles) bypass Inertia and return `noContent()`.

## Key Decisions

| Decision | Rationale |
|---|---|
| Denormalized stats on `StudentProfile` | Avoid JOIN-heavy aggregations on dashboard |
| Best-score-only progress | Retries don't overwrite higher existing scores |
| Progress overwritten, not versioned | Only `game_sessions` is append-only |
| Morph map for modules | `'word' → WordModule`, `'paragraph' → ParagraphModule` |
| Queued email | Don't block response waiting for mail |
| Cascade deletes | All child tables cascade on `user_id` — delete user = clean slate |
| Random word order | `inRandomOrder()` per session in Read mode, prevents memorization |
| Mastery = explicit per-word toggle (storage) + sentence derived view for Story Quest | Auto-mastery removed; `updateWordMastery`/`updateParagraphMastery` via axios per word, `ParagraphModule::buildLevels` derives `sentence_stats{ sentence, mastery=sum(all words mastered), failed_attempts=sum(word)}` for teacher reporting (no `paragraph_sentences` table) — `StudentDetails` `SentenceChip`, email `trainingSentenceGroupsFrom` |
| PIN with hash only | `pin` is bcrypt-only and **reset-only** — teachers set a new PIN but can never read it back (`pin_plain` removed). Uniqueness via `pinIsTaken()` on `store()`/`updateStudent()`, scoped to same-name students (login resolves by name + PIN) so the bcrypt scan stays O(same-name count) |
| Rate-limited logins | `throttle:30,1` on student login, `throttle:5,1` on teacher login (brute-force mitigation) |
| Avatar follows gender, until customized | `updateStudent()` re-syncs the gender-default avatar only while it is still a placeholder (`/images/boy.svg` / `/images/girl.svg`); custom heroes are kept (gender and avatar decoupled) |
| Atomic bulk student creation | `storeBulk()` normalizes all rows → validates → one `DB::transaction`; a bad row rejects the whole batch (no partial rosters) |
| Separate modals per creation flow | `AddStudentModal` vs `BulkAddStudentModal` — distinct two-stage flows; each `useForm` gets its own error keys |
| PHP-side dup normalization | Case/whitespace-insensitive duplicate checks run in PHP (student IDs, word module words) because MySQL's ci collation differs from SQLite (tests). Word Blast dedup (`aggregateWordStats`) removed — 10 unique words/level, direct `word_stats` iteration |
| `has_progress` flag on word modules | `wordModules()` exposes whether any `StudentWordMastery` row exists → modal shows a progress-reset `confirm()` before editing |
| Progress writes clamped at the service | `ProgressService::updateModuleProgress` clamps `processed ≥ 0`, `smashed ≤ processed`, `accuracy ∈ [0,100]` — the single choke point every caller routes through, because controller per-field rules can't cover cross-field lies (`smashed = total, processed = 0` point-farm) |
| Zero-word module guard | A module with 0 words can never be `completed` (`$totalWords > 0`); paragraph content is validated non-empty at save so zero-word modules can't be created |
| `words_processed` bounded by the module | `finishRound` rejects `words_processed > totalPossible` (ValidationException) before logging — closes the literal `processed=999` vector; the targeted claim (`processed = total`) is a documented open risk (CAVEATS H2) |
| BGM autoplay workaround | BGM starts on the first interactive click on `/student` (browser autoplay policy); position persists to `sessionStorage.wordomaticBgm` on `pagehide` and resumes from there |
| Mic-live audio silence | Gameplay `ACTIVE` pauses BGM + sets `micLive`; while `micLive` no SFX/BGM-resume runs, so the mic never records playback (echo protection) |
| Badge-celebration silence | `BadgeUnlockModal` sets `bgmSilenced` and pauses BGM; BGM + tap sounds resume only on the last claimed badge |
| Two-tier click SFX | `data-sfx="major"` actions get a loud click + BGM duck; un-tagged interactive elements get a soft blip (vol 0.35, no duck). Default is soft — a forgotten tag fails safely |
| Numeric Final Average | Derived, not stored — `ProgressService::finalAverage()` (logical SOT) + `StudentProfile::finalAverage` accessor compute `(wb+sq)/2`, null until both skills started (mirrors `classify`), so a one-sided `(80+0)/2=40` never misleads. Surfaced across dashboard/students/leaderboards/reports/emails/Excel |

## Auth Flow

> The `CheckStudentOnboarding` middleware gates **only** the avatar step (rejects `/images/boy.svg` and `/images/girl.svg`) and additionally bounces avatar-complete students away from `splashScreen`/`avatarSelection` (no re-entry). Tutorial gating is not enforced by middleware.

```
Guest → Login → Student: 3-step onboarding (Splash → Avatar Selection → Tutorial) → Dashboard
                → Teacher: Dashboard (no onboarding)
```
