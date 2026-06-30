# Rules

> Version 1.0

## Code

- No comments. Explain _why_ only when necessary.
- Prefer extending existing implementations.
- Follow Laravel naming conventions.
- One responsibility per method and per file.
- Frontend: plain JSX, local state, reuse components.

## Architecture

- Thin controllers. Business logic in Services when reused.
- Validation: Form Requests. Authorization: Policies.
- Notifications: Laravel Notifications.
- `StudentProfile` stats denormalized — recalculated on new best score.
- Progress overwritten in place. Only `game_sessions` is append-only.

## Database

- New field: migration → `$fillable` → controller response array.
- Laravel migrations only. No raw SQL.
- Morph maps in `AppServiceProvider`: `'word' → WordModule`, `'paragraph' → ParagraphModule`.

## Testing

- `RefreshDatabase` trait — all tests in transactions.
- SQLite in-memory — no MySQL-specific features in tests.
- Mail driver: `array`.
- Run `php artisan test` before commit.

## Inertia

- Pages: `resources/js/Pages/{Student,Teacher}/`. Hooks: `resources/js/hooks/`. Components: `resources/js/Components/`.
- Form submissions: `router.post` / `router.put`.

## Reporting

- Deadline stored in `settings` table.
- Before deadline: checkboxes disabled, Send locked, deadline save locked.
- After deadline: all enabled.
