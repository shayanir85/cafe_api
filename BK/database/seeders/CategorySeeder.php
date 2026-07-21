<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Category;

class CategorySeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        Category::updateOrCreate(
            ['name' => 'نوشیدنی‌های گرم'],
            ['display_order'=> 1, 'is_active' => true]
        );

        Category::updateOrCreate(
            ['name' => 'نوشیدنی‌های سرد'],
            ['display_order'=> 2, 'is_active' => true]
        );

        Category::updateOrCreate(
            ['name' => 'دسر و شیرینی'],
            ['display_order'=> 3, 'is_active' => true]
        );

        Category::updateOrCreate(
            ['name' => 'صبحانه'],
            ['display_order'=> 4, 'is_active' => true]
        );
    }
}
