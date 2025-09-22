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
        \Log::info("Schedules: {$schedules->count()} schedules to process");
        foreach ($schedules as $schedule) {
            $exprOriginal = $schedule->cron_expression;
            $exprNormalized = $this->normalizeCronExpression($exprOriginal);
            $tz = $schedule->timezone ?: config('app.timezone');
            $now = \Carbon\Carbon::now($tz);
            try {
                $cron = \Cron\CronExpression::factory($exprNormalized);
                $isDue = $cron->isDue($now);
                $next = $cron->getNextRunDate($now)->format('Y-m-d H:i:s');
                $this->line("Checking schedule ID {$schedule->id} tz={$tz} now={$now->format('Y-m-d H:i:s')} expr={$exprOriginal} normalized={$exprNormalized} isDue=" . ($isDue ? 'yes' : 'no') . " next={$next}");
                if ($isDue) {
                    ExecuteScheduledApiCall::dispatch($schedule);
                    $this->info("Dispatched schedule ID: {$schedule->id}");
                    $dispatchedCount++;
                } else {
                    \Log::info("Schedule ID {$schedule->id} not due now (tz={$tz}, now={$now->format('Y-m-d H:i:s')}, expr={$exprOriginal}, normalized={$exprNormalized}, next={$next})");
                }
            } catch (\Exception $e) {
                \Log::error("Cron evaluation failed for schedule ID {$schedule->id}: {$e->getMessage()} expr={$exprOriginal} normalized={$exprNormalized}");
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
            // Normalize 6-field (with seconds) to 5-field if library doesn't support seconds
            $expression = $this->normalizeCronExpression($schedule->cron_expression);
            // Use a simple cron expression parser
            $cron = \Cron\CronExpression::factory($expression);
            $now = \Carbon\Carbon::now($schedule->timezone ?: config('app.timezone'));
            return $cron->isDue($now);
        } catch (\Exception $e) {
            Log::error("Invalid cron expression for schedule ID {$schedule->id}: {$e->getMessage()} (expr: {$schedule->cron_expression})");
            return false;
        }
    }

    /**
     * Convert 6-field cron (second minute hour day month weekday) to 5-field (minute hour day month weekday)
     * when the seconds field is 0, to support environments where seconds are not recognized.
     */
    private function normalizeCronExpression(?string $expr): string
    {
        if (!$expr) {
            return '* * * * *';
        }
        $parts = preg_split('/\s+/', trim($expr));
        if (!$parts) {
            return $expr;
        }
        if (count($parts) === 6) {
            // If seconds field is explicitly 0, drop it
            if ($parts[0] === '0') {
                return implode(' ', array_slice($parts, 1));
            }
        }
        return $expr;
    }
}
