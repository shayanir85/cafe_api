<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class SettingsSeeder extends Seeder
{
    public function run(): void
    {
        $settings = [
            ['key' => 'cafe_name', 'value' => 'کافه'],
            ['key' => 'currency', 'value' => 'تومان'],
            ['key' => 'opening_time', 'value' => '08:00'],
            ['key' => 'closing_time', 'value' => '23:00'],
            ['key' => 'phone', 'value' => '09123456789'],
            ['key' => 'address', 'value' => 'تهران'],
        ];

        foreach ($settings as $setting) {
            DB::table('settings')->updateOrInsert(
                ['key' => $setting['key']],
                ['value' => $setting['value'], 'updated_at' => now(), 'created_at' => now()]
            );
        }
    }
}
