<?php

namespace App\Http\Middleware;

use App\Models\ParagraphModule;
use App\Models\Setting;
use App\Models\User;
use App\Models\WordModule;
use App\Services\ReportService;
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
                'deadline' => fn () => Setting::getValue('report_deadline'),
            ],

            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
                'new_badge' => fn () => $request->session()->get('new_badge'),
                'new_badges' => fn () => $request->session()->get('new_badges'),
                'sent' => fn () => $request->session()->get('sent'),
                'failed' => fn () => $request->session()->get('failed'),
                'reported_at' => fn () => $request->session()->get('reported_at'),
                'deadline_set' => fn () => $request->session()->get('deadline_set'),
                'deadline_cleared' => fn () => $request->session()->get('deadline_cleared'),
            ],

            'teacher' => fn () => $request->user() && $request->user()->isTeacher() ? [
                'has_deadline' => ! empty(Setting::getValue('report_deadline')),
                'has_word_modules' => WordModule::exists(),
                'has_paragraph_modules' => ParagraphModule::exists(),
                'attention_threshold' => ReportService::NEEDS_ATTENTION_ATTEMPTS,
                'email' => $request->user()->email,
                'name' => $request->user()->name,
                'has_email' => ! empty($request->user()->email),
                'filters' => [
                    'searchBar' => trim((string) $request->input('searchBar', '')),
                ],
                'searchResults' => function () use ($request) {
                    $search = trim((string) $request->input('searchBar', ''));
                    if ($search === '' || mb_strlen($search) < 2) {
                        return [];
                    }

                    return User::with('student:id,user_id,section,avatar')
                        ->where('role', 'student')
                        ->where(function ($q) use ($search) {
                            $q->where('name', 'like', "%{$search}%")
                                ->orWhere('student_id', 'like', "%{$search}%");
                        })
                        ->orderBy('name')
                        ->limit(10)
                        ->get(['id', 'student_id', 'name'])
                        ->map(fn ($u) => [
                            'id' => $u->id,
                            'student_id' => $u->student_id,
                            'name' => $u->name,
                            'section' => $u->student?->section ?? '',
                            'avatar' => $u->student?->avatar ?? '',
                        ])
                        ->all();
                },
            ] : null,

        ];
    }
}
