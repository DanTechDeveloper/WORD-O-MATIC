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
    public function index(): Response
    {
        return Inertia::render('Auth/Homepage');
    }

    public function login(Request $request)
    {
        $request->validate([
            'role' => 'required|in:student,teacher',
            'mode' => 'required|in:login,register',
        ]);

        if ($request->role === 'student') {
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

            return redirect()->route('student.greetings');
        }

        $request->validate([
            'username' => 'required|string',
            'password' => 'required|string',
        ]);

        if ($request->mode === 'register') {
            $request->validate([
                'username' => 'required|string|unique:users,username',
                'password' => 'required|string|min:6',
            ]);

            User::create([
                'name' => $request->username,
                'username' => $request->username,
                'password' => Hash::make($request->password),
                'role' => 'teacher',
            ]);

            return redirect()->route('teacher.dashboard')->with('success', 'Registration successful! Please login with your credentials.');
        }

        // Login Logic
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
}
