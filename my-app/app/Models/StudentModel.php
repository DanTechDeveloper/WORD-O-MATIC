<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Hash;

class StudentModel extends Model
{
    protected $table = 'students';
    protected $primaryKey = 'id';
    protected $fillable = [
        'fullName', 
        'studentID',
        'pin',
        'status',
        'wordRisk',
        'paragraphRisk',
    ];

    use HasFactory;
}
