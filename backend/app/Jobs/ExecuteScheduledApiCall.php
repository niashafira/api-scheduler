<?php

namespace App\Jobs;

use App\Models\Schedule;
use App\Services\ApiExecutionService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ExecuteScheduledApiCall implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * The schedule instance.
     *
     * @var Schedule
     */
    public $schedule;

    /**
     * The number of times the job may be attempted.
     *
     * @var int
     */
    public $tries = 3;

    /**
     * The number of seconds to wait before retrying the job.
     *
     * @var array
     */
    public $backoff = [60, 300, 900]; // 1min, 5min, 15min

    /**
     * The maximum number of seconds the job can run.
     *
     * @var int
     */
    public $timeout = 300; // 5 minutes

    /**
     * Create a new job instance.
     *
     * @param Schedule $schedule
     */
    public function __construct(Schedule $schedule)
    {
        $this->schedule = $schedule;
    }

    /**
     * Execute the job.
     *
     * @param ApiExecutionService $apiExecutionService
     * @return void
     */
    public function handle(ApiExecutionService $apiExecutionService)
    {
        try {
            Log::info("Executing scheduled API call for schedule ID: {$this->schedule->id}");

            $result = $apiExecutionService->executeScheduledCall($this->schedule);

            if ($result['success']) {
                Log::info("Successfully executed schedule ID: {$this->schedule->id}");

                // Update execution count
                $this->schedule->increment('execution_count');
            } else {
                Log::error("Failed to execute schedule ID: {$this->schedule->id} - {$result['message']}");
                throw new \Exception($result['message']);
            }
        } catch (\Exception $e) {
            Log::error("Error executing schedule ID: {$this->schedule->id} - {$e->getMessage()}");

            // Update failure count
            $this->schedule->increment('failure_count');

            throw $e;
        }
    }

    /**
     * Handle a job failure.
     *
     * @param \Throwable $exception
     * @return void
     */
    public function failed(\Throwable $exception)
    {
        Log::error("Schedule ID: {$this->schedule->id} failed permanently: {$exception->getMessage()}");

        // Update schedule status if max retries exceeded
        if ($this->attempts() >= $this->tries) {
            $this->schedule->update(['status' => 'failed']);
        }
    }
}
