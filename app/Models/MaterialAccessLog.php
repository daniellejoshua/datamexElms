<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MaterialAccessLog extends Model
{
    protected $fillable = [
        'student_id',
        'material_id',
        'accessed_at',
        'download_completed',
        'ip_address',
        'user_agent',
    ];

    protected $casts = [
        'accessed_at' => 'datetime',
    ];

    public function student()
    {
        return $this->belongsTo(Student::class);
    }

    public function courseMaterial()
    {
        return $this->belongsTo(CourseMaterial::class, 'material_id');
    }
}
