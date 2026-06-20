<?php

namespace App\Providers;

use App\Models\ParagraphModule;
use App\Models\WordModule;
use Illuminate\Database\Eloquent\Relations\Relation;
use Illuminate\Support\Facades\Vite;
use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\URL;

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

        $this->registerMorphMaps();
        if (config('app.env') === 'production') {
            URL::forceScheme('https');
        }
    }

    /**
     * I-register ang morph maps para sa polymorphic relationships.
     */
    private function registerMorphMaps(): void
    {
        Relation::morphMap([
            'word' => WordModule::class,
            'paragraph' => ParagraphModule::class,
        ]);
    }
}
