<?php

namespace App\Jobs;

use App\Services\HargaPanganHarianProdusenService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;
use Illuminate\Support\Facades\Log;

class ProcessHargaPanganHarianProdusenData implements ShouldQueue
{
    use Dispatchable, InteractsWithQueue, Queueable, SerializesModels;

    /**
     * Maximum seconds the job may run before timing out.
     * Ensure your worker --timeout is >= this value.
     */
    public int $timeout = 93600; // 26 hours (slightly above 24 hours for safety)

    /**
     * Number of times the job may be attempted.
     */
    public int $tries = 1;

    protected string $startDate;
    protected string $endDate;
    protected ?string $kodeWilayah;

    /**
     * Create a new job instance.
     */
    public function __construct(string $startDate, string $endDate, ?string $kodeWilayah = null)
    {
        $this->startDate = $startDate;
        $this->endDate = $endDate;
        $this->kodeWilayah = $kodeWilayah;
    }

    /**
     * Execute the job.
     */
    public function handle(HargaPanganHarianProdusenService $service): void
    {
        // Use the dedicated log channel for harga pangan harian produsen
        $logger = Log::channel('harga_pangan_harian_produsen');
        $logger->info("[ProcessHargaPanganHarianProdusenData] Starting job for {$this->startDate} to {$this->endDate}" . ($this->kodeWilayah ? ", kode={$this->kodeWilayah}" : ''));
        try {
            $count = $service->getHargaPanganData($this->startDate, $this->endDate, $this->kodeWilayah);
            $logger->info("[ProcessHargaPanganHarianProdusenData] Completed. Records processed: {$count}");
        } catch (\Throwable $e) {
            $logger->error('[ProcessHargaPanganHarianProdusenData] Failed: ' . $e->getMessage(), [
                'startDate' => $this->startDate,
                'endDate' => $this->endDate,
                'kodeWilayah' => $this->kodeWilayah,
                'trace' => $e->getTraceAsString(),
            ]);
            throw $e;
        }
    }
}


