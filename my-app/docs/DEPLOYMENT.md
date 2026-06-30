# Deployment

> Version 1.0

## Requirements

PHP 8.3+, Laravel 13.8+, Node.js, MySQL, Composer.

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

## Production

```bash
composer install --optimize-autoloader --no-dev
npm install && npm run build
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

## Checks

- Run `php artisan test` before deploy.
- Never migrate without confirmation in production.
- HTTPS forced via `AppServiceProvider`.

## Platform

Railway production workflow.
