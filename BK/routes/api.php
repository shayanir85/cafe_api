<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuItemsController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Routing\RouteRegistrar;
use Illuminate\Support\Facades\Route;

// Route::fallback(function () {
//     abort(404);
// });
//https://hxlab.ir/#docs

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::middleware('auth:sanctum')->post('sanctum/user', [AuthController::class, 'TokenCheck']);
        Route::middleware('auth:sanctum')->post('resetPassword', [AuthController::class, 'Update_Pass']);
        Route::middleware(['auth:sanctum', 'super_admin'])->group(function () {
            Route::post('register', [AuthController::class, 'Register']);
            });
        
        Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');
        
        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    //Dashboard routes
    Route::prefix('Dashboard')->group(function () {
        //Dashboard status
        Route::middleware(['auth:sanctum',SuperAdminMiddleware::class])->group(function(){
            // Route::get('todayIncomeStatus', [DashboardController::class, 'today_income_status']);
            // Route::get('monthIncomeStatus', [DashboardController::class, 'month_income_status']);
            Route::get('userLoginStatus', [DashboardController::class, 'Login_status']);
            Route::delete('users/{id}',[AuthController::class, 'delete']);
            Route::put('users/{id}',[AuthController::class, 'update']);
            Route::get('users',[AuthController::class, 'list']);
            Route::post('users',[AuthController::class, 'Register']);
            Route::apiResource('menu-items', MenuItemsController::class)->only(['destroy']);
        });

            // Admin routes
        Route::prefix('admin')->middleware(['auth:sanctum', AdminMiddleware::class])->group(function () {
            Route::get('CategoryStatus', [DashboardController::class, 'category_status']);
            Route::get('MenuStatus', [DashboardController::class, 'menu_status']);
            // Route::get('todayOrderStatus', [DashboardController::class, 'Order_status']);


            //category and menuitems requests
            Route::apiResource('category', CategoryController::class);
            Route::apiResource('menu-items', MenuItemsController::class)->except(['destroy','index', 'show']);
            Route::put('menu-items/{menu_item}/toggle', [MenuItemsController::class, 'toggle_is_available']);
            
            // Admin order management
            // Route::get('orders', [OrdersController::class, 'index']);
            // Route::patch('orders/{id}/status', [OrdersController::class, 'updateStatus']);
        });

        
        });
        
        
        
    // Public menu items endpoint (for customer QR ordering)
    Route::get('category', [CategoryController::class,'index']);
    Route::get('menu-items', [MenuItemsController::class, 'list']);
    Route::get('menu-items/{id}', [MenuItemsController::class, 'show']);

    // Customer orders (authenticated customers)
    // Route::post('orders', [OrdersController::class, 'store']);
    // Route::middleware(['auth:sanctum', 'admin'])->group(function () {
    //     Route::get('orders/{id}', [OrdersController::class, 'show']);
    // });

});
