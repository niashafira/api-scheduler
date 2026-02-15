<?php

namespace App\Repositories;

use App\Models\BgnSppg;
use Illuminate\Support\Facades\Log;

class BgnSppgRepository
{
    /**
     * Store data in database using updateOrCreate
     */
    public function storeData(array $data): void
    {
        try {
            foreach ($data as $record) {
                BgnSppg::updateOrCreate(
                    [
                        'periode' => $record['periode'],
                        'kode_kab' => $record['kode_kab']
                    ],
                    [
                        'kode_prov' => $record['kode_prov'],
                        'provinsi' => $record['provinsi'],
                        'kabupaten' => $record['kabupaten'],
                        'jumlah_sppg_operasional' => $record['jumlah_sppg_operasional'],
                        'updated_at' => $record['updated_at'] ?? now()
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to store BGN SPPG data in database: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all data from database
     */
    public function getAllData(): array
    {
        return BgnSppg::orderBy('periode', 'desc')
            ->orderBy('kode_prov', 'asc')
            ->orderBy('kode_kab', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by periode
     */
    public function getDataByPeriode(string $periode): array
    {
        return BgnSppg::where('periode', $periode)
            ->orderBy('kode_prov', 'asc')
            ->orderBy('kode_kab', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by province code
     */
    public function getDataByProvince(string $kodeProv): array
    {
        return BgnSppg::where('kode_prov', $kodeProv)
            ->orderBy('periode', 'desc')
            ->orderBy('kode_kab', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by kab code
     */
    public function getDataByKab(string $kodeKab): array
    {
        return BgnSppg::where('kode_kab', $kodeKab)
            ->orderBy('periode', 'desc')
            ->get()
            ->toArray();
    }

    /**
     * Clear all data
     */
    public function clearAllData(): int
    {
        return BgnSppg::truncate();
    }
}

