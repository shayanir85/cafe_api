<?php

namespace Database\Seeders;

use App\Models\IsClosed;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CafeSeeder extends Seeder
{
    public function run(): void
    {
        IsClosed::updateOrCreate(
            ['id' => 1],
            ['is_closed' => true]
        );
    }
}
