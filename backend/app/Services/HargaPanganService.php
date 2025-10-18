<?php

namespace App\Services;

use App\Models\HargaPangan;
use App\Repositories\HargaPanganRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;
use Carbon\Carbon;

class HargaPanganService
{
    protected $externalApiUrl;
    protected $csvFilePath;
    protected $hargaPanganRepository;

    public function __construct(HargaPanganRepository $hargaPanganRepository)
    {
        // Configure external API URL
        $this->externalApiUrl = config('services.harga_pangan.api_url');
        $this->csvFilePath = storage_path('app/private/data/csv/kode_wilayah.csv');
        $this->hargaPanganRepository = $hargaPanganRepository;
    }

    /**
     * Get harga pangan data by date range and region codes
     */
    public function getHargaPanganData(string $startDate, string $endDate): array
    {
        try {
            $regionCodes = $this->getRegionCodesFromCsv();
            $allData = [];

            foreach ($regionCodes as $regionCode) {
                Log::info("Fetching data for region {$regionCode} from {$startDate} to {$endDate}");
                try {
                    $regionData = $this->fetchDataForRegion($regionCode, $startDate, $endDate);
                    $allData = array_merge($allData, $regionData);

                    // Add small delay to avoid overwhelming external API
                    usleep(100000); // 0.1 second delay
                } catch (\Exception $e) {
                    Log::warning("Failed to fetch data for region {$regionCode}: " . $e->getMessage());
                    continue;
                }
            }

            return $allData;
        } catch (\Exception $e) {
            Log::error("Error in getHargaPanganData: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Fetch data for a specific region from external API
     */
    protected function fetchDataForRegion(string $kodeWilayah, string $startDate, string $endDate): array
    {
        try {
            // Call external API
            $externalData = $this->callExternalApi($kodeWilayah, $startDate, $endDate);

            if (empty($externalData)) {
                return [];
            }

            // Transform and store data one by one
            $transformedData = $this->transformExternalApiData($externalData, $kodeWilayah);

            // Store each record individually
            foreach ($transformedData as $record) {
                $this->hargaPanganRepository->storeData([$record]);
            }

            return $transformedData;
        } catch (\Exception $e) {
            Log::error("Error fetching data for region {$kodeWilayah}: " . $e->getMessage());
            throw $e;
        }
    }

    /**
     * Call external API to get harga pangan data
     */
    protected function callExternalApi(string $kodeWilayah, string $startDate, string $endDate): array
    {
        try {
            // Build URL with path parameters: /{startDate}/{endDate}/3/{kodeWilayah}
            $apiUrl = $this->externalApiUrl . '/' . $startDate . '/' . $endDate . '/3/' . $kodeWilayah;
            Log::info("Calling external API: " . $apiUrl);

            $response = Http::timeout(30)
                ->retry(1, 1000)
                ->withHeaders([
                    'X-Authorization' => config('services.harga_pangan.api_key'),
                    'Accept' => 'application/json',
                    'Content-Type' => 'application/json'
                ])
                ->get($apiUrl);

            if (!$response->successful()) {
                throw new \Exception("External API returned status: " . $response->status() . " - " . $response->body());
            }

            return $response->json();
        } catch (\Exception $e) {
            Log::error("External API call failed for region {$kodeWilayah}: " . $e->getMessage());
            // throw $e;
            return [];
        }
    }

    /**
     * Transform external API data to our database format
     */
    protected function transformExternalApiData(array $externalData, string $kodeWilayah): array
    {
        $transformedData = [];

        // Check if the response has the expected structure
        if (!isset($externalData['success']) || !$externalData['success'] || !isset($externalData['data'])) {
            Log::warning("Unexpected API response structure for region {$kodeWilayah}");
            return $transformedData;
        }

        $kabKota = $externalData['kab_kota'] ?? 'Unknown';
        $commodities = $externalData['data'] ?? [];

        foreach ($commodities as $commodity) {
            $komoditas = $commodity['Komoditas'] ?? 'Unknown';

            // Loop through each date-price pair in the commodity data
            foreach ($commodity as $key => $harga) {
                // Skip the 'Komoditas' key and only process date keys
                if ($key === 'Komoditas' || !is_numeric($harga)) {
                    continue;
                }

                // Validate that the key is a date (YYYY-MM-DD format)
                if (preg_match('/^\d{4}-\d{2}-\d{2}$/', $key)) {
                    $transformedData[] = [
                        'kab_kota' => $kabKota,
                        'komoditas' => $komoditas,
                        'tanggal' => $key,
                        'harga' => (int) $harga, // Convert to integer as per your migration
                        'kode_wilayah' => $kodeWilayah,
                        'created_at' => now(),
                        'updated_at' => now(),
                    ];
                }
            }
        }

        Log::info("Transformed " . count($transformedData) . " records for region {$kodeWilayah}");
        return $transformedData;
    }


    /**
     * Get region codes from CSV file
     */
    protected function getRegionCodesFromCsv(): array
    {
        try {
            if (!file_exists($this->csvFilePath)) {
                Log::warning("CSV file not found: {$this->csvFilePath}");
                return [];
            }

            $csvContent = file_get_contents($this->csvFilePath);
            $lines = explode("\n", $csvContent);
            $regionCodes = [];
            $uniqueRegionCodes = [];

            foreach ($lines as $lineNumber => $line) {
                $line = trim($line);

                // Skip empty lines, header, and lines that don't contain kode
                if (empty($line) || $lineNumber === 0 || !str_contains($line, ',')) {
                    continue;
                }

                // Parse CSV line - format: "kode","nama"
                $parts = str_getcsv($line);
                if (count($parts) < 2) {
                    continue;
                }

                $kode = trim($parts[0], '" '); // Remove quotes and spaces

                // Extract only the first two parts of the kode (e.g., "11.01.01.2003" -> "11.01")
                $kodeParts = explode('.', $kode);
                if (count($kodeParts) >= 2) {
                    $regionCode = $kodeParts[0] . '.' . $kodeParts[1];

                    // Only add unique region codes
                    if (!in_array($regionCode, $uniqueRegionCodes)) {
                        $uniqueRegionCodes[] = $regionCode;
                        $regionCodes[] = $regionCode;
                    }
                }
            }

            Log::info("Loaded " . count($regionCodes) . " unique region codes from CSV");
            return $regionCodes;
        } catch (\Exception $e) {
            Log::error("Failed to read CSV file: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Create sample CSV file with region codes
     */
    public function createSampleCsvFile(): void
    {
        $sampleData = [
            '# Kode Wilayah CSV File',
            '# Each line should contain one region code',
            '# Lines starting with # are comments',
            '',
            '1101', // Aceh Besar
            '1102', // Aceh Barat
            '1103', // Aceh Selatan
            '1104', // Aceh Tengah
            '1105', // Aceh Timur
            '1106', // Aceh Tenggara
            '1107', // Aceh Utara
            '1108', // Aceh Barat Daya
            '1109', // Aceh Singkil
            '1110', // Aceh Selatan
            '1111', // Aceh Tamiang
            '1112', // Aceh Jaya
            '1113', // Bener Meriah
            '1114', // Bireuen
            '1115', // Gayo Lues
            '1116', // Nagan Raya
            '1117', // Pidie
            '1118', // Pidie Jaya
            '1119', // Simeulue
            '1120', // Subulussalam
            '1121', // Aceh Tengah
            '1122', // Aceh Utara
            '1123', // Aceh Barat
            '1124', // Aceh Selatan
            '1125', // Aceh Tenggara
            '1126', // Aceh Timur
            '1127', // Aceh Barat Daya
            '1128', // Aceh Singkil
            '1129', // Aceh Selatan
            '1130', // Aceh Tamiang
        ];

        Storage::put($this->csvFilePath, implode("\n", $sampleData));
        Log::info("Created sample CSV file at: {$this->csvFilePath}");
    }

    /**
     * Get data from database only (without calling external API)
     */
    public function getDataFromDatabase(string $startDate, string $endDate, ?string $kodeWilayah = null): array
    {
        return $this->hargaPanganRepository->getDataByDateRange($startDate, $endDate, $kodeWilayah);
    }

    /**
     * Clear old data (optional cleanup method)
     */
    public function clearOldData(int $daysOld = 30): int
    {
        return $this->hargaPanganRepository->clearOldData($daysOld);
    }

    /**
     * Test method to get region codes from CSV (for debugging)
     */
    public function testGetRegionCodes(): array
    {
        return $this->getRegionCodesFromCsv();
    }
}
