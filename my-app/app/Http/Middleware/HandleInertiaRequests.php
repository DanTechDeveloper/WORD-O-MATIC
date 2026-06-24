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
            
            'auth' => [
                'user' => fn () => $request->user() ? $request->user()->load(['student' => function ($query) {
                    $query->select('id', 'user_id', 'points', 'avatar');
            }]) : null,
            ],
            
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'new_badge' => fn () => $request->session()->get('new_badge'),
                'sent' => fn () => $request->session()->get('sent'),
                'failed' => fn () => $request->session()->get('failed'),
            ],
        ];
    }
}