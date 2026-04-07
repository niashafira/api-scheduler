<?php

use App\Jobs\ProcessHargaPanganData;
use App\Jobs\ProcessHargaPanganHarianProdusenData;
use App\Jobs\ProcessBgnPenerimaManfaatData;
use App\Jobs\ProcessBgnSppgData;
use App\Jobs\ProcessNeracaPanganKabKotaData;
use App\Jobs\ProcessSp2kpHargaKotaData;
use App\Logging\Sp2kpHargaKotaLogger;
use App\Models\BgnPenerimaManfaat;
use App\Models\BgnSppg;
use App\Models\NeracaPanganKabKota;
use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Log;
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
    ProcessHargaPanganData::dispatch($today, $today);
})
    ->cron('0 */5 * * *') // every 5 hours
    ->name('fetch-harga-pangan-daily')
    ->withoutOverlapping()
    ->description('Fetch harga pangan data for today, runs every 5 hours');

// Schedule harga pangan harian produsen data fetch every 5 hours with today's date
Schedule::call(function () {
    $today = now()->format('Y-m-d');
    ProcessHargaPanganHarianProdusenData::dispatch($today, $today);
})
    ->cron('0 */5 * * *') // every 5 hours
    ->name('fetch-harga-pangan-harian-produsen-daily')
    ->withoutOverlapping()
    ->description('Fetch harga pangan harian produsen data for today, runs every 5 hours');

// Schedule BGN penerima manfaat data fetch monthly (1st of each month at 00:00)
Schedule::call(function () {
    \Log::info('[BGN Penerima Manfaat] Monthly scheduled run');
    ProcessBgnPenerimaManfaatData::dispatch();
})
    ->monthlyOn(1, '00:00') // 1st of each month at 00:00
    ->name('fetch-bgn-penerima-manfaat-monthly')
    ->withoutOverlapping()
    ->description('Fetch BGN penerima manfaat data monthly on the 1st of each month');

// Run immediately on first deployment if no data exists
// This check runs every minute but only dispatches once if no data exists
Schedule::call(function () {
    $hasData = BgnPenerimaManfaat::exists();
    
    if (!$hasData) {
        \Log::info('[BGN Penerima Manfaat] First deployment detected - executing immediately');
        ProcessBgnPenerimaManfaatData::dispatch();
    }
})
    ->everyMinute()
    ->name('fetch-bgn-penerima-manfaat-first-run')
    ->withoutOverlapping()
    ->skip(function () {
        // Skip if data already exists (first run completed)
        return BgnPenerimaManfaat::exists();
    })
    ->description('First run check for BGN penerima manfaat - runs immediately on deployment if no data exists');

// Schedule BGN SPPG data fetch monthly (1st of each month at 00:00)
Schedule::call(function () {
    \Log::info('[BGN SPPG] Monthly scheduled run');
    ProcessBgnSppgData::dispatch();
})
    ->monthlyOn(1, '00:00') // 1st of each month at 00:00
    ->name('fetch-bgn-sppg-monthly')
    ->withoutOverlapping()
    ->description('Fetch BGN SPPG data monthly on the 1st of each month');

// Run immediately on first deployment if no data exists
// This check runs every minute but only dispatches once if no data exists
Schedule::call(function () {
    $hasData = BgnSppg::exists();
    
    if (!$hasData) {
        \Log::info('[BGN SPPG] First deployment detected - executing immediately');
        ProcessBgnSppgData::dispatch();
    }
})
    ->everyMinute()
    ->name('fetch-bgn-sppg-first-run')
    ->withoutOverlapping()
    ->skip(function () {
        // Skip if data already exists (first run completed)
        return BgnSppg::exists();
    })
    ->description('First run check for BGN SPPG - runs immediately on deployment if no data exists');

// Schedule neraca pangan pooling weekly using current year period (Y-01 to Y-12)
Schedule::call(function () {
    $year = now()->format('Y');
    $startPeriod = "{$year}-01";
    $endPeriod = "{$year}-12";

    Log::channel('neraca_pangan')->info("[Neraca Pangan] Weekly scheduled run for period {$startPeriod} to {$endPeriod}");
    ProcessNeracaPanganKabKotaData::dispatch($startPeriod, $endPeriod);
})
    ->weeklyOn(1, '00:10')
    ->name('fetch-neraca-pangan-kab-kota-weekly')
    ->withoutOverlapping()
    ->description('Fetch neraca pangan kab/kota weekly using current year period');

    // SP2KP Harga Kota: every 7 hours with today's date (tgl)
Schedule::call(function () {
    $today = now()->format('Y-m-d');
    Sp2kpHargaKotaLogger::logger()->info("[SP2KP Harga Kota] Scheduled run for tgl {$today}");
    ProcessSp2kpHargaKotaData::dispatch($today);
})
    ->cron('0 */7 * * *')
    ->name('fetch-sp2kp-harga-kota')
    ->withoutOverlapping()
    ->description('Fetch SP2KP harga kota for today, runs every 7 hours');
