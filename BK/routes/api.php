<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuItemsController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Controllers\Api\CafeController;
use App\Http\Controllers\Api\ZarinpalController;
use App\Http\Middleware\AdminMiddleware;
use App\Http\Middleware\SuperAdminMiddleware;
use Illuminate\Support\Facades\Route;
use App\Services\SMS;

Route::post('sms', function (SMS $sms) {
    $sms->send_code();
});

Route::fallback(function () {
    abort(404);
});

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::middleware('auth:sanctum')->post('sanctum/user', [AuthController::class, 'TokenCheck']);
        Route::middleware('auth:sanctum')->post('resetPassword', [AuthController::class, 'Update_Pass']);

        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    //Dashboard routes
    Route::prefix('Dashboard')->group(function () {
        Route::middleware(['auth:sanctum', SuperAdminMiddleware::class])->group(function () {
            Route::get('userLoginStatus', [DashboardController::class, 'Login_status']);
            Route::delete('users/{id}', [AuthController::class, 'delete']);
            Route::put('users/{id}', [AuthController::class, 'update']);
            Route::get('users', [AuthController::class, 'list']);
            Route::post('users', [AuthController::class, 'Register']);
            Route::apiResource('menu-items', MenuItemsController::class)->only(['destroy']);
            Route::post('cafe/toggle', [CafeController::class , 'toggleStatus']);
        });

        Route::prefix('admin')->middleware(['auth:sanctum', AdminMiddleware::class])->group(function () {
            Route::get('CategoryStatus', [DashboardController::class, 'category_status']);
            Route::get('MenuStatus', [DashboardController::class, 'menu_status']);

            Route::apiResource('category', CategoryController::class);
            Route::apiResource('menu-items', MenuItemsController::class)->except(['destroy', 'index', 'show']);
            Route::put('menu-items/{menu_item}/toggle', [MenuItemsController::class, 'toggle_is_available']);

            Route::get('orders', [OrdersController::class, 'index']);
            Route::patch('orders/{id}/status', [OrdersController::class, 'updateStatus']);
        });
    });
    // Public menu items
    Route::get('category', [CategoryController::class, 'index']);
    Route::get('menu-items', [MenuItemsController::class, 'list']);
    Route::get('menu-items/{id}', [MenuItemsController::class, 'show']);

    Route::prefix('cafe')->group(function () { 
        // Customer orders (authenticated)
        Route::middleware('auth:sanctum')->group(function () {
            Route::post('orders', [OrdersController::class, 'store']);
            Route::get('orders/{id}', [OrdersController::class, 'show']);
            // Payment routes
            Route::post('payments/request', [ZarinpalController::class, 'requestPayment'])->middleware('auth:sanctum');
            Route::get('payments/verify', [ZarinpalController::class, 'verifyPayment'])->name('payment.verify');
        });

    })->middleware('cafe_open');
    //auth
    Route::post('register', [AuthController::class, 'Register'])
        ->middleware('throttle:5,1');
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');
});
