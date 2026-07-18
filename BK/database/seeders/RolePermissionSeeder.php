<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        Permission::findOrCreate('manage-users', 'web');
        Permission::findOrCreate('manage-roles', 'web');
        Permission::findOrCreate('manage-categories', 'web');
        Permission::findOrCreate('manage-menu-items', 'web');
        Permission::findOrCreate('manage-orders', 'web');
        Permission::findOrCreate('view-dashboard', 'web');
        Permission::findOrCreate('toggle-cafe', 'web');

        $superAdmin = Role::findOrCreate('super_admin', 'web');
        $admin = Role::findOrCreate('admin', 'web');
        Role::findOrCreate('user', 'web');

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
