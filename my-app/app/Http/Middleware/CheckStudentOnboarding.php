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
        $defaults = ['/images/boy.svg', '/images/girl.svg'];
        $hasAvatar = $avatar && ! in_array($avatar, $defaults);
        $tutorialDone = (bool) $student?->tutorial_completed_at;

        // Step 1: No avatar yet → avatar selection flow
        if (! $hasAvatar) {
            if (! $request->routeIs(['student.splashScreen', 'student.avatarSelection', 'student.updateAvatar'])) {
                return redirect()->route('student.splashScreen');
            }

            return $next($request);
        }

        // Step 2: Has avatar but tutorial not finished → greetings/tutorial flow
        if (! $tutorialDone) {
            if (! $request->routeIs(['student.greetings', 'student.tutorial', 'student.tutorial.complete', 'student.updateAvatar', 'student.practice'])) {
                return redirect()->route('student.greetings');
            }

            return $next($request);
        }

        // Step 3: Fully onboarded → prevent re-entering onboarding entry screens
        if ($request->routeIs(['student.splashScreen', 'student.avatarSelection', 'student.greetings'])) {
            return redirect()->route('student.dashboard');
        }

        return $next($request);
    }
}
