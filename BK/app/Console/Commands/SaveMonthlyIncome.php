<?php
namespace App\Console\Commands;

use App\Models\MonthlyIncome;
use App\Models\OrderItem;
use Carbon\Carbon;
use Illuminate\Console\Command;


class SaveMonthlyIncome extends Command
{
    protected $signature = 'income:save-monthly';
    protected $description = 'Save previous month income to database';

    public function handle()
    {
        $lastMonth = Carbon::now()->subMonth();
        
        $income = OrderItem::whereBetween('created_at', [
            $lastMonth->copy()->startOfMonth(),
            $lastMonth->copy()->endOfMonth()
        ])->sum('subtotal');


        MonthlyIncome::updateOrCreate(
            [
                'year' => $lastMonth->year,
                'month' => $lastMonth->month,
            ],
            [
                'income' => $income,
                'recorded_at' => now(),
            ]
        );

        $this->info("Monthly income saved: $income for {$lastMonth->format('Y-m')}");
    }
}

