<?php

namespace App\Services;

use App\Logging\Sp2kpHargaKotaLogger;
use App\Repositories\Sp2kpHargaKotaRepository;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Http\Client\Response;
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

    protected string $apiAuthorization;

    protected string $provinsiIdsPath;

    /** @var list<float> */
    protected array $requestTimestamps = [];

    protected int $emptyResponseSamplesLogged = 0;

    /** Log full getHargaKota diagnostics for the first N provinces per pool run. */
    protected int $getHargaKotaDetailLogsRemaining = 0;

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
        $this->apiAuthorization = strtolower((string) ($cfg['api_authorization'] ?? 'bearer'));
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
        $this->emptyResponseSamplesLogged = 0;
        $this->getHargaKotaDetailLogsRemaining = max(0, (int) config('services.sp2kp.diagnostic_request_logs', 15));

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
            'data_url' => $this->dataUrl,
            'api_authorization' => $this->apiAuthorization,
            'token_present_after_oauth' => $this->accessToken !== null && $this->accessToken !== '',
            'diagnostic_requests_to_log' => $this->getHargaKotaDetailLogsRemaining,
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

                $mapped = array_map(fn (array $row) => $this->mapApiRowToRecord($row, $tgl), $rows);
                $records = array_values(array_filter(
                    $mapped,
                    fn (array $r) => $r['kode_provinsi'] !== ''
                        && $r['kode_kabupaten'] !== ''
                        && $r['kode_group_komoditas'] !== ''
                        && $r['kode_commodity'] !== ''
                ));
                if ($records === [] && $rows !== []) {
                    $sampleRaw = $rows[0];
                    $sampleMapped = $mapped[0] ?? [];
                    $this->logger->warning('[Sp2kpHargaKotaService] Parsed rows but all dropped by field validation', [
                        'provinsi_id' => $provinsiId,
                        'raw_row_keys' => is_array($sampleRaw) ? array_keys($sampleRaw) : [],
                        'sample_mapped' => $sampleMapped,
                    ]);
                }
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
        $response = $this->hargaKotaHttpClient()->post($this->dataUrl, [
            'provinsi_id' => $provinsiId,
            'tgl' => $tgl,
        ]);
        $this->logger->info( 'response status: ' . $response->status());

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

        $decoded = $response->json();
        $rows = $response->successful() ? $this->normalizeHargaRows($decoded) : [];

        $this->maybeLogGetHargaKotaDiagnostics($provinsiId, $tgl, $response, $decoded, count($rows));

        if (! $response->successful()) {
            $this->logger->warning('[Sp2kpHargaKotaService] HTTP '.$response->status().' for provinsi_id='.$provinsiId, [
                'body' => $response->body(),
            ]);

            return [];
        }

        if ($rows === [] && $this->emptyResponseSamplesLogged < 10) {
            $this->emptyResponseSamplesLogged++;
            $preview = $response->body();
            $this->logger->warning('[Sp2kpHargaKotaService] OK HTTP but zero rows after parse (empty data[] or wrong shape?)', [
                'provinsi_id' => $provinsiId,
                'tgl' => $tgl,
                'top_keys' => is_array($decoded) ? array_keys($decoded) : null,
                'body_preview' => strlen($preview) > 2000 ? substr($preview, 0, 2000).'…' : $preview,
            ]);
        }

        return $rows;
    }

    /**
     * Verbose diagnostics for the first {@see getHargaKotaDetailLogsRemaining} responses each run.
     */
    protected function maybeLogGetHargaKotaDiagnostics(
        string $provinsiId,
        string $tgl,
        Response $response,
        mixed $decoded,
        int $normalizedRowCount
    ): void {
        if ($this->getHargaKotaDetailLogsRemaining <= 0) {
            return;
        }

        $this->getHargaKotaDetailLogsRemaining--;

        $body = $response->body();
        $payload = [
            'provinsi_id' => $provinsiId,
            'form_tgl' => $tgl,
            'http_status' => $response->status(),
            'client_successful' => $response->successful(),
            'body_length' => strlen($body),
            'normalized_row_count' => $normalizedRowCount,
        ];

        if (is_array($decoded)) {
            $payload['json_top_keys'] = array_keys($decoded);
            $payload['api_kode'] = $decoded['kode'] ?? null;
            $payload['api_keterangan'] = $decoded['keterangan'] ?? null;
            if (array_key_exists('data', $decoded)) {
                $d = $decoded['data'];
                $payload['data_php_type'] = gettype($d);
                if (is_array($d)) {
                    $payload['data_element_count'] = count($d);
                    $payload['data_is_list'] = array_is_list($d);
                }
            }
        } else {
            $payload['json_decode_type'] = $decoded === null ? 'null' : gettype($decoded);
            $payload['body_preview_non_json'] = strlen($body) > 800 ? substr($body, 0, 800).'…' : $body;
        }

        $this->logger->info('[Sp2kpHargaKotaService] getHargaKota response detail', $payload);
    }

    protected function hargaKotaHttpClient(): PendingRequest
    {
        $headers = [
            'x-api-key' => $this->xApiKey,
            'Accept' => 'application/json',
        ];
        $request = Http::timeout(120)->asForm()->withHeaders($headers);

        if ($this->apiAuthorization === 'token') {
            $request = $request->withHeaders([
                'Authorization' => (string) $this->accessToken,
            ]);
        } else {
            $request = $request->withToken((string) $this->accessToken);
        }

        return $this->applySsl($request);
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

        return $this->extractHargaRowList($json);
    }

    /**
     * @param  array<mixed>  $node
     * @return bool
     */
    protected function looksLikeHargaRow(array $node): bool
    {
        return isset($node['Kode_Provinsi']) || isset($node['kode_provinsi'])
            || isset($node['Kode_Commodity']) || isset($node['kode_commodity'])
            || isset($node['Kode_Kabupaten']) || isset($node['kode_kabupaten']);
    }

    /**
     * @param  array<mixed>  $node
     * @return list<array<string, mixed>>
     */
    protected function extractHargaRowList(array $node): array
    {
        if ($this->looksLikeHargaRow($node)) {
            return [$node];
        }

        if (array_is_list($node)) {
            $filtered = $this->filterHargaRowsFromList($node);
            if ($filtered !== []) {
                return $filtered;
            }
            foreach ($node as $value) {
                if (is_array($value)) {
                    $fromChild = $this->extractHargaRowList($value);
                    if ($fromChild !== []) {
                        return $fromChild;
                    }
                }
            }

            return [];
        }

        $envelopeKeys = [
            'data', 'Data', 'DATA', 'result', 'Result', 'results', 'content', 'Content',
            'list', 'List', 'items', 'Items', 'rows', 'Rows', 'records', 'Records',
            'HargaKota', 'harga_kota', 'payload', 'Payload',
        ];
        foreach ($envelopeKeys as $key) {
            if (! isset($node[$key]) || ! is_array($node[$key])) {
                continue;
            }
            $fromInner = $this->extractHargaRowList($node[$key]);
            if ($fromInner !== []) {
                return $fromInner;
            }
        }

        foreach ($node as $value) {
            if (! is_array($value)) {
                continue;
            }
            $fromChild = $this->extractHargaRowList($value);
            if ($fromChild !== []) {
                return $fromChild;
            }
        }

        return [];
    }

    /**
     * @param  list<mixed>  $list
     * @return list<array<string, mixed>>
     */
    protected function filterHargaRowsFromList(array $list): array
    {
        $out = [];
        foreach ($list as $item) {
            if (is_array($item) && $this->looksLikeHargaRow($item)) {
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
