<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'table_number',
        'status',
        'total_amount',
        'notes',
        'is_out',
        'address'
    ];

    protected $casts = [
        'total_amount' => 'decimal:2',
        'is_out'=> 'boolean'
    ];

    protected static function booted()
    {
        static::saving(function ($order) {
            if ($order->is_out) {
                if (empty($order->address)) {
                    throw new \Exception('Address is required for delivery orders.');
                }
                
                if (!empty($order->table_number)) {
                    throw new \Exception('Table number must be empty for delivery orders.');
                }
            } 
            else {
                if (empty($order->table_number)) {
                    throw new \Exception('Table number is required for dine-in orders.');
                }
                
                if (!empty($order->address)) {
                    throw new \Exception('Address must be empty for dine-in orders.');
                }
            }
        });
    }

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function payment(): HasOne
    {
        return $this->hasOne(Payment::class);
    }

    public function scopePending($query)
    {
        return $query->where('status', 'pending');
    }

    public function scopeReady($query)
    {
        return $query->where('status', 'ready');
    }

    public function scopeDelivered($query)
    {
        return $query->where('status', 'delivered');
    }

    public function scopeByStatus($query, string $status)
    {
        return $query->where('status', $status);
    }

    public function scopeByTable($query, string $tableNumber)
    {
        return $query->where('table_number', $tableNumber);
    }
}
