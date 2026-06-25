<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        User::updateOrCreate(
            ['email' => 'superadmin@cafe.com'],
            [
                'name' => 'مدیر ارشد',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'phone_number' => '09112064055',
            ]
        );

        User::updateOrCreate(
            ['email' => 'admin@cafe.com'],
            [
                'name' => 'مدیر کافه',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone_number' => '09121234568',
            ]
        );

        User::updateOrCreate(
            ['email' => 'customer@cafe.com'],
            [
                'name' => 'علی احمدی',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'phone_number' => '09113054357',
            ]
        );
    }
}
