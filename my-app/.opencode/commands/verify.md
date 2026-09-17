---

description: Run the full local verification suite — PHP tests, JS tests, Caddy smoke
---

# /verify

Run every locally-runnable CI gate from `my-app/`, in order. Stop at the first failure; fix before continuing.

```bash
cd my-app
php artisan test
npx vitest run
grep -q 'immutable' Caddyfile && echo "Caddy immutable OK"
```

Notes:

- `composer run test` is PHP-only (`config:clear` + `php artisan test`) — it does not run vitest. Always run both.
- `IndexesExistTest` needs MySQL 8.4 (CI Branch C). Do not run it against SQLite or production; it runs in CI on every push/PR.

See `AGENTS.md` (root) for stack constraints and `.opencode/commands/pm.md` for planning.
