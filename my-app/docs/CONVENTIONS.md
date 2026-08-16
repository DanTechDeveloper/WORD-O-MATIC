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
