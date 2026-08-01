<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Hekmatinasser\Verta\Verta;

class MenuItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'category_id',
        'name',
        'description',
        'price',
        'image_url',
        'is_available',
        'display_order',
    ];

    protected $appends = ['jalali_created_at'];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class);
    }

    public function orderItems(): HasMany
    {
        return $this->hasMany(OrderItem::class);
    }

    public function getJalaliCreatedAtAttribute()
    {
        return Verta::instance($this->created_at)->format('Y/m/d H:i:s');
    }

    public function getImageUrlAttribute(): ?string
    {
        $rawImageUrl = $this->attributes['image_url'] ?? null;

        if (!$rawImageUrl) {
            return null;
        }

        return url($rawImageUrl);
    }

    protected static function booted(): void
    {
        static::deleting(function (MenuItem $menuItem) {
            if ($menuItem->image_url) {
                $fullPath = public_path($menuItem->image_url);
                if (file_exists($fullPath)) {
                    unlink($fullPath);
                }
            }
        });
    }
}
