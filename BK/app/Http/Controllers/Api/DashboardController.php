<?php

namespace App\Http\Controllers\Api;

use App\Models\User;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\MonthlyIncome;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;

class DashboardController
{
    public function category_status()
    {
        return response()->json([
            'category_count' => Category::count()
        ]);
    }

    public function menu_status()
    {
        return response()->json([
            'menu_items_count' => MenuItem::count()
        ]);
    }

    public function Login_status()
    {
        $users = User::select('id', 'name', 'email', 'role', 'last_login', 'is_active', 'created_at')->get();

        return response()->json([
            'users' => $users
        ]);
    }
}
