<?php

namespace App\Services;

use App\Logging\Sp2kpHargaKotaLogger;
use App\Repositories\Sp2kpHargaKotaRepository;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Http;

class Sp2kpHargaKotaService
{
    protected \Psr\Log\LoggerInterface $logger;

    protected Sp2kpHargaKotaRepository $repository;

    protected string $oauthUrl;

    protected string $dataUrl;

    protected string $oauthUsername;

    protected string $oauthPassword;

    protected string $oauthBasicBase64;

    protected string $xApiKey;

    protected bool $httpVerifySsl;

    protected int $rateLimitPerMinute;

    protected string $provinsiIdsPath;

    /** @var list<float> */
    protected array $requestTimestamps = [];

    protected ?string $accessToken = null;

    protected float $tokenExpiresAt = 0.0;

    public function __construct(Sp2kpHargaKotaRepository $repository)
    {
        $this->repository = $repository;
        $this->logger = Sp2kpHargaKotaLogger::logger();
        $cfg = config('services.sp2kp', []);
        $this->oauthUrl = (string) ($cfg['oauth_url'] ?? 'https://splp.layanan.go.id/oauth2/token');
        $this->dataUrl = (string) ($cfg['data_url'] ?? 'https://api-splp.layanan.go.id/komoditi/1.0/getHargaKota');
        $this->oauthUsername = (string) ($cfg['oauth_username'] ?? '');
        $this->oauthPassword = (string) ($cfg['oauth_password'] ?? '');
        $this->oauthBasicBase64 = (string) ($cfg['oauth_basic_base64'] ?? '');
        $this->xApiKey = (string) ($cfg['x_api_key'] ?? '');
        $this->httpVerifySsl = filter_var($cfg['http_verify_ssl'] ?? true, FILTER_VALIDATE_BOOLEAN);
        $this->rateLimitPerMinute = max(1, (int) ($cfg['rate_limit_per_minute'] ?? 10));
        $this->provinsiIdsPath = storage_path('app/private/data/json/provinsi_ids.json');
    }

    /**
     * Fetch harga kota for all provinces and upsert rows.
     */
    public function poolHargaKotaData(string $tgl): int
    {
        $startedAt = microtime(true);
        $this->requestTimestamps = [];
        $this->accessToken = null;
        $this->tokenExpiresAt = 0.0;

        $provinsiIds = $this->loadProvinsiIdsFromJson();
        if ($provinsiIds === []) {
            $this->logger->warning('[Sp2kpHargaKotaService] No provinsi IDs loaded; aborting pool.');

            return 0;
        }

        $this->fetchAccessToken(true);

        $totalWritten = 0;
        $totalProvinsi = count($provinsiIds);
        $idx = 0;

        $this->logger->info('[Sp2kpHargaKotaService] Pool start', [
            'tgl' => $tgl,
            'provinsi_count' => $totalProvinsi,
        ]);

        foreach ($provinsiIds as $provinsiId) {
            $idx++;
            try {
                $rows = $this->fetchHargaKotaForProvinsi($provinsiId, $tgl);
                if ($rows === []) {
                    if ($idx === 1 || $idx % 10 === 0 || $idx === $totalProvinsi) {
                        $this->logger->info('[Sp2kpHargaKotaService] Progress (empty)', [
                            'progress' => "{$idx}/{$totalProvinsi}",
                            'provinsi_id' => $provinsiId,
                        ]);
                    }

                    continue;
                }

                $records = array_values(array_filter(
                    array_map(fn (array $row) => $this->mapApiRowToRecord($row, $tgl), $rows),
                    fn (array $r) => $r['kode_provinsi'] !== ''
                        && $r['kode_kabupaten'] !== ''
                        && $r['kode_group_komoditas'] !== ''
                        && $r['kode_commodity'] !== ''
                ));
                if ($records === []) {
                    continue;
                }
                $this->repository->upsertRecords($records);
                $totalWritten += count($records);

                if ($idx === 1 || $idx % 5 === 0 || $idx === $totalProvinsi) {
                    $this->logger->info('[Sp2kpHargaKotaService] Progress', [
                        'progress' => "{$idx}/{$totalProvinsi}",
                        'provinsi_id' => $provinsiId,
                        'rows' => count($records),
                        'total_written_so_far' => $totalWritten,
                    ]);
                }
            } catch (\Throwable $e) {
                $this->logger->warning('[Sp2kpHargaKotaService] Province failed', [
                    'provinsi_id' => $provinsiId,
                    'error' => $e->getMessage(),
                ]);
            }
        }

        $elapsedMs = (int) round((microtime(true) - $startedAt) * 1000);
        $this->logger->info('[Sp2kpHargaKotaService] Pool done', [
            'tgl' => $tgl,
            'records_written' => $totalWritten,
            'elapsed_ms' => $elapsedMs,
        ]);

        return $totalWritten;
    }

