<?php
namespace App\Console\Commands;

use App\Models\MonthlyIncome;
use App\Models\OrderItem;
use Hekmatinasser\Verta\Verta;
use Illuminate\Console\Command;


class SaveMonthlyIncome extends Command
{
    protected $signature = 'income:save-monthly';
    protected $description = 'Save previous month income to database';

    public function handle()
    {

        if (Verta::today()->day != 1) {
            $this->info('Not the first day of the Jalali month. Skipping.');
            return;
        }

        $lastMonth = Verta::now()->subMonth();

        $startOfMonth = $lastMonth->startMonth()->toCarbon();
        $endOfMonth = $lastMonth->endMonth()->toCarbon();

        $income = OrderItem::whereBetween('created_at', [
            $startOfMonth,
            $endOfMonth
        ])->sum('subtotal');


        MonthlyIncome::updateOrCreate(
            [
                'year' => $lastMonth->year,
                'month' => $lastMonth->month,
            ],
            [
                'income' => $income,
                'recorded_at' => Verta::now(),
            ]
        );

        $this->info("Monthly income saved: $income for {$lastMonth->format('Y-m')}");
    }
}

