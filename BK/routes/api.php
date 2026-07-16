<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CafeController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\DashboardController;
use App\Http\Controllers\Api\MenuItemsController;
use App\Http\Controllers\Api\OrdersController;
use App\Http\Controllers\Api\RoleController;
use App\Http\Controllers\Api\ZarinpalController;
use Illuminate\Support\Facades\Route;

Route::fallback(function () {
    abort(404);
});

Route::prefix('v1')->group(function () {

    Route::prefix('auth')->group(function () {
        Route::post('send-otp', [AuthController::class, 'sendOTP'])
            ->middleware('throttle:3,60');
        Route::post('verify-otp', [AuthController::class, 'verifyOTP'])
            ->middleware('throttle:5,300');
        Route::post('resend-otp', [AuthController::class, 'resendOTP'])
            ->middleware('throttle:2,60');

        Route::middleware('auth:sanctum')->post('sanctum/user', [AuthController::class, 'TokenCheck']);
        Route::middleware('auth:sanctum')->post('resetPassword', [AuthController::class, 'Update_Pass']);

        Route::middleware(['auth:sanctum'])->group(function () {
            Route::post('logout', [AuthController::class, 'logout']);
        });
    });

    // Dashboard routes
    Route::prefix('Dashboard')->group(function () {
        Route::middleware(['auth:sanctum', 'permission:manage-users'])->group(function () {
            Route::get('userLoginStatus', [DashboardController::class, 'Login_status']);
            Route::delete('users/{id}', [AuthController::class, 'delete']);
            Route::put('users/{id}', [AuthController::class, 'update']);
            Route::get('users', [AuthController::class, 'list']);
            Route::post('users', [AuthController::class, 'Register']);
            Route::patch('users/{user}/roles', [AuthController::class, 'assignRoles']);
        });

        Route::middleware(['auth:sanctum', 'permission:manage-menu-items'])
            ->apiResource('menu-items', MenuItemsController::class)
            ->only(['destroy']);

        Route::middleware(['auth:sanctum', 'permission:toggle-cafe'])
            ->post('cafe/toggle', [CafeController::class, 'toggleStatus']);

        Route::prefix('admin')->middleware('auth:sanctum')->group(function () {
            Route::get('CategoryStatus', [DashboardController::class, 'category_status'])
                ->middleware('permission:view-dashboard');
            Route::get('MenuStatus', [DashboardController::class, 'menu_status'])
                ->middleware('permission:view-dashboard');

            Route::apiResource('category', CategoryController::class)
                ->middleware('permission:manage-categories');
            Route::apiResource('menu-items', MenuItemsController::class)
                ->except(['destroy', 'index', 'show'])
                ->middleware('permission:manage-menu-items');
            Route::put('menu-items/{menu_item}/toggle', [MenuItemsController::class, 'toggle_is_available'])
                ->middleware('permission:manage-menu-items');

            Route::get('orders', [OrdersController::class, 'index'])
                ->middleware('permission:manage-orders');
            Route::patch('orders/{id}/status', [OrdersController::class, 'updateStatus'])
                ->middleware('permission:manage-orders');
        });
    });

    // Role management (super_admin only via manage-roles permission)
    Route::middleware(['auth:sanctum', 'permission:manage-roles'])->group(function () {
        Route::get('permissions', [RoleController::class, 'listPermissions']);
        Route::get('roles', [RoleController::class, 'index']);
        Route::post('roles', [RoleController::class, 'store']);
        Route::get('roles/{role}', [RoleController::class, 'show']);
        Route::put('roles/{role}', [RoleController::class, 'update']);
        Route::delete('roles/{role}', [RoleController::class, 'destroy']);
        Route::get('roles/{role}/permissions', [RoleController::class, 'permissions']);
        Route::put('roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
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
            Route::post('payments/request', [ZarinpalController::class, 'requestPayment']);
        });

        // Payment verify callback — public (Zarinpal redirect cannot carry API tokens)
        Route::get('payments/verify', [ZarinpalController::class, 'verifyPayment'])->name('payment.verify');

    })->middleware('cafe_open');

    // Auth
    Route::post('register', [AuthController::class, 'Register'])
        ->middleware('throttle:5,1');
    Route::post('login', [AuthController::class, 'login'])
        ->middleware('throttle:5,1');
});