    /**
     * @return list<string>
     */
    protected function loadProvinsiIdsFromJson(): array
    {
        if (! is_readable($this->provinsiIdsPath)) {
            $this->logger->warning('[Sp2kpHargaKotaService] Provinsi JSON not found: '.$this->provinsiIdsPath);

            return [];
        }

        $decoded = json_decode((string) file_get_contents($this->provinsiIdsPath), true);
        if (! is_array($decoded) || ! isset($decoded['provinsi_ids']) || ! is_array($decoded['provinsi_ids'])) {
            $this->logger->warning('[Sp2kpHargaKotaService] Invalid provinsi JSON structure.');

            return [];
        }

        return array_values(array_filter(array_map('strval', $decoded['provinsi_ids'])));
    }

    protected function fetchAccessToken(bool $force = false): void
    {
        if (! $force && $this->accessToken !== null && microtime(true) < $this->tokenExpiresAt - 60) {
            return;
        }

        if ($this->oauthUsername === '' || $this->oauthPassword === '' || $this->oauthBasicBase64 === '') {
            $this->logger->error('[Sp2kpHargaKotaService] OAuth credentials are incomplete in config/services.php sp2kp.');

            throw new \RuntimeException('SP2KP OAuth credentials are not configured.');
        }

        $request = Http::timeout(120)
            ->asForm()
            ->withHeaders([
                'Authorization' => 'Basic '.$this->oauthBasicBase64,
                'Accept' => 'application/json',
            ]);

        $this->applySsl($request);

        $response = $request->post($this->oauthUrl, [
            'grant_type' => 'password',
            'username' => $this->oauthUsername,
            'password' => $this->oauthPassword,
        ]);

        if (! $response->successful()) {
            $this->logger->error('[Sp2kpHargaKotaService] OAuth token request failed', [
                'status' => $response->status(),
                'body' => $response->body(),
            ]);
            throw new \RuntimeException('SP2KP OAuth token request failed: HTTP '.$response->status());
        }

        $json = $response->json();
        $token = is_array($json) ? ($json['access_token'] ?? null) : null;
        if (! is_string($token) || $token === '') {
            throw new \RuntimeException('SP2KP OAuth response missing access_token.');
        }

        $this->accessToken = $token;
        $expiresIn = is_array($json) ? (int) ($json['expires_in'] ?? 3600) : 3600;
        $expiresIn = max(1, min($expiresIn, 7200));
        $this->tokenExpiresAt = microtime(true) + $expiresIn;
    }

    protected function applySsl(PendingRequest $request): PendingRequest
    {
        if (! $this->httpVerifySsl) {
            return $request->withoutVerifying();
        }

        return $request;
    }

