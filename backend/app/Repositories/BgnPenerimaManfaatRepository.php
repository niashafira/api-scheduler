<?php

namespace App\Repositories;

use App\Models\BgnPenerimaManfaat;
use Illuminate\Support\Facades\Log;

class BgnPenerimaManfaatRepository
{
    /**
     * Store data in database using updateOrCreate
     */
    public function storeData(array $data): void
    {
        try {
            foreach ($data as $record) {
                $ingestedDate = $record['ingested_date'] ?? now()->toDateString();
                
                BgnPenerimaManfaat::updateOrCreate(
                    [
                        'ingested_date' => $ingestedDate,
                        'kode_kabko' => $record['kode_kabko']
                    ],
                    [
                        'kode_prov' => $record['kode_prov'],
                        'provinsi' => $record['provinsi'],
                        'kabko' => $record['kabko'],
                        'total_penerima' => $record['total_penerima'],
                        'updated_at' => $record['updated_at'] ?? now()
                    ]
                );
            }
        } catch (\Exception $e) {
            Log::error("Failed to store BGN penerima manfaat data in database: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get all data from database
     */
    public function getAllData(): array
    {
        return BgnPenerimaManfaat::orderBy('kode_prov', 'asc')
            ->orderBy('kode_kabko', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by province code
     */
    public function getDataByProvince(string $kodeProv): array
    {
        return BgnPenerimaManfaat::where('kode_prov', $kodeProv)
            ->orderBy('kode_kabko', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by kabko code
     */
    public function getDataByKabko(string $kodeKabko): ?BgnPenerimaManfaat
    {
        return BgnPenerimaManfaat::where('kode_kabko', $kodeKabko)->first();
    }

    /**
     * Clear all data
     */
    public function clearAllData(): int
    {
        return BgnPenerimaManfaat::truncate();
    }
}

