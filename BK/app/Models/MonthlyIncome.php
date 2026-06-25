<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class MonthlyIncome extends Model
{
    protected $fillable = ['income', 'year', 'month', 'recorded_at'];
    
    protected $casts = [
        'recorded_at' => 'datetime',
    ];
}
