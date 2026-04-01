<?php

namespace App\Jobs;

use App\Services\Sp2kpHargaKotaService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessSp2kpHargaKotaData implements ShouldQueue
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
        protected string $tgl
    ) {}

    public function handle(Sp2kpHargaKotaService $service): void
    {
        $startedAt = microtime(true);
        $logger = Log::channel('sp2kp_harga_kota');
        $logger->info('[ProcessSp2kpHargaKotaData] START', [
            'tgl' => $this->tgl,
        ]);

        try {
            $count = $service->poolHargaKotaData($this->tgl);
            $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
            $logger->info('[ProcessSp2kpHargaKotaData] SUCCESS', [
                'tgl' => $this->tgl,
                'records_written' => $count,
                'elapsed_ms' => $elapsedMs,
            ]);
        } catch (\Throwable $e) {
            $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
            $logger->error('[ProcessSp2kpHargaKotaData] FAILED', [
                'tgl' => $this->tgl,
                'elapsed_ms' => $elapsedMs,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            throw $e;
        }
    }
}
