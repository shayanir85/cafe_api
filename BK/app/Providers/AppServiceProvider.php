<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Ipe\Sdk\SmsIrService;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        $this->app->singleton(SmsIrService::class, function ($app) {
            return new SmsIrService(
                config('services.smsir.api_key'),
                'https://api.sms.ir/v1/'
            );
        });
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        //
    }
}
