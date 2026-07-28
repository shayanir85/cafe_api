<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Hekmatinasser\Verta\Verta;

class MonthlyIncome extends Model
{
    protected $fillable = ['income', 'year', 'month', 'recorded_at'];
    
    protected $casts = [
        'recorded_at' => 'datetime',
    ];

    public function getJalaliCreatedAtAttribute()
    {
        return Verta::instance($this->recorded_at)->format('Y/m/d H:i:s');
    }
}
