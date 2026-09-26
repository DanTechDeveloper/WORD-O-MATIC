# Word-O-Matic — Agent Guide

Runnable app is `my-app/` — `cd my-app` before every command. Repo root also holds `README.md`, `.github/workflows/ci.yml`, `kilo.json`, `vercel.json`, `opencode.json`. OpenCode commands live in `my-app/.opencode/commands/`; deeper docs in `my-app/docs/` (`AGENTS.md` developer guide, `DESIGN.md` + `PRODUCT.md`, `MODULES.md`, `CAVEATS.md`, `CONVENTIONS.md`). **This file is read by both `opencode.json` and `kilo.json` — keep it tool-neutral.**

## Stack
Laravel 13 (PHP 8.3) + React 18 + Inertia v2 + Vite 8 + Tailwind v3. MySQL local, SQLite `:memory:` for tests. Session auth via `UserController`; `role:teacher`/`role:student` aliases in `bootstrap/app.php`. Vercel Container `dunglas/frankenphp` + Aiven MySQL, Deepgram `au` nova-3.

ASR truth: `hooks/Student/useDeepgramRecognition.js` → `lib/speechProcessors.js` (no `useSpeechRecognition.js` file exists) → SSOT `isWordMatch` (`lib/speechUtils.js`, strict exact-only after normalize — no Levenshtein, non-exact is Wrong). **Exact match accepts at any confidence; confidence gates only the Wrong path** (authoritative-wrong `≥0.6`; sentence mode ignores confidence). There is no interim 0.7 gate.

## Commands (from `my-app/`)
| Command | What it does |
|---|---|
| `composer run setup` | install → `.env` → key → migrate → `npm install` → `npm run build` |
| `composer run dev` | 4 procs: `serve`, `queue:listen --tries=1 --timeout=0`, `pail`, `npm run dev` |
| `composer run test` | **PHP only** — `config:clear` + `php artisan test` |
| `npm run test` | `vitest run` (JS only) — same as `npx vitest run` |
| `php artisan test --filter=TestName` | Single PHP test |
| `php artisan migrate:fresh --seed` | teacher `admin`/`password` + curriculum + badges + **100 students / 3 sectors**. `StudentSeeder` is **live** in `DatabaseSeeder` and is **MySQL-only** (`SET FOREIGN_KEY_CHECKS=0`) — `--seed` fails on SQLite |
| `npm run build` / `npm run dev` | Vite build / dev |
| `vendor/bin/pint` | PSR-12 fix (not in CI) |

## What not to assume
- **`composer run test` does not run vitest.** PHP and JS are separate gates; run both. CI does the same — `.github/workflows/ci.yml` is at the repo **root** with `working-directory: my-app`.
- **Tests never touch MySQL.** `phpunit.xml` forces `sqlite` `:memory:`, `array` mail/cache/session, but `QUEUE_CONNECTION=sync`.
- **`vitest.config.js` defaults to `environment: "node"`** and excludes `tests/Feature/`. A file opts into a DOM with a first-line `// @vitest-environment happy-dom`. **This is why every connectivity guard reads `navigator.onLine === false`, never `!`** — it is `undefined` under node, so a truthiness check fails the wrong way.
- **No lint/typecheck script.** `composer.json` has only setup/dev/test.
- **`edit` is `ask`.** `opencode.json` and `kilo.json` both set `edit: ask`, `bash: *:ask`. Allow-list: `composer *`, `npm *`, `bun *`, `php artisan test|route:list`, `git status|diff|log`. `migrate*` + `db:*` + `git commit|push` are `ask`.
- **Audio assets are load-bearing and git-tracked**: `public/pcm-processor.js` and `public/rnnoise/{rnnoise.wasm,rnnoise.worklet.js}`. If the worklet 404s, `addModule` throws and the code **silently** falls back to `createScriptProcessor(4096)` — 85ms frames instead of 2.67ms — which silently changes every frame-rate-dependent constant in `audioGate.js`.
- **The room is ~40 children sharing devices.** Background *chatter*, not hiss, is the dominant ASR problem; that is why AGC is off and `audioGate.js`'s near-field gate exists. No denoiser separates speakers — the gate is the only separator, and its limit is that a scalar energy gate cannot tell a loud room from a close talker. See `docs/CAVEATS.md`.
- `.editorconfig`: 4-space, LF, final newline, trim trailing whitespace — **except `yml`/`yaml` at 2**.

