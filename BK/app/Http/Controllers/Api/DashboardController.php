<?php

namespace App\Http\Controllers\Api;


use App\Models\User;
use Laravel\Sanctum\PersonalAccessToken;
use App\Models\Category;
use App\Models\MenuItem;
use App\Models\MonthlyIncome;
use App\Models\Order;
use App\Models\OrderItem;
use Carbon\Carbon;

class DashboardController
{
    public function category_status(){
        return response()->json([
            'category_count' => Category::count()
        ]);
    }
    public function order_pending_count(){
        return response()->json([
            'pendingOrders_count' => Order::where('status','pending')
        ]);
    }
    public function menu_status(){
            return response()->json([
            'menu_items_count' => MenuItem::count()
        ]);
    }
    public function today_income_status(){
        $income = OrderItem::whereBetween('created_at', [
            Carbon::today(),
            Carbon::tomorrow()
        ])
        ->sum('subtotal');

        return response()->json([
        'today_income' => $income
        ]);
    }
    public function month_income_status(){
        $income = OrderItem::whereBetween('created_at', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        ])
        ->sum('subtotal');
        $pre_incomes = MonthlyIncome::all();


        return response()->json([
        'month_income' => $income,
        'previous' => $pre_incomes
        ]);
    }
    public function Order_status(){
        $income = OrderItem::whereBetween('created_at', [
            Carbon::now()->startOfMonth(),
            Carbon::now()->endOfMonth()
        ])
        ->sum('subtotal');



        return response()->json([
        'month_income' => $income
        ]);
    }
    public function Login_status(){
        $users = User::select('id', 'name', 'email', 'role', 'last_login', 'is_active', 'created_at')->get();
        return response()->json([
            'users' => $users
        ]);
    }
}
