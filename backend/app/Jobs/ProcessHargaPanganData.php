<?php

namespace App\Jobs;

use App\Services\HargaPanganService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessHargaPanganData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum seconds the job may run before timing out.
     * Ensure your worker --timeout is >= this value.
     */
    public int $timeout = 7200; // 2 hours

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 1;

    protected string $startDate;
    protected string $endDate;

    /**
     * Create a new job instance.
     */
    public function __construct(string $startDate, string $endDate)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
    }

    /**
     * Execute the job.
     */
    public function handle(HargaPanganService $service): void
    {
        Log::info("[ProcessHargaPanganData] Starting job for {$this->startDate} to {$this->endDate}");
        try {
            $count = $service->getHargaPanganData($this->startDate, $this->endDate);
            Log::info("[ProcessHargaPanganData] Completed. Records processed: {$count}");
        } catch (\Throwable $e) {
            Log::error('[ProcessHargaPanganData] Failed: ' . $e->getMessage(), [
                'startDate' => $this->startDate,
                'endDate' => $this->endDate,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}


