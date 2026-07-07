<?php

namespace App\Http\Middleware;

use App\Models\Setting;
use App\Models\WordModule;
use App\Models\ParagraphModule;
use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

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
                'new_badges' => fn () => $request->session()->get('new_badges'),
                'sent' => fn () => $request->session()->get('sent'),
                'failed' => fn () => $request->session()->get('failed'),
                'reported_at' => fn () => $request->session()->get('reported_at'),
            ],

            'teacher' => fn () => $request->user() && $request->user()->isTeacher() ? [
                'has_deadline' => !empty(Setting::getValue('report_deadline')),
                'has_word_modules' => WordModule::exists(),
                'has_paragraph_modules' => ParagraphModule::exists(),
            ] : null,
        ];
    }
}