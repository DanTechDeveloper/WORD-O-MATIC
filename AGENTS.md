
# Word-O-Matic — Agent Guide

Runnable app is `my-app/` — `cd my-app` before every command. Repo root holds only `opencode.json`, `.opencode/`, docs. Deeper: `my-app/docs/AGENTS.md`, `CONVENTIONS.md`, `DESIGN.md` + `PRODUCT.md`.

## Stack
Laravel 13 (PHP 8.3) + React 18 + Inertia v2 + Vite 8 + Tailwind v3. MySQL local, SQLite `:memory:` for tests (`phpunit.xml`). Session auth via `UserController`, `role:teacher`/`role:student` in `bootstrap/app.php`. Vercel Container `dunglas/frankenphp` + Aiven MySQL, Deepgram `au` nova-3 (`useDeepgramRecognition.js`).

## Commands (run from `my-app/`)
| Command | What it does |
|---|---|
| `composer run setup` | install → `.env` → key → migrate → `npm install` → `npm run build` |
| `composer run dev` | 4 procs: `serve`, `queue:listen --tries=1 --timeout=0`, `pail`, `npm run dev` |
| `composer run test` | `config:clear` then `php artisan test` (PHP only) |
| `npx vitest run` | JS unit tests (`tests/Unit/*.test.js`) — not in `composer run test` |
| `php artisan test --filter=TestName` | Single test |
| `php artisan migrate:fresh --seed` | 1 teacher `admin`/`password` + 100 students (3 sectors) |
| `npm run build` / `npm run dev` | Vite build / dev |
| `vendor/bin/pint` | PSR-12 fix (not in CI) |

## What not to assume
- **Tests never touch MySQL.** `phpunit.xml` forces `sqlite` `:memory:`, `array` mail/queue/cache/session.
- **CI runs PHP + JS + Caddy + MySQL.** `.github/workflows/ci.yml` from `my-app/`: `php artisan test`, `npx vitest run`, `grep immutable Caddyfile`, `IndexesExistTest` on MySQL 8.4. Live Aiven migration is `workflow_dispatch` manual only.
- **No lint/typecheck script.** `composer.json` has only setup/dev/test.
- **`edit` is `ask`.** `opencode.json` sets `edit: ask`, `bash: *:ask`. Allow-list: `composer *`, `npm *`, `bun *`, `php artisan test|route:list`, `git status|diff|log`. `migrate*` + `db:*` + `git commit|push` are `ask`.

## Auth & onboarding
- Teacher `GET/POST /teacher/login` → `UserController@teacherLoginPost` `username`+`password`, `throttle:5,1`.
- Student `GET /` → `name` + 4-digit PIN `throttle:30,1`, bcrypt-only `pin` (`$hidden`) reset-only; `EditStudentModal` blank = keep, `TeacherController::pinIsTaken()` checks same-name only.
- `EnsureUserRole` alias `role`, `CheckStudentOnboarding` gates `/student/*` on non-default avatar (`/images/boy.svg`/`girl.svg` → `student.splashScreen`, no re-entry); tutorial flow unguarded.

## Gotchas — would miss without help
- **Mass-assignment drops silently.** New column: migration → `$fillable` → controller response array (`report_sent_at` bug).
- **Denormalized `students` table** (`points`, `wordBlastAcc`, `storyQuestAcc`, `status`, `read_level`, `speak_level`) is the read source for `TeacherController::dashboard()`; not progress tables.
- **Best-score-only.** `ProgressService` never overwrites with worse play; `classify(wordBlastAcc, storyQuestAcc, wordStarted, storyStarted)` + `finalAverage` are the single SOT (BF26 `started = accuracy>0 OR progress row`), vocab is DB `support`.
- **Tutorial never scores.** `is_tutorial` plays early-return, `finishRound` drops flag after `tutorial_completed_at`, recompute sums exclude tutorial rows (BF24); module `level` `min:1` (0 is tutorial, BF23).
- **`useForm.post(url, options)` sends form's own `setData` state** — options are callbacks, not payload (bulk-add bug sent `{}`).
- **Tokens only.** `tailwind.config.js` Tactile Arcade (`action #a3e635`, `indigo-void #0c0c1f`, hard offset shadows). No `zinc-*`/`slate-*`/`purple-*`.
- **Word edits:** 10 slots all required `max:20` uppercase, no intra-dup, no cross-level reuse incl. tutorial, `has_progress` → `confirm()` (`docs/MODULES.md`).
- **Paragraph edits:** trimmed `required`, zero-word never completes (`$totalWords>0`), case-as-entered, `level min:1`.
- **Progress clamping:** `words_processed > total` rejected in `finishRound`; `ProgressService` clamps `processed≥0`, `smashed≤processed`, `accuracy 0-100` (CAVEATS H2 remains).
- **Audio:** `resources/js/utils/sounds.js` via `app.jsx` once; BGM on first `/student` click, `sessionStorage.wordomaticBgm`, pauses on `ACTIVE` mic. `data-sfx="major"` = loud+duck, else soft blip (200ms debounce). Never `new Audio()` inline; never shadow `duck` helper (`duck: shouldDuck`, BF19).
- **Frontend:** Pages `./Pages/{name}.jsx`, `@` = `resources/js`. Inline `$request->validate()`, no Form Requests/Policies.

## Workflow
- Services in `app/Services/` (`ProgressService`, `BadgeService`, `LevelService`); `GameSession::logSession()` is model static.
- 3-step close: files changed / what changed / untouched / follow-up. Don't touch unrelated code.
- 4-space indent (`.editorconfig`), comments explain *why*.

## Tests
- `tests/Feature/*` (`RefreshDatabase`), `tests/Unit/*` (PHP), `tests/Unit/*.test.js` + `setup.js` (vitest, 4.1).
