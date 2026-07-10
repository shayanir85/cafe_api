<?php

namespace Database\Seeders;

use App\Models\IsClosed;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class CafeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $cafeStat = IsClosed::create([
            'is_closed' => true
        ]);
    }
}
