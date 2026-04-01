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
        $startedAt = microtime(true);
        $logger = Log::channel('neraca_pangan');
        $logger->info('[ProcessNeracaPanganKabKotaData] START', [
            'periode_awal' => $this->periodeAwal,
            'periode_akhir' => $this->periodeAkhir,
        ]);

        try {
            $count = $service->poolNeracaPanganKabKotaData($this->periodeAwal, $this->periodeAkhir);
            $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
            $logger->info('[ProcessNeracaPanganKabKotaData] SUCCESS', [
                'periode_awal' => $this->periodeAwal,
                'periode_akhir' => $this->periodeAkhir,
                'records_written' => $count,
                'elapsed_ms' => $elapsedMs,
            ]);
        } catch (\Throwable $e) {
            $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
            $logger->error('[ProcessNeracaPanganKabKotaData] FAILED', [
                'periodeAwal' => $this->periodeAwal,
                'periodeAkhir' => $this->periodeAkhir,
                'elapsed_ms' => $elapsedMs,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
