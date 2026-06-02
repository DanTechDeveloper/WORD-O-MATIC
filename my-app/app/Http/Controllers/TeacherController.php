<?php

namespace App\Http\Controllers;

use Inertia\Inertia;
use App\Models\StudentModel;
use Illuminate\Http\Request;

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

    public function store(Request $request){
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
        return Inertia::render('Teacher/Word');
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
}
