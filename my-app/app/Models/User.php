<?php

namespace App\Models;

use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $table = 'users';

    /**
     * Mass assignable fields
     */
    protected $fillable = [
        'student_id',
        'name',
        'username',
        'password',
        'pin',
        'role',
    ];

    /**
     * Hidden fields for security (never exposed in JSON/API)
     */
    protected $hidden = [
        'password',
        'pin',
        'remember_token',
    ];

    /**
     * Casts
     */
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'password' => 'hashed',
        'pin' => 'hashed',
    ];

    /**
     * Optional helper: check role
     */
    public function isStudent(): bool
    {
        return $this->role === 'student';
    }

    public function isTeacher(): bool
    {
        return $this->role === 'teacher';
    }

    public function student()
    {
        return $this->hasOne(StudentProfile::class, 'user_id');
    }
}
?>