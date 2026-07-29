<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckStudentOnboarding
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || $user->role !== 'student') {
            return $next($request);
        }

        $student = $user->student;
        $avatar = $student?->avatar;
        $hasAvatar = $avatar && ! in_array($avatar, ['/images/boy.svg', '/images/girl.svg']);

        if (! $hasAvatar) {
            if (! $request->routeIs(['student.splashScreen', 'student.avatarSelection', 'student.updateAvatar'])) {
                return redirect()->route('student.splashScreen');
            }

            return $next($request);
        }

        if ($request->routeIs(['student.splashScreen', 'student.avatarSelection'])) {
            return redirect()->route('student.dashboard');
        }

        return $next($request);
    }
}
