<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $superAdmin = User::updateOrCreate(
            ['phone_number' => '09361160939'],
            [
                'name' => 'مدیر ارشد',
                'password' => Hash::make('password123'),
            ]
        );
        $superAdmin->assignRole('super_admin');

        $admin = User::updateOrCreate(
            ['phone_number' => '09113054357'],
            [
                'name' => 'مدیر کافه',
                'password' => Hash::make('password123'),
            ]
        );
        $admin->assignRole('admin');

        $user = User::updateOrCreate(
            ['phone_number' => '09040724357'],
            [
                'name' => 'علی احمدی',
                'password' => Hash::make('password123'),
            ]
        );
        $user->assignRole('user');
    }
}
