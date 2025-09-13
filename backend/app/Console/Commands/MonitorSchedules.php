<?php

namespace App\Console\Commands;

use App\Models\Schedule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class MonitorSchedules extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scheduler:monitor';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Monitor scheduled tasks and report issues';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Starting schedule monitoring...');

        // Check for failed schedules
        $this->checkFailedSchedules();

        // Check for stuck schedules
        $this->checkStuckSchedules();

        // Check for schedules that haven't run in a while
        $this->checkStaleSchedules();

        // Display summary statistics
        $this->displaySummary();

        $this->info('Schedule monitoring completed.');
    }

    /**
     * Check for failed schedules
     */
    private function checkFailedSchedules()
    {
        $failedSchedules = Schedule::where('status', 'failed')
            ->where('updated_at', '>', now()->subHours(24))
            ->count();

        if ($failedSchedules > 0) {
            $this->warn("Found {$failedSchedules} failed schedules in the last 24 hours");
            Log::warning("Monitor found {$failedSchedules} failed schedules in the last 24 hours");
        } else {
            $this->info('No failed schedules found in the last 24 hours');
        }
    }

    /**
     * Check for stuck schedules (high failure count)
     */
    private function checkStuckSchedules()
    {
        $stuckSchedules = Schedule::where('failure_count', '>=', 5)
            ->where('enabled', true)
            ->get();

        if ($stuckSchedules->count() > 0) {
            $this->warn("Found {$stuckSchedules->count()} schedules with high failure count (>= 5)");

            foreach ($stuckSchedules as $schedule) {
                $this->line("  - Schedule ID {$schedule->id}: {$schedule->failure_count} failures");
                Log::warning("Schedule ID {$schedule->id} has {$schedule->failure_count} failures and may need attention");
            }
        } else {
            $this->info('No stuck schedules found');
        }
    }

    /**
     * Check for stale schedules (haven't run when they should have)
     */
    private function checkStaleSchedules()
    {
        $staleSchedules = Schedule::where('enabled', true)
            ->where('status', 'active')
            ->where('schedule_type', 'cron')
            ->whereNotNull('cron_expression')
            ->where(function ($query) {
                $query->whereNull('last_executed_at')
                    ->orWhere('last_executed_at', '<', now()->subHours(24));
            })
            ->get();

        if ($staleSchedules->count() > 0) {
            $this->warn("Found {$staleSchedules->count()} schedules that haven't run recently");

            foreach ($staleSchedules as $schedule) {
                $lastRun = $schedule->last_executed_at ? $schedule->last_executed_at->diffForHumans() : 'Never';
                $this->line("  - Schedule ID {$schedule->id}: Last run {$lastRun}");
                Log::warning("Schedule ID {$schedule->id} hasn't run recently (last: {$lastRun})");
            }
        } else {
            $this->info('No stale schedules found');
        }
    }

    /**
     * Display summary statistics
     */
    private function displaySummary()
    {
        $total = Schedule::count();
        $active = Schedule::where('enabled', true)->count();
        $paused = Schedule::where('enabled', false)->count();
        $failed = Schedule::where('status', 'failed')->count();
        $cron = Schedule::where('schedule_type', 'cron')->count();
        $manual = Schedule::where('schedule_type', 'manual')->count();

        $this->newLine();
        $this->info('=== Schedule Summary ===');
        $this->table(
            ['Metric', 'Count'],
            [
                ['Total Schedules', $total],
                ['Active Schedules', $active],
                ['Paused Schedules', $paused],
                ['Failed Schedules', $failed],
                ['Cron Schedules', $cron],
                ['Manual Schedules', $manual],
            ]
        );

        // Log summary for monitoring systems
        Log::info("Schedule monitoring summary: Total={$total}, Active={$active}, Paused={$paused}, Failed={$failed}");
    }
}
