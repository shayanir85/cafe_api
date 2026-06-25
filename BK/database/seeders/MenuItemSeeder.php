<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\MenuItem;
use Database\Seeders\CategorySeeder;
class MenuItemSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        MenuItem::create([
            'category_id' => 1,
            'name' => 'اسپرسو',
            'description' => 'قهوه اسپرسو تک شات',
            'price' => 45000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => 1,
            'name' => 'کاپوچینو',
            'description' => 'اسپرسو با شیر بخار داده شده',
            'price' => 65000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => 1,
            'name' => 'لاته',
            'description' => 'اسپرسو با شیر و فوم ملایم',
            'price' => 70000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => 1,
            'name' => 'چای سنتی',
            'description' => 'چای سیاه ایرانی با هل',
            'price' => 35000,
            'is_available' => true,
        ]);

        // Create Menu Items - Cold Drinks
        MenuItem::create([
            'category_id' => 2,
            'name' => 'آیس لاته',
            'description' => 'لاته سرد با یخ',
            'price' => 75000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => 2,
            'name' => 'موهیتو',
            'description' => 'نوشیدنی نعناع و لیمو',
            'price' => 55000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => 2,
            'name' => 'اسموتی توت فرنگی',
            'description' => 'اسموتی طبیعی با توت فرنگی تازه',
            'price' => 85000,
            'is_available' => true,
        ]);

        // Create Menu Items - Desserts
        MenuItem::create([
            'category_id' => 3,
            'name' => 'چیزکیک نیویورکی',
            'description' => 'چیزکیک کلاسیک با سس توت',
            'price' => 95000,
            'is_available' => true,
        ]);

    }
}
