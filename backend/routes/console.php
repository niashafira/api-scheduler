<?php

use App\Jobs\ProcessHargaPanganData;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// Schedule tasks
Schedule::command('scheduler:process')
    ->everyMinute()
    // ->withoutOverlapping()
    ->runInBackground();

Schedule::command('scheduler:monitor')
    ->everyFiveMinutes()
    ->withoutOverlapping();

// Schedule harga pangan data fetch every 5 hours with today's date
Schedule::call(function () {
    $today = now()->format('Y-m-d');
    ProcessHargaPanganData::dispatch($today, $today, "14.08");
})
    ->cron('0 */5 * * *') // every 5 hours
    ->name('fetch-harga-pangan-daily')
    ->withoutOverlapping()
    ->description('Fetch harga pangan data for today, runs every 5 hours');
