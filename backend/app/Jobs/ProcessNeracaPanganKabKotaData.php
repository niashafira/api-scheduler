<?php

namespace App\Jobs;

use App\Services\NeracaPanganKabKotaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessNeracaPanganKabKotaData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum seconds the job may run before timing out.
     */
    public int $timeout = 93600;

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 1;

    public function __construct(
        protected string $periodeAwal,
        protected string $periodeAkhir
    ) {}

    public function handle(NeracaPanganKabKotaService $service): void
    {
        $logger = Log::channel('neraca_pangan');
        $logger->info("[ProcessNeracaPanganKabKotaData] Starting job for {$this->periodeAwal} to {$this->periodeAkhir}");

        try {
            $count = $service->poolNeracaPanganKabKotaData($this->periodeAwal, $this->periodeAkhir);
            $logger->info("[ProcessNeracaPanganKabKotaData] Completed. Records processed: {$count}");
        } catch (\Throwable $e) {
            $logger->error('[ProcessNeracaPanganKabKotaData] Failed: ' . $e->getMessage(), [
                'periodeAwal' => $this->periodeAwal,
                'periodeAkhir' => $this->periodeAkhir,
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
