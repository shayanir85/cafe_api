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
        $breakfast = Category::where('name', 'صبحانه')->first();

        if (!$hotDrinks || !$coldDrinks || !$desserts || !$breakfast) {
            return;
        }

        MenuItem::updateOrCreate(
            ['name' => 'اسپرسو', 'category_id' => $hotDrinks->id],
            ['description' => 'قهوه اسپرسو تک شات', 'price' => 45000, 'display_order' => 1, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'کاپوچینو', 'category_id' => $hotDrinks->id],
            ['description' => 'اسپرسو با شیر بخار داده شده', 'price' => 65000, 'display_order' => 2, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'لاته', 'category_id' => $hotDrinks->id],
            ['description' => 'اسپرسو با شیر و فوم ملایم', 'price' => 70000, 'display_order' => 3, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'چای سنتی', 'category_id' => $hotDrinks->id],
            ['description' => 'چای سیاه ایرانی با هل', 'price' => 35000, 'display_order' => 4, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'آیس لاته', 'category_id' => $coldDrinks->id],
            ['description' => 'لاته سرد با یخ', 'price' => 75000, 'display_order' => 1, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'موهیتو', 'category_id' => $coldDrinks->id],
            ['description' => 'نوشیدنی نعناع و لیمو', 'price' => 55000, 'display_order' => 2, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'اسموتی توت فرنگی', 'category_id' => $coldDrinks->id],
            ['description' => 'اسموتی طبیعی با توت فرنگی تازه', 'price' => 85000, 'display_order' => 3, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'چیزکیک نیویورکی', 'category_id' => $desserts->id],
            ['description' => 'چیزکیک کلاسیک با سس توت', 'price' => 95000, 'display_order' => 1, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'بستنی وانیلی', 'category_id' => $desserts->id],
            ['description' => 'بستنی وانیلی با سس شکلات', 'price' => 55000, 'display_order' => 2, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'کیک شکلاتی', 'category_id' => $desserts->id],
            ['description' => 'کیک شکلاتی سه لایه', 'price' => 85000, 'display_order' => 3, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'صبحانه کامل', 'category_id' => $breakfast->id],
            ['description' => 'نان، کره، عسل، مربا، پنیر، چای', 'price' => 120000, 'display_order' => 1, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'املت', 'category_id' => $breakfast->id],
            ['description' => 'املت گوجه و فلفل', 'price' => 75000, 'display_order' => 2, 'is_available' => true]
        );

        MenuItem::updateOrCreate(
            ['name' => 'تخم مرغ آبپز', 'category_id' => $breakfast->id],
            ['description' => 'دو عدد تخم مرغ آبپز با نان تست', 'price' => 45000, 'display_order' => 3, 'is_available' => true]
        );
    }
}
