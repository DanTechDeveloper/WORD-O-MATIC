<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Inertia\Inertia;
use Inertia\Response;

class UserController extends Controller
{

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        return redirect()->route('login');
    }

    public function index(): Response
    {
        return Inertia::render('Auth/Homepage');
    }

    public function teacherLogin(): Response
    {
        return Inertia::render('Auth/TeacherLogin');
    }

    public function teacherLoginPost(Request $request)
    {
        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        $user = User::where('username', $request->username)
            ->where('role', 'teacher')
            ->first();

        if (! $user || ! Hash::check($request->password, $user->password)) {
            return back()->withErrors([
                'username' => 'Invalid teacher credentials',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        return redirect()->route('teacher.dashboard');
    }

    public function login(Request $request)
    {
        $request->validate([
            'name' => 'required|string',
            'pin' => 'required|string',
        ]);

        $user = User::where('name', $request->name)
            ->where('role', 'student')
            ->first();

        if (! $user || ! Hash::check($request->pin, $user->pin)) {
            return back()->withErrors([
                'name' => 'Invalid student credentials.',
            ]);
        }

        Auth::login($user);
        $request->session()->regenerate();

        $hasAvatar = $user->student && ! empty($user->student->avatar);
        return $hasAvatar 
            ? redirect()->route('student.dashboard') 
            : redirect()->route('student.splashScreen');
    }
}
