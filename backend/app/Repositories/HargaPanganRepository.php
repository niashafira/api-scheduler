<?php

namespace App\Repositories;

use App\Models\HargaPangan;
use Illuminate\Support\Facades\Log;

class HargaPanganRepository
{
    /**
     * Store data in database using insert with conflict handling
     */
    public function storeData(array $data): void
    {
        try {
            foreach ($data as $record) {
                HargaPangan::updateOrCreate(
                    [
                        'kode_wilayah' => $record['kode_wilayah'],
                        'komoditas' => $record['komoditas'],
                        'tanggal' => $record['tanggal']
                    ],
                    [
                        'harga' => $record['harga'],
                        'kab_kota' => $record['kab_kota'],
                        'updated_at' => $record['updated_at']
                    ]
                );
            }

            // Log::info("Stored " . count($data) . " records in database");
        } catch (\Exception $e) {
            Log::error("Failed to store data in database: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Get data from database by date range and optional region code
     */
    public function getDataByDateRange(string $startDate, string $endDate, ?string $kodeWilayah = null): array
    {
        $query = HargaPangan::whereBetween('tanggal', [$startDate, $endDate]);

        if ($kodeWilayah) {
            $query->where('kode_wilayah', $kodeWilayah);
        }

        return $query->orderBy('tanggal', 'desc')
            ->orderBy('komoditas', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Get data by region code and date range
     */
    public function getDataByRegion(string $kodeWilayah, string $startDate, string $endDate): array
    {
        return HargaPangan::where('kode_wilayah', $kodeWilayah)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->orderBy('tanggal', 'desc')
            ->orderBy('komoditas', 'asc')
            ->get()
            ->toArray();
    }

    /**
     * Clear old data (optional cleanup method)
     */
    public function clearOldData(int $daysOld = 30): int
    {
        $cutoffDate = now()->subDays($daysOld)->toDateString();

        return HargaPangan::where('tanggal', '<', $cutoffDate)->delete();
    }

    /**
     * Check if data exists for region and date range
     */
    public function hasDataForRegion(string $kodeWilayah, string $startDate, string $endDate): bool
    {
        return HargaPangan::where('kode_wilayah', $kodeWilayah)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->exists();
    }

    /**
     * Get count of records for region and date range
     */
    public function getDataCount(string $kodeWilayah, string $startDate, string $endDate): int
    {
        return HargaPangan::where('kode_wilayah', $kodeWilayah)
            ->whereBetween('tanggal', [$startDate, $endDate])
            ->count();
    }
}
