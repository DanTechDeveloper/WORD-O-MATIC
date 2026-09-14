<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserRole
{
    public function handle(Request $request, Closure $next, string $role): Response
    {
        $user = $request->user();

        if (! $user) {
            if ($request->expectsJson()) {
                abort(403, 'Unauthorized.');
            }

            return $request->header('X-Inertia')
                ? \Inertia\Inertia::location(route($role === 'teacher' ? 'teacher.login' : 'login'))
                : redirect()->route($role === 'teacher' ? 'teacher.login' : 'login');
        }

        if ($user->role !== $role) {
            if ($request->expectsJson()) {
                abort(403, 'Unauthorized.');
            }

            $target = $user->role === 'teacher' ? route('teacher.dashboard') : route('student.dashboard');

            return $request->header('X-Inertia')
                ? \Inertia\Inertia::location($target)
                : redirect($target);
        }

        return $next($request);
    }
}
