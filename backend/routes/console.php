<?php

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
