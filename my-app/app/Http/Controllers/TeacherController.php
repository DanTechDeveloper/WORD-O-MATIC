<?php

namespace App\Http\Controllers;

use App\Models\StudentModel;
use App\Models\WordModule;
use Illuminate\Http\Request;
use Inertia\Inertia;

class TeacherController extends Controller
{
    public function login()
    {
        return Inertia::render('Teacher/Login');
    }

    public function dashboard()
    {
        return Inertia::render('Teacher/Dashboard');
    }

    public function classes()
    {
        return Inertia::render('Teacher/Classes');
    }

    public function students()
    {
        return Inertia::render('Teacher/Students');
    }

    public function addStudent()
    {
        $students = StudentModel::orderBy('id', 'desc')->get();

        return Inertia::render('Teacher/AddStudent', [
            'students' => $students,
        ]);
    }

    public function store(Request $request)
    {
        $request->validate([
            'fullName' => 'required',
            'studentID' => 'required',
        ]);

        $student = StudentModel::create([
            'fullName' => $request->fullName,
            'studentID' => $request->studentID,
        ]);

        $student->save();

        return redirect()->back();
    }

    public function wordModules()
    {
        $modules = WordModule::with('words')->get();

        return Inertia::render('Teacher/Word', [
            'modules' => $modules,
        ]);
    }

    public function updateWordModule(Request $request)
    {
        $request->validate([
            'level' => 'required|integer',
            'title' => 'required|string|max:255',
            'words' => 'required|array|size:10',
        ]);

        $module = WordModule::updateOrCreate(
            ['level' => $request->level],
            ['title' => $request->title]
        );

        // Linisin ang mga lumang salita at palitan ng bago
        $module->words()->delete();

        foreach ($request->words as $index => $wordText) {
            if (!empty(trim($wordText))) {
                $module->words()->create([
                    'word' => strtoupper(trim($wordText)),
                    'position' => $index + 1,
                ]);
            }
        }

        return redirect()->back();
    }

    public function paragraphModules()
    {
        return Inertia::render('Teacher/Paragraph');
    }

    public function reports()
    {
        return Inertia::render('Teacher/Reports');
    }

    public function studentDetails()
    {
        return Inertia::render('Teacher/StudentDetails');
    }

    public function assignments()
    {
        return Inertia::render('Teacher/Assignments');
    }

    public function leaderboards()
    {
        return Inertia::render('Teacher/Leaderboards');
    }

    public function createAssignment()
    {
        return Inertia::render('Teacher/Classes');
    }
}