## Auth & onboarding
- Teacher `GET/POST /teacher/login` → `UserController@teacherLoginPost`, `username`+`password`, `throttle:5,1`.
- Student `GET /` → `name` + 4-digit PIN `throttle:30,1`, bcrypt-only `pin` (`$hidden`), reset-only; `EditStudentModal` blank = keep, `TeacherController::pinIsTaken()` checks same-name only.
- `EnsureUserRole` alias `role`; `CheckStudentOnboarding` gates `/student/*` on a non-default avatar (`/images/boy.svg`/`girl.svg` → `student.splashScreen`, no re-entry). Tutorial flow is unguarded.

## Gotchas — would miss without help
- **Mass-assignment drops silently.** New column: migration → `$fillable` → controller response array (`report_sent_at` bug).
- **Denormalized `students` table** (`points`, `wordBlastAcc`, `storyQuestAcc`, `status`, `read_level`, `speak_level`) is the read source for `TeacherController::dashboard()` — not the progress tables.
- **Best-score-only.** `ProgressService` never overwrites with a worse play; `classify(wordBlastAcc, storyQuestAcc, wordStarted, storyStarted)` + `finalAverage` are the single SOT (BF26 `started = accuracy>0 OR progress row`); vocab is DB `support`.
- **Tutorial never scores.** `is_tutorial` plays early-return, `finishRound` drops the flag after `tutorial_completed_at`, recompute sums exclude tutorial rows (BF24); module `level` is `min:1` (0 is tutorial, BF23).
- **Nothing blocks a 0-smashed round.** `StudentController` rejects `words_processed > totalPossible`, but a round that starts offline still banks a junk 0-score `GameSession`. `handleMicrophoneClick` refuses the start; `useGameplayCore` writes a durable `sessionStorage` commit that replays later. See `docs/CAVEATS.md`.
- **`useForm.post(url, options)` sends the form's own `setData` state** — options are callbacks, not a payload (bulk-add bug sent `{}`).
- **Tokens only.** `tailwind.config.js` Tactile Arcade (`action #a3e635`, `indigo-void #0c0c1f`, hard offset shadows). No `zinc-*`/`slate-*`/`purple-*`.
- **Word/paragraph edit rules** (10 required slots `max:20` uppercase, no intra-dup, no cross-level reuse incl. tutorial, `has_progress` → `confirm()`, zero-word never completes) → `docs/MODULES.md`. **Progress clamping** → `docs/CAVEATS.md` H2.
- **Audio:** `resources/js/utils/sounds.js` via `app.jsx` once; BGM on the first `/student` click, `sessionStorage.wordomaticBgm`, pauses on the `ACTIVE` mic. `data-sfx="major"` = loud+duck, else soft blip (200ms debounce). Never `new Audio()` inline; never shadow the `duck` helper (`duck: shouldDuck`, BF19).
- **Frontend:** Pages `./Pages/{name}.jsx`, `@` = `resources/js`. Inline `$request->validate()`, no Form Requests/Policies.

## Workflow
- Services in `app/Services/` (`ProgressService`, `BadgeService`, `LevelService`); `GameSession::logSession()` is a model static.
- Commits are conventional: `fix:`, `feat(speech):`, `test:`, `refactor:`.
- 3-step close: files changed / what changed / untouched / follow-up. Don't touch unrelated code.
- 4-space indent, comments explain *why*.

## Tests
- `tests/Feature/*` + `tests/Unit/*` (PHP, `RefreshDatabase`); `tests/Unit/*.test.js` (setup `tests/setup.js`, vitest 4).
- Single JS file: `npx vitest run tests/Unit/<name>.test.js`.
- `IndexesExistTest` needs real MySQL 8.4 — CI Branch C only, never SQLite.
- `/verify` (in `my-app/.opencode/commands/verify.md`) runs every local CI gate in order: `php artisan test` → `npx vitest run` → Caddy `immutable` grep.
