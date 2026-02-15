<?php

namespace App\Jobs;

use App\Services\BgnPenerimaManfaatService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessBgnPenerimaManfaatData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum seconds the job may run before timing out.
     */
    public int $timeout = 300; // 5 minutes

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 3;

    /**
     * Execute the job.
     */
    public function handle(BgnPenerimaManfaatService $service): void
    {
        $logger = Log::channel('bgn_penerima_manfaat');
        $logger->info("[ProcessBgnPenerimaManfaatData] Starting job");
        
        try {
            $result = $service->fetchAndStoreData();
            
            if ($result['success']) {
                $logger->info("[ProcessBgnPenerimaManfaatData] Completed. Records processed: {$result['count']}");
            } else {
                $logger->error("[ProcessBgnPenerimaManfaatData] Failed: {$result['message']}");
                throw new \Exception($result['message']);
            }
        } catch (\Throwable $e) {
            $logger->error('[ProcessBgnPenerimaManfaatData] Failed: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}

