<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'event_name',
        'event_time',
        'schedule_type', 
        'event_date',    
        'recurring_day', 
    ];

    // Relasi ke User
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}