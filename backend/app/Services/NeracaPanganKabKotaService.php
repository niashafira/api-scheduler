<?php

namespace App\Services;

use App\Repositories\NeracaPanganKabKotaRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class NeracaPanganKabKotaService
{
    protected $logger;

    protected NeracaPanganKabKotaRepository $repository;

    protected string $summaryApiUrl;

    protected ?string $apiKey;

    protected string $provinsiIdsPath;

    protected string $komoditasPath;

    public function __construct(NeracaPanganKabKotaRepository $repository)
    {
        $this->repository = $repository;
        $this->logger = Log::channel('neraca_pangan');
        $baseUrl = trim((string) config('services.neraca_pangan.api_url'));
        if ($baseUrl === '') {
            $baseUrl = 'https://proyeksineracapangan.badanpangan.go.id/api/summary';
            $this->logger->warning('[NeracaPanganKabKotaService] neraca_pangan.api_url was empty; using default summary URL.');
        }
        $this->summaryApiUrl = rtrim($baseUrl, '/');
        $this->apiKey = config('services.neraca_pangan.api_key');
        $this->provinsiIdsPath = storage_path('app/private/data/json/provinsi_ids.json');
        $this->komoditasPath = storage_path('app/private/data/json/komoditas.json');
    }

    /**
     * Fetch neraca pangan per kab/kota for all provinces and commodities and upsert rows.
     *
     * @return int Total rows written
     */
    public function poolNeracaPanganKabKotaData(string $periodeAwal, string $periodeAkhir): int
    {
        $provinsiIds = $this->loadProvinsiIdsFromJson();
        if ($provinsiIds === []) {
            $this->logger->warning('[NeracaPanganKabKotaService] No provinsi IDs loaded; aborting pool.');

            return 0;
        }

        $komoditasList = $this->loadKomoditasFromJson();
        if ($komoditasList === []) {
            $this->logger->warning('[NeracaPanganKabKotaService] No komoditas loaded; aborting pool.');

            return 0;
        }

        $totalWritten = 0;

        foreach ($komoditasList as $komoditas) {
            $komoditasId = (int) ($komoditas['id'] ?? 0);
            $komoditasNama = (string) ($komoditas['nama'] ?? '');
            if ($komoditasId === 0 || $komoditasNama === '') {
                continue;
            }

            foreach ($provinsiIds as $provinsiId) {
                try {
                    $rows = $this->fetchSummaryForProvinsi($provinsiId, $periodeAwal, $periodeAkhir, $komoditasId);
                    if ($rows === []) {
                        continue;
                    }

                    $records = array_map(
                        fn (array $row) => $this->mapApiRowToRecord($row, $komoditasNama),
                        $rows
                    );
                    $this->repository->upsertRecords($records);
                    $totalWritten += count($records);
                } catch (\Exception $e) {
                    $this->logger->warning('[NeracaPanganKabKotaService] Failed for provinsi_id=' . $provinsiId . ', komoditas_id=' . $komoditasId . ': ' . $e->getMessage());
                    continue;
                }
            }
        }

        return $totalWritten;
    }

    /**
     * @return list<string>
     */
    protected function loadProvinsiIdsFromJson(): array
    {
        if (!is_readable($this->provinsiIdsPath)) {
            $this->logger->warning('[NeracaPanganKabKotaService] Provinsi JSON not found: ' . $this->provinsiIdsPath);

            return [];
        }

        $decoded = json_decode((string) file_get_contents($this->provinsiIdsPath), true);
        if (!is_array($decoded) || !isset($decoded['provinsi_ids']) || !is_array($decoded['provinsi_ids'])) {
            $this->logger->warning('[NeracaPanganKabKotaService] Invalid provinsi JSON structure.');

            return [];
        }

        return array_values(array_filter(array_map('strval', $decoded['provinsi_ids'])));
    }

    /**
     * @return list<array{id: int, nama: string, slug: string}>
     */
    protected function loadKomoditasFromJson(): array
    {
        if (!is_readable($this->komoditasPath)) {
            $this->logger->warning('[NeracaPanganKabKotaService] Komoditas JSON not found: ' . $this->komoditasPath);

            return [];
        }

        $decoded = json_decode((string) file_get_contents($this->komoditasPath), true);
        if (!is_array($decoded) || !isset($decoded['komoditas']) || !is_array($decoded['komoditas'])) {
            $this->logger->warning('[NeracaPanganKabKotaService] Invalid komoditas JSON structure.');

            return [];
        }

        $out = [];
        foreach ($decoded['komoditas'] as $item) {
            if (!is_array($item) || !isset($item['id'])) {
                continue;
            }
            $out[] = [
                'id' => (int) $item['id'],
                'nama' => (string) ($item['nama'] ?? ''),
                'slug' => (string) ($item['slug'] ?? ''),
            ];
        }

        return $out;
    }

    /**
     * Whether to verify TLS for the neraca API. Prefer Laravel's withoutVerifying() over Guzzle verify option;
     * (bool) casts on config can mis-handle values.
     *
     * Why only this API fails with cURL 60 on Windows: different host/certificate chain than e.g. webapi.badanpangan.go.id;
     * PHP may also have no CA bundle (curl.cainfo). Harga Pangan can still work while this host fails.
     */
    protected function shouldVerifySslForNeracaApi(): bool
    {
        return filter_var(
            config('services.neraca_pangan.http_verify_ssl', true),
            FILTER_VALIDATE_BOOLEAN
        );
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function fetchSummaryForProvinsi(string $provinsiId, string $periodeAwal, string $periodeAkhir, int $komoditasId): array
    {
        if ($this->apiKey === '') {
            $this->logger->error('[NeracaPanganKabKotaService] API key is empty. Check NERACA_PANGAN_API_KEY and config cache/queue worker restart.');
            return [];
        }

        $request = Http::timeout(120)
            ->retry(3, 2000)
            ->withHeaders([
                'NERACA-API-KEY' => (string) $this->apiKey,
                'Accept' => 'application/json',
            ]);

        if (!$this->shouldVerifySslForNeracaApi()) {
            $request = $request->withoutVerifying();
        }

        $response = $request->get($this->summaryApiUrl, [
            'komoditas_id' => $komoditasId,
            'skala' => 'kabkota',
            'periode_awal' => $periodeAwal,
            'periode_akhir' => $periodeAkhir,
            'provinsi_id' => $provinsiId,
            'all_kabkota' => 'true',
        ]);

        if (!$response->successful()) {
            $this->logger->warning('[NeracaPanganKabKotaService] HTTP ' . $response->status() . ' for provinsi_id=' . $provinsiId . ', komoditas_id=' . $komoditasId, [
                'api_key_present' => $this->apiKey !== '',
                'url' => $this->summaryApiUrl,
            ]);

            return [];
        }

        $json = $response->json();

        return $this->normalizeSummaryRows($json);
    }

    /**
     * API may return a bare list of rows or an envelope { status, code, message, data: [...] }.
     *
     * @param  mixed  $json
     * @return list<array<string, mixed>>
     */
    protected function normalizeSummaryRows(mixed $json): array
    {
        if (!is_array($json)) {
            return [];
        }

        $rows = isset($json['data']) && is_array($json['data'])
            ? $json['data']
            : $json;

        $out = [];
        foreach ($rows as $item) {
            if (is_array($item)) {
                $out[] = $item;
            }
        }

        return $out;
    }

    /**
     * @param  array<string, mixed>  $row
     * @return array<string, string>
     */
    protected function mapApiRowToRecord(array $row, string $komoditasNama): array
    {
        return [
            'periode' => (string) ($row['periode'] ?? ''),
            'provinsi' => (string) ($row['provinsi'] ?? ''),
            'kabkota' => (string) ($row['kabkota'] ?? ''),
            'komoditas' => $komoditasNama,
            'ketersediaan' => (string) ($row['ketersediaan'] ?? ''),
            'kebutuhan' => (string) ($row['kebutuhan'] ?? ''),
            'neraca' => (string) ($row['neraca'] ?? ''),
            'ketahanan_stok' => (string) ($row['ketahanan_stok'] ?? $row['kebutuhan_stok'] ?? ''),
            'status' => (string) ($row['status'] ?? ''),
        ];
    }
}
