# Conventions

> Version 1.1

## PHP / Laravel

- Laravel naming: snake_case tables, camelCase methods, singular models.
- One responsibility per method.
- Comments explain _why_, not _what_.
- Reusable logic in Services, not Controllers.
- Validation: inline `$request->validate()` in controllers (not Form Requests).
- Auth: middleware-based (`EnsureUserRole`), no Policy files.

## React / Inertia

- Plain JSX, functional components.
- Local state (`useState`). No global state.
- Reuse from `resources/js/Components/`.
- Pages: `resources/js/Pages/{Student,Teacher,Auth}/`.
- Hooks: `resources/js/hooks/`.
- Forms: `router.post` / `router.put`.

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
