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

        if ($user && $user->role === 'student') {
            $hasAvatar = $user->student && ! empty($user->student->avatar);

            // Scenario: New student or student without an avatar
            if (! $hasAvatar) {
                if (! $request->routeIs(['student.splashScreen', 'student.avatarSelection', 'student.updateAvatar'])) {
                    return redirect()->route('student.splashScreen');
                }
            } 
            // Scenario: Student already has an avatar - prevent returning to splash/selection
            else {
                if ($request->routeIs(['student.splashScreen', 'student.avatarSelection'])) {
                    return redirect()->route('student.greetings');
                }
            }
        }

        return $next($request);
    }
}
