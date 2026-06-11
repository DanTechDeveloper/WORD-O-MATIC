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

            if (! $hasAvatar && ! $request->routeIs('student.greetings')) {
                return redirect()->route('student.greetings');
            }

            if ($hasAvatar && $request->routeIs('student.greetings')) {
                return redirect()->route('student.dashboard');
            }
        }

        return $next($request);
    }
}
