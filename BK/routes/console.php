<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Schedule;
use Illuminate\Support\Facades\Artisan;
use Hekmatinasser\Verta\Verta;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');


Schedule::command('income:save-monthly')
        ->dailyAt('00:01')
        ->timezone('Asia/Tehran');