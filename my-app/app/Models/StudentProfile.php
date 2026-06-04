<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class StudentProfile extends Model
{
    use HasFactory;

    protected $table = 'students';
    protected $primaryKey = 'id';

    protected $fillable = [
        'user_id',
        'status',
        'wordRisk',
        'paragraphRisk',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
