<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use App\Models\MenuItem;

class MenuItemSeeder extends Seeder
{
    public function run(): void
    {
        $hotDrinks = Category::where('name', 'نوشیدنی‌های گرم')->first();
        $coldDrinks = Category::where('name', 'نوشیدنی‌های سرد')->first();
        $desserts = Category::where('name', 'دسر و شیرینی')->first();

        if (!$hotDrinks || !$coldDrinks || !$desserts) {
            return;
        }

        MenuItem::create([
            'category_id' => $hotDrinks->id,
            'name' => 'اسپرسو',
            'description' => 'قهوه اسپرسو تک شات',
            'price' => 45000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $hotDrinks->id,
            'name' => 'کاپوچینو',
            'description' => 'اسپرسو با شیر بخار داده شده',
            'price' => 65000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $hotDrinks->id,
            'name' => 'لاته',
            'description' => 'اسپرسو با شیر و فوم ملایم',
            'price' => 70000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $hotDrinks->id,
            'name' => 'چای سنتی',
            'description' => 'چای سیاه ایرانی با هل',
            'price' => 35000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $coldDrinks->id,
            'name' => 'آیس لاته',
            'description' => 'لاته سرد با یخ',
            'price' => 75000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $coldDrinks->id,
            'name' => 'موهیتو',
            'description' => 'نوشیدنی نعناع و لیمو',
            'price' => 55000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $coldDrinks->id,
            'name' => 'اسموتی توت فرنگی',
            'description' => 'اسموتی طبیعی با توت فرنگی تازه',
            'price' => 85000,
            'is_available' => true,
        ]);

        MenuItem::create([
            'category_id' => $desserts->id,
            'name' => 'چیزکیک نیویورکی',
            'description' => 'چیزکیک کلاسیک با سس توت',
            'price' => 95000,
            'is_available' => true,
        ]);
    }
}
