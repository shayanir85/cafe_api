<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        Permission::create(['name' => 'manage-users', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-roles', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-categories', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-menu-items', 'guard_name' => 'web']);
        Permission::create(['name' => 'manage-orders', 'guard_name' => 'web']);
        Permission::create(['name' => 'view-dashboard', 'guard_name' => 'web']);
        Permission::create(['name' => 'toggle-cafe', 'guard_name' => 'web']);

        $superAdmin = Role::create(['name' => 'super_admin', 'guard_name' => 'web']);
        $admin = Role::create(['name' => 'admin', 'guard_name' => 'web']);
        Role::create(['name' => 'user', 'guard_name' => 'web']);

        $superAdmin->syncPermissions([
            'manage-users',
            'manage-roles',
            'manage-categories',
            'manage-menu-items',
            'manage-orders',
            'view-dashboard',
            'toggle-cafe',
        ]);

        $admin->syncPermissions([
            'manage-categories',
            'manage-menu-items',
            'manage-orders',
            'view-dashboard',
        ]);
    }
}