    /**
     * Sliding window: at most {@see $rateLimitPerMinute} data requests per minute.
     */
    protected function throttleBeforeDataRequest(): void
    {
        $window = 60.0;
        $max = $this->rateLimitPerMinute;

        while (true) {
            $now = microtime(true);
            $this->requestTimestamps = array_values(array_filter(
                $this->requestTimestamps,
                fn (float $t) => $now - $t < $window
            ));

            if (count($this->requestTimestamps) < $max) {
                $this->requestTimestamps[] = microtime(true);

                return;
            }

            $oldest = min($this->requestTimestamps);
            $sleep = $window - ($now - $oldest) + 0.05;
            if ($sleep > 0) {
                usleep((int) ($sleep * 1_000_000));
            }
        }
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function fetchHargaKotaForProvinsi(string $provinsiId, string $tgl): array
    {
        $this->throttleBeforeDataRequest();
        $this->ensureFreshToken();

        return $this->performHargaKotaRequest($provinsiId, $tgl, true, true);
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function performHargaKotaRequest(string $provinsiId, string $tgl, bool $allowAuthRetry, bool $allow429Retry): array
    {
        $request = Http::timeout(120)
            ->asForm()
            ->withToken((string) $this->accessToken)
            ->withHeaders([
                'x-api-key' => $this->xApiKey,
                'Accept' => 'application/json',
            ]);

        $this->applySsl($request);

        $response = $request->post($this->dataUrl, [
            'provinsi_id' => $provinsiId,
            'tgl' => $tgl,
        ]);

        if ($response->status() === 401 && $allowAuthRetry) {
            $this->logger->warning('[Sp2kpHargaKotaService] 401 on getHargaKota; refreshing token.');
            $this->fetchAccessToken(true);
            $this->throttleBeforeDataRequest();

            return $this->performHargaKotaRequest($provinsiId, $tgl, false, $allow429Retry);
        }

        if ($response->status() === 429 && $allow429Retry) {
            $this->logger->warning('[Sp2kpHargaKotaService] 429 rate limited; waiting 65s.');
            sleep(65);
            $this->throttleBeforeDataRequest();

            return $this->performHargaKotaRequest($provinsiId, $tgl, $allowAuthRetry, false);
        }

        if (! $response->successful()) {
            $this->logger->warning('[Sp2kpHargaKotaService] HTTP '.$response->status().' for provinsi_id='.$provinsiId, [
                'body' => $response->body(),
            ]);

            return [];
        }

        return $this->normalizeHargaRows($response->json());
    }

    protected function ensureFreshToken(): void
    {
        $this->fetchAccessToken(false);
    }

    /**
     * @return list<array<string, mixed>>
     */
    protected function normalizeHargaRows(mixed $json): array
    {
        if (! is_array($json)) {
            return [];
        }

        $rows = isset($json['data']) && is_array($json['data'])
            ? $json['data']
            : $json;

        if (! is_array($rows)) {
            return [];
        }

        if (! array_is_list($rows) && (isset($rows['Kode_Provinsi']) || isset($rows['kode_provinsi']))) {
            return [$rows];
        }

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
     * @return array<string, mixed>
     */
    protected function mapApiRowToRecord(array $row, string $tglFallback): array
    {
        $tanggal = (string) ($row['tanggal'] ?? $tglFallback);
        if ($tanggal === '') {
            $tanggal = $tglFallback;
        }

        $price = $row['Price'] ?? $row['price'] ?? 0;

        return [
            'kode_provinsi' => (string) ($row['Kode_Provinsi'] ?? $row['kode_provinsi'] ?? ''),
            'nama_provinsi' => (string) ($row['Nama_Provinsi'] ?? $row['nama_provinsi'] ?? ''),
            'kode_kabupaten' => (string) ($row['Kode_Kabupaten'] ?? $row['kode_kabupaten'] ?? ''),
            'nama_kabupaten' => (string) ($row['Nama_Kabupaten'] ?? $row['nama_kabupaten'] ?? ''),
            'kode_group_komoditas' => (string) ($row['Kode_Group_Komoditas'] ?? $row['kode_group_komoditas'] ?? ''),
            'nama_group_komoditas' => (string) ($row['Nama_Group_Komoditas'] ?? $row['nama_group_komoditas'] ?? ''),
            'kode_commodity' => (string) ($row['Kode_Commodity'] ?? $row['kode_commodity'] ?? ''),
            'commodity' => (string) ($row['Commodity'] ?? $row['commodity'] ?? ''),
            'price' => is_numeric($price) ? 0 + $price : 0,
            'kode_variant' => (string) ($row['kodevariant'] ?? $row['KodeVariant'] ?? $row['kode_variant'] ?? ''),
            'satuan' => (string) ($row['satuan'] ?? ''),
            'kuantitas' => (string) ($row['kuantitas'] ?? ''),
            'tanggal' => $tanggal,
            'sumber' => (string) ($row['sumber'] ?? ''),
        ];
    }
}
