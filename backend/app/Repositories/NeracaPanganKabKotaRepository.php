<?php

namespace App\Repositories;

use App\Models\NeracaPanganKabKota;
use Illuminate\Support\Facades\Log;

class NeracaPanganKabKotaRepository
{
    /**
     * Upsert rows by unique (periode, provinsi, kabkota, komoditas).
     *
     * @param  array<int, array<string, mixed>>  $records
     */
    public function upsertRecords(array $records): void
    {
        try {
            foreach ($records as $record) {
                NeracaPanganKabKota::updateOrCreate(
                    [
                        'periode' => $record['periode'],
                        'provinsi' => $record['provinsi'],
                        'kabkota' => $record['kabkota'],
                        'komoditas' => $record['komoditas'],
                    ],
                    [
                        'ketersediaan' => $record['ketersediaan'],
                        'kebutuhan' => $record['kebutuhan'],
                        'neraca' => $record['neraca'],
                        'ketahanan_stok' => $record['ketahanan_stok'],
                        'status' => $record['status'],
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error('Failed to upsert neraca_pangan_kab_kota: ' . $e->getMessage());
            throw $e;
        }
    }
}
