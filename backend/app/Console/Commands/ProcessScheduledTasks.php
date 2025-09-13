<?php

namespace App\Console\Commands;

use App\Jobs\ExecuteScheduledApiCall;
use App\Models\Schedule;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class ProcessScheduledTasks extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'scheduler:process';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Process all scheduled API calls';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $schedules = Schedule::where('enabled', true)
            ->where('status', 'active')
            ->where('schedule_type', 'cron')
            ->whereNotNull('cron_expression')
            ->with(['apiSource', 'apiRequest', 'apiExtract', 'destination'])
            ->get();

        $dispatchedCount = 0;

        foreach ($schedules as $schedule) {
            if ($this->shouldRunSchedule($schedule)) {
                ExecuteScheduledApiCall::dispatch($schedule);
                $this->info("Dispatched schedule ID: {$schedule->id}");
                $dispatchedCount++;
            }
        }

        $this->info("Processed {$schedules->count()} schedules, dispatched {$dispatchedCount} jobs");

        if ($dispatchedCount > 0) {
            Log::info("Scheduler processed {$dispatchedCount} scheduled tasks");
        }
    }

    /**
     * Check if a schedule should run based on cron expression
     */
    private function shouldRunSchedule(Schedule $schedule): bool
    {
        try {
            // Use a simple cron expression parser
            $cron = \Cron\CronExpression::factory($schedule->cron_expression);
            return $cron->isDue();
        } catch (\Exception $e) {
            Log::error("Invalid cron expression for schedule ID {$schedule->id}: {$e->getMessage()}");
            return false;
        }
    }
}
