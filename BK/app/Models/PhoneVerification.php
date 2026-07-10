<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Concerns\HasUuids;

class PhoneVerification extends Model
{
    protected $primaryKey = 'uuid';    
    protected $keyType = 'string';
    public $incrementing = false;
    use HasUuids;
    protected $fillable = [
        'phone_number',
        'otp',
        'expires_at',
        'is_verified',
        'attempts'
    ];
    
    protected $casts = [
        'expires_at' => 'datetime',
        'is_verified' => 'boolean'
    ];
}
