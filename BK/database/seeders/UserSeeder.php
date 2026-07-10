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
            [
                'name' => 'مدیر ارشد',
                'password' => Hash::make('password123'),
                'role' => 'super_admin',
                'phone_number' => '09361160939',
            ]
        );

        User::updateOrCreate(
            [
                'name' => 'مدیر کافه',
                'password' => Hash::make('password123'),
                'role' => 'admin',
                'phone_number' => '09113054357',
            ]
        );

        User::updateOrCreate(
            [
                'name' => 'علی احمدی',
                'password' => Hash::make('password123'),
                'role' => 'user',
                'phone_number' => '09040724357',
            ]
        );
    }
}
