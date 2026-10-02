---
name: schema-change
description: Use when a task adds or alters a database column, index, table, or migration — $fillable, casts, mass-assignment, SHOW INDEX, IndexesExistTest, migrate, database/migrations. Read before writing or reviewing any migration, because dropping one link in the chain breaks the feature silently.
---

# Schema change

Every migration must satisfy three independent consumers. Missing any one is a
**silent** failure — the column exists, the query runs, the value is just
always `null`.

## The chain — all three, every time

1. **Migration** in `database/migrations/`
2. **`$fillable`** on the model — or `update()`/`create()` silently drops it
3. **Controller response array** — hand-built arrays in the controller, so a
   new field that is not added simply never reaches the page

Worked example of the failure, `report_sent_at`:

| Link | Location |
|---|---|
| Migration | `2026_07_08_000001_add_report_sent_at_to_students.php` |
| `$fillable` | `app/Models/StudentProfile.php:33` |
| Response array | `app/Http/Controllers/ReportController.php:41` and `:232` |

Then the **client** reads it too (`Pages/Teacher/Reports.jsx:255-259`). A new
teacher-visible field is a four-link change, not a two-link one.

Also add `$casts` when the column is a date/bool/json — 14 of 15 models declare
`fillable`/`guarded`/`casts`.

## Conventions

- Anonymous class: `return new class extends Migration`, and **`down()` is
  mandatory** — all 42 existing migrations have one.
- Name indexes explicitly (`'swp_user_module_index'`) so `dropIndex` works in
  `down()`. Auto-named indexes make rollbacks fail.
- Prefer `index` over `unique` when historic duplicates may exist — same read
  performance, safe to apply.
- `composer run setup` runs `migrate --force` and **never seeds**. Production
  does not seed.

## MySQL vs SQLite — the real trap

| Context | DB | Consequence |
|---|---|---|
| `php artisan test` | SQLite `:memory:` | index existence **cannot** be checked |
| CI Branch C | MySQL 8.4 | the only place `SHOW INDEX` is verified |
| `.env` (local) | MySQL `word-o-matic` | `migrate:*` / `db:*` touch **real data** |
| `--seed` | MySQL only | `StudentSeeder` runs `SET FOREIGN_KEY_CHECKS=0`; **`--seed` fails on SQLite** |

`IndexesExistTest` self-skips when the driver is not MySQL. So **a green local
test run proves nothing about a new index.** Push or run CI to verify it.

`phpunit.xml` forces `sqlite` `:memory:` for `php artisan test` only — it does
not help `migrate:*` outside the test runner.

## New index checklist

1. Migration with an explicit name + `down()`.
2. Add the assertion to `tests/Feature/IndexesExistTest.php` (`SHOW INDEX`).
3. Verify against MySQL: `php artisan test --filter=IndexesExistTest` — only
   meaningful with a MySQL connection; otherwise it silently skips.

Index work targets the `finishRound` hot path (`ProgressService`) and the
results queries. Check `docs/CAVEATS.md` before adding one — the ceiling and
the query it serves are both recorded there.

## Verify

```bash
php artisan test                              # SQLite — logic only
npm run build                                 # if a client field changed
```

Schema-changing and `db:*` commands are permission-gated `ask` in
`opencode.json`, and migrations against live data need explicit confirmation
before running.