<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsToMany;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

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

    public function badges(): BelongsToMany
    {
        return $this->belongsToMany(Badges::class, 'student_badges', 'user_id', 'badge_id')
            ->withPivot(['earned_at', 'progress', 'status', 'unlocked_session_id'])
            ->withTimestamps();
    }

    public function wordProgress()
    {
        return $this->hasMany(StudentWordProgress::class, 'user_id');
    }
}
