<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\MenuItems;

class Category extends Model
{

    protected $fillable = [
        'name',
        'is_active',
        'display_order'
    ];



    public function menuItems()
    {
        return $this->hasMany(MenuItem::class, 'category_id');
    }

}
