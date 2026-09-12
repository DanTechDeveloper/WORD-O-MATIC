# Deployment

> Version 1.3 — Vercel Container (FrankenPHP) + Aiven MySQL sfo (was Railway)

## Requirements

PHP 8.3+, Laravel 13.8+, Node.js 20+, MySQL 8.4, Composer. Prod uses `dunglas/frankenphp:1-php8.4-bookworm` + `Node 20` (Vite 8).

## Setup

```bash
cd my-app
composer install
npm install
cp .env.example .env
php artisan key:generate
php artisan migrate
php artisan db:seed
composer run dev
```

## Production — Vercel Container (FrankenPHP) + Aiven

Build is via `my-app/Dockerfile.vercel:1` (`dunglas/frankenphp:1-php8.4`, `install-php-extensions intl zip gd pdo_mysql pdo_pgsql bcmath`, Node 20 `vite build` `1.68s`, `my-app/Caddyfile:1` `root /app/public` + `@assets`/`@sfx` `immutable` `59de1b8`, `my-app/ca.pem` `5cf09a70` `sfo` `ssl-mode=REQUIRED`, `vercel.json:1` `root:"my-app"`, `trustProxies('*')` `my-app/bootstrap/app.php:18`).

Env on Vercel (`Production`): `APP_KEY` (with `base64:`), `DB_HOST=mysql-683a80a-dancedreck456-dead.k.aivencloud.com:12299`, `DB_DATABASE=defaultdb`, `DB_USERNAME=avnadmin`, `DB_PASSWORD` (Secret), `DB_CONNECTION=mysql`, `MYSQL_ATTR_SSL_CA=/app/ca.pem`, `APP_URL=https://word-o-matic.vercel.app`, `CACHE_STORE=array` (YAGNI for 100 rows, was `database` `5b38537`), `SESSION_DRIVER=cookie` (0 session queries), `QUEUE_CONNECTION=sync` (no worker on Hobby, `Mail::queue` runs inline), `DEEPGRAM_API_KEY` (`1b23cfe...` `au` region via `api.au.deepgram.com`), `MAIL_*` (`smtp.gmail.com:587` for `Reports` send).

```bash
composer install --optimize-autoloader --no-dev
npm install && npm run build
php artisan event:cache; php artisan view:cache
# config:cache / route:cache skipped — Vercel injects env at runtime (guide forbids)
```

## Queue Worker

`QUEUE_CONNECTION=sync` on Vercel Hobby (no long-running worker). `Mail::to()->queue()` runs inline via `sync`; `php artisan queue:work` only for local `database` queue.

## Checks

- Run `php artisan test` (333 passed) + `npx vitest run` (100 passed) before deploy.
- Never migrate without confirmation in production (`php artisan migrate --force` needs explicit `yes`).
- HTTPS forced via `AppServiceProvider:29` `URL::forceScheme('https')` when `APP_ENV=production`.

## Platform

Vercel Container production workflow (was Railway).

Live prod DB is **Aiven MySQL 8.4 `sfo` (San Francisco)** — `1 CPU / 1GB RAM / 1GB storage` free tier, `CA` `ca.pem` committed, `sfo` → `iad1` `70ms` per query. Push/PR runs end after `php artisan test` + `npx vitest run` + `Caddy` smoke + `MySQL` index tests (Branch C). Manual prod migration still via `workflow_dispatch` in `.github/workflows/ci.yml` but now for `Aiven` (was Railway `RAILWAY_DB_*`); set `DB_HOST` etc. to Aiven `Service URI` before dispatch. Indexes `students(status,section)` added `06b648f` (`43ms local, 1s sfo`) + `max_execution_time=60` in `Dockerfile.vercel:4` for `Report export` batched `f62b557` (`200→2 queries`).

> Version 1.3
