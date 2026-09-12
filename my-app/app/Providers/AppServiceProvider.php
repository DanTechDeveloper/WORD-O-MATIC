<?php

namespace App\Providers;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        Vite::prefetch(concurrency: 3);

        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }

        // ponytail: N+1 guard — localhost throws, prod logs only (avoid 500 but trace sfo→iad1). Triggers on $user->student without with().
        Model::preventLazyLoading(! $this->app->isProduction());
        Model::handleLazyLoadingViolationUsing(function ($model, $relation) {
            Log::warning("N+1 lazy load: {$model}::{$relation}");
        });

        if ($this->app->isProduction()) {
            \Illuminate\Support\Facades\DB::whenQueryingForLongerThan(500, function ($connection, $query) {
                Log::warning('Slow query >500ms', ['sql' => $query->sql, 'time' => $query->time]);
            });
        }
    }
}
