<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    /**
     * The root template that is loaded on the first page visit.
     *
     * @var string
     */
    protected $rootView = 'app';

    /**
     * Determine the current asset version.
     */
    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    /**
     * Define the props that are shared by default.
     *
     * @return array<string, mixed>
     */
    public function share(Request $request): array
    {
        return [
            ...parent::share($request),
            
            // 🔥 BINAGO: Ginawang closure (fn) para maging lazy-loaded ang database query sa cloud
            'auth' => [
                'user' => fn () => $request->user() ? $request->user()->load(['student' => function ($query) {
                    $query->select('id', 'user_id', 'points', 'avatar');
            }]) : null,
            ],
            
            // 🔥 BINAGO: Ginawang closure din ang mga flash sessions para hindi laging binabasa ang session store sa bawat click
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'new_badge' => fn () => $request->session()->get('new_badge'),
            ],
        ];
    }
}