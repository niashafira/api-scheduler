<?php

namespace App\Services;

use App\Models\Schedule;
use App\Services\ApiRequestService;
use App\Services\ApiExtractService;
use App\Services\DestinationService;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;

class ApiExecutionService
{
    protected $apiRequestService;
    protected $apiExtractService;
    protected $destinationService;

    public function __construct(
        ApiRequestService $apiRequestService,
        ApiExtractService $apiExtractService,
        DestinationService $destinationService
    ) {
        $this->apiRequestService = $apiRequestService;
        $this->apiExtractService = $apiExtractService;
        $this->destinationService = $destinationService;
    }

    /**
     * Execute a scheduled API call
     *
     * @param Schedule $schedule
     * @return array
     */
    public function executeScheduledCall(Schedule $schedule): array
    {
        try {
            Log::info("Starting execution of schedule ID: {$schedule->id}");

            // 1. Execute API Request
            $apiResponse = $this->executeApiRequest($schedule);
            if (!$apiResponse['success']) {
                return $apiResponse;
            }

            // 2. Extract data if extract is configured
            $extractedData = null;
            if ($schedule->api_extract_id) {
                $extractResult = $this->extractData($schedule, $apiResponse['data']);
                if (!$extractResult['success']) {
                    return $extractResult;
                }
                $extractedData = $extractResult['data'];
            }

            // 3. Store data if destination is configured
            if ($schedule->destination_id) {
                $storeResult = $this->storeData($schedule, $extractedData ?: $apiResponse['data']);
                if (!$storeResult['success']) {
                    return $storeResult;
                }
            }

            // 4. Update execution timestamps
            $this->updateExecutionTimestamps($schedule);

            Log::info("Successfully completed execution of schedule ID: {$schedule->id}");

            return [
                'success' => true,
                'message' => 'Scheduled API call executed successfully',
                'data' => $extractedData ?: $apiResponse['data']
            ];

        } catch (\Exception $e) {
            Log::error("Error executing scheduled call for schedule ID {$schedule->id}: {$e->getMessage()}");
            return [
                'success' => false,
                'message' => $e->getMessage()
            ];
        }
    }

    /**
     * Execute the API request
     *
     * @param Schedule $schedule
     * @return array
     */
    private function executeApiRequest(Schedule $schedule): array
    {
        $apiRequest = $schedule->apiRequest()->first();
        if (!$apiRequest) {
            return ['success' => false, 'message' => 'API Request not found'];
        }

        try {
            $url = $apiRequest->buildUrl();
            $headers = $this->buildHeaders($apiRequest);
            $body = $this->buildBody($apiRequest);

            // Add authentication headers if needed
            $apiSource = $schedule->apiSource()->first();
            if ($apiSource) {
                Log::info(
                    'Detected ApiSource for schedule ' . $schedule->id .
                    ' {id=' . $apiSource->id . ', auth_type=' . ($apiSource->auth_type ?? 'null') .
                    ', api_key_location=' . ($apiSource->api_key_location ?? 'null') .
                    ', api_key_name=' . ($apiSource->api_key_name ?? 'null') .
                    ', token_config_id=' . ($apiSource->token_config_id ?? 'null') . '}'
                );
            } else {
                Log::warning('No ApiSource found for schedule ID: ' . $schedule->id);
            }
            $authHeaders = $this->getAuthenticationHeaders($apiSource);
            $headers = array_merge($headers, $authHeaders);

            // Ensure token is present either in header or query as configured
            $location = $apiSource && $apiSource->api_key_location ? strtolower($apiSource->api_key_location) : 'header';
            $isTokenAuth = $apiSource && (($apiSource->auth_type === 'token') || (!empty($apiSource->token_config_id)));
            if ($apiSource && $isTokenAuth) {
                $paramOrHeaderName = $apiSource->api_key_name ?: ($location === 'header' ? 'Authorization' : 'access_token');

                if ($location === 'query') {
                    try {
                        $tokenConfig = $apiSource->tokenConfig;
                        if (!$tokenConfig) {
                            Log::warning("Token config not found for API source ID: {$apiSource->id} while appending query token");
                            return ['success' => false, 'message' => 'Token config not found'];
                        }
                        $token = $this->getValidToken($tokenConfig);
                        if (!$token) {
                            Log::error("No valid token available for API source ID: {$apiSource->id} (query)");
                            return ['success' => false, 'message' => 'No valid token available'];
                        }
                        $hasQuery = (parse_url($url, PHP_URL_QUERY) !== null);
                        $separator = $hasQuery ? '&' : '?';
                        $url .= $separator . urlencode($paramOrHeaderName) . '=' . urlencode($token);
                        Log::info("Appended query token for API source ID: {$apiSource->id} using param: {$paramOrHeaderName}");
                    } catch (\Exception $e) {
                        Log::error("Error appending token as query parameter for API source ID {$apiSource->id}: {$e->getMessage()}");
                        return ['success' => false, 'message' => 'Failed to append token to URL'];
                    }
                } elseif ($location === 'header') {
                    if (!array_key_exists($paramOrHeaderName, $headers)) {
                        $tokenConfig = $apiSource->tokenConfig;
                        if (!$tokenConfig) {
                            Log::warning("Token config not found for API source ID: {$apiSource->id} while setting header token");
                            return ['success' => false, 'message' => 'Token config not found'];
                        }
                        $token = $this->getValidToken($tokenConfig);
                        if (!$token) {
                            Log::error("No valid token available for API source ID: {$apiSource->id} (header)");
                            return ['success' => false, 'message' => 'No valid token available'];
                        }
                        $headers[$paramOrHeaderName] = $paramOrHeaderName === 'Authorization' ? ("Bearer {$token}") : $token;
                        Log::info("Set header token for API source ID: {$apiSource->id} using header: {$paramOrHeaderName}");
                    }
                }
            }

            Log::info("Executing API request to: " . $this->maskUrlToken($url, $apiSource ? ($apiSource->api_key_name ?: 'access_token') : 'access_token'));
            Log::info("Request headers: " . json_encode($this->maskHeaders($headers)));

            $client = Http::withHeaders($headers);
            if (!config('app.http_ssl_verify', true)) {
                $client = $client->withoutVerifying();
                Log::warning('SSL verification disabled for HTTP client');
            }

            $response = $client
                ->timeout(30)
                ->send($apiRequest->method, $url, $body);

            if ($response->successful()) {
                $apiRequest->markAsExecuted();

                $responseData = $response->json();
                if ($responseData === null) {
                    $responseData = $response->body();
                }

                Log::info("API request successful for schedule ID: {$schedule->id}");

                return [
                    'success' => true,
                    'data' => $responseData
                ];
            } else {
                Log::error("API request failed for schedule ID: {$schedule->id} with status: {$response->status()}");
                return [
                    'success' => false,
                    'message' => "API request failed with status: {$response->status()}"
                ];
            }
        } catch (\Exception $e) {
            Log::error("API request error for schedule ID: {$schedule->id} - {$e->getMessage()}");
            return [
                'success' => false,
                'message' => "API request error: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Extract data from API response
     *
     * @param Schedule $schedule
     * @param mixed $responseData
     * @return array
     */
    private function extractData(Schedule $schedule, $responseData): array
    {
        $apiExtract = $schedule->apiExtract()->first();
        if (!$apiExtract) {
            return ['success' => false, 'message' => 'API Extract not found'];
        }

        try {
            Log::info("Extracting data for schedule ID: {$schedule->id}");

            $extractedData = $apiExtract->extractData($responseData);
            $apiExtract->markAsExecuted();

            Log::info("Data extraction successful for schedule ID: {$schedule->id}, extracted " . count($extractedData) . " items");

            return [
                'success' => true,
                'data' => $extractedData
            ];
        } catch (\Exception $e) {
            Log::error("Data extraction error for schedule ID: {$schedule->id} - {$e->getMessage()}");
            return [
                'success' => false,
                'message' => "Data extraction error: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Store data to destination
     *
     * @param Schedule $schedule
     * @param mixed $data
     * @return array
     */
    private function storeData(Schedule $schedule, $data): array
    {
        $destination = $schedule->destination()->first();
        if (!$destination) {
            return ['success' => false, 'message' => 'Destination not found'];
        }

        try {
            Log::info("Storing data for schedule ID: {$schedule->id} to table: {$destination->table_name}");

            $result = $this->storeDataToTable($destination, $data);

            if ($result['success']) {
                Log::info("Data storage successful for schedule ID: {$schedule->id}");
            }

            return $result;
        } catch (\Exception $e) {
            Log::error("Data storage error for schedule ID: {$schedule->id} - {$e->getMessage()}");
            return [
                'success' => false,
                'message' => "Data storage error: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Store data to the destination table
     *
     * @param \App\Models\Destination $destination
     * @param mixed $data
     * @return array
     */
    private function storeDataToTable($destination, $data): array
    {
        try {
            // Ensure data is an array
            if (!is_array($data)) {
                $data = [$data];
            }

            $tableName = $destination->table_name;
            $columns = $destination->columns;
            $includeRawPayload = $destination->include_raw_payload;
            $includeIngestedAt = $destination->include_ingested_at;

            $insertData = [];

            foreach ($data as $item) {
                $rowData = [];

                // Map extracted data to table columns
                foreach ($columns as $column) {
                    $fieldName = $column['name'];
                    $mappedField = $column['mappedField'] ?? $fieldName;

                    if (is_array($item) && array_key_exists($mappedField, $item)) {
                        $rowData[$fieldName] = $item[$mappedField];
                    } else {
                        $rowData[$fieldName] = null;
                    }
                }

                // Add raw payload if configured
                if ($includeRawPayload) {
                    $rowData['raw_payload'] = json_encode($item);
                }

                // Add ingested timestamp if configured
                if ($includeIngestedAt) {
                    $rowData['ingested_at'] = now();
                }

                $insertData[] = $rowData;
            }

            // Handle duplicates using upsert logic
            $result = $this->upsertDataWithDuplicateHandling($tableName, $insertData, $columns);

            return [
                'success' => true,
                'message' => 'Data stored successfully',
                'count' => $result['inserted'],
                'updated' => $result['updated'],
                'skipped' => $result['skipped']
            ];

        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => "Failed to store data: {$e->getMessage()}"
            ];
        }
    }

    /**
     * Handle data insertion with duplicate prevention based on primary keys
     *
     * @param string $tableName
     * @param array $insertData
     * @param array $columns
     * @return array
     */
    private function upsertDataWithDuplicateHandling(string $tableName, array $insertData, array $columns): array
    {
        $inserted = 0;
        $updated = 0;
        $skipped = 0;

        // Get primary key columns
        $primaryKeyColumns = [];
        foreach ($columns as $column) {
            if ($column['isPrimaryKey'] ?? false) {
                $primaryKeyColumns[] = $column['name'];
            }
        }

        if (empty($primaryKeyColumns)) {
            // No primary keys defined, just insert all data
            DB::table($tableName)->insert($insertData);
            return [
                'inserted' => count($insertData),
                'updated' => 0,
                'skipped' => 0
            ];
        }

        foreach ($insertData as $rowData) {
            try {
                // Build where clause for primary key fields
                $whereClause = [];
                foreach ($primaryKeyColumns as $pkColumn) {
                    if (isset($rowData[$pkColumn])) {
                        $whereClause[$pkColumn] = $rowData[$pkColumn];
                    }
                }

                // Check if record exists
                $existingRecord = DB::table($tableName)->where($whereClause)->first();

                if ($existingRecord) {
                    // Record exists, update it
                    DB::table($tableName)
                        ->where($whereClause)
                        ->update($rowData);
                    $updated++;

                    Log::info("Updated existing record in {$tableName} with primary keys: " . json_encode($whereClause));
                } else {
                    // Record doesn't exist, insert it
                    DB::table($tableName)->insert($rowData);
                    $inserted++;

                    Log::info("Inserted new record in {$tableName} with primary keys: " . json_encode($whereClause));
                }
            } catch (\Exception $e) {
                Log::error("Error processing record for table {$tableName}: {$e->getMessage()}");
                $skipped++;
            }
        }

        return [
            'inserted' => $inserted,
            'updated' => $updated,
            'skipped' => $skipped
        ];
    }

    /**
     * Build headers for API request
     *
     * @param \App\Models\ApiRequest $apiRequest
     * @return array
     */
    private function buildHeaders($apiRequest): array
    {
        $headers = [];
        if ($apiRequest->headers) {
            foreach ($apiRequest->headers as $header) {
                $headers[$header['key']] = $header['value'];
            }
        }
        return $headers;
    }

    /**
     * Build request body for API request
     *
     * @param \App\Models\ApiRequest $apiRequest
     * @return array
     */
    private function buildBody($apiRequest): array
    {
        if (!$apiRequest->body) {
            return [];
        }

        switch ($apiRequest->body_format) {
            case 'json':
                return ['json' => json_decode($apiRequest->body, true)];
            case 'form':
                return ['form_params' => json_decode($apiRequest->body, true)];
            default:
                return ['body' => $apiRequest->body];
        }
    }

    /**
     * Update execution timestamps
     *
     * @param Schedule $schedule
     * @return void
     */
    private function updateExecutionTimestamps(Schedule $schedule): void
    {
        $schedule->update([
            'last_executed_at' => now(),
            'next_execution_at' => $this->calculateNextExecution($schedule)
        ]);
    }

    /**
     * Calculate next execution time based on cron expression
     *
     * @param Schedule $schedule
     * @return \Carbon\Carbon|null
     */
    private function calculateNextExecution(Schedule $schedule): ?\Carbon\Carbon
    {
        try {
            $expression = $this->normalizeCronExpression($schedule->cron_expression);
            $cron = \Cron\CronExpression::factory($expression);
            $now = \Carbon\Carbon::now($schedule->timezone ?: config('app.timezone'));
            $nextRun = $cron->getNextRunDate($now);
            return \Carbon\Carbon::instance($nextRun);
        } catch (\Exception $e) {
            Log::error("Error calculating next execution for schedule ID {$schedule->id}: {$e->getMessage()} (expr: {$schedule->cron_expression})");
            return null;
        }
    }

    /**
     * Convert 6-field cron (second minute hour day month weekday) to 5-field (minute hour day month weekday)
     * when the seconds field is 0, to support environments where seconds are not recognized.
     */
    private function normalizeCronExpression(?string $expr): string
    {
        if (!$expr) {
            return '* * * * *';
        }
        $parts = preg_split('/\s+/', trim($expr));
        if (!$parts) {
            return $expr;
        }
        if (count($parts) === 6) {
            if ($parts[0] === '0') {
                return implode(' ', array_slice($parts, 1));
            }
        }
        return $expr;
    }

    /**
     * Get authentication headers for API source
     *
     * @param \App\Models\ApiSource $apiSource
     * @return array
     */
    private function getAuthenticationHeaders($apiSource): array
    {
        Log::info("Start getAuthenticationHeaders: " . ($apiSource ? ($apiSource->auth_type ?? 'none') : 'null'));
        if (!$apiSource || $apiSource->auth_type !== 'token') {
            return [];
        }

        try {
            $tokenConfig = $apiSource->tokenConfig()->first();
            if (!$tokenConfig) {
                Log::warning("Token config not found for API source ID: {$apiSource->id}");
                return [];
            }

            // Get or refresh token
            $token = $this->getValidToken($tokenConfig);
            if (!$token) {
                Log::error("Failed to get valid token for API source ID: {$apiSource->id}");
                return [];
            }

            // Return appropriate header based on token location
            if ($apiSource->api_key_location === 'header') {
                $headerName = $apiSource->api_key_name ?: 'Authorization';
                $value = $headerName === 'Authorization' ? ("Bearer {$token}") : $token;
                Log::info("Using header auth with header: {$headerName}");
                return [$headerName => $value];
            } elseif ($apiSource->api_key_location === 'query') {
                // For query parameters, we'll handle this in the URL building
                return [];
            }

            return [];
        } catch (\Exception $e) {
            Log::error("Error getting authentication headers for API source ID {$apiSource->id}: {$e->getMessage()}");
            return [];
        }
    }

    /**
     * Get a valid token for the given token config
     *
     * @param \App\Models\TokenConfig $tokenConfig
     * @return string|null
     */
    private function getValidToken($tokenConfig): ?string
    {
        try {
            // Check if we have a cached valid token
            $cacheKey = "token_{$tokenConfig->id}";
            $cachedToken = cache()->get($cacheKey);

            // Always request a fresh token per user request (ignore cache)
            if ($cachedToken) {
                Log::info("Token cache ignored for token_config_id={$tokenConfig->id}, requesting fresh token");
            } else {
                Log::info("No cached token for token_config_id={$tokenConfig->id}, requesting fresh token");
            }
            // Get new token
            $token = $this->requestNewToken($tokenConfig);
            if ($token) {
                // Do not cache to ensure fresh token each request
                return $token;
            }

            return null;
        } catch (\Exception $e) {
            Log::error("Error getting valid token for token config ID {$tokenConfig->id}: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Check if a token is still valid
     *
     * @param string $token
     * @param \App\Models\TokenConfig $tokenConfig
     * @return bool
     */
    private function isTokenValid(string $token, $tokenConfig): bool
    {
        // For now, we'll assume cached tokens are valid
        // In a real implementation, you might want to decode and check expiration
        return !empty($token);
    }

    /**
     * Request a new token from the authentication endpoint
     *
     * @param \App\Models\TokenConfig $tokenConfig
     * @return string|null
     */
    private function requestNewToken($tokenConfig): ?string
    {
        try {
            Log::info("=== TOKEN DEBUG START ===");
            Log::info("TokenConfig ID: " . $tokenConfig->id);
            Log::info("TokenConfig endpoint: " . $tokenConfig->endpoint);
            Log::info("TokenConfig method: " . $tokenConfig->method);
            Log::info("TokenConfig body: " . ($tokenConfig->body ?? 'NULL'));
            Log::info("TokenConfig headers: " . json_encode($tokenConfig->headers ?? []));
            Log::info("TokenConfig token_path: " . ($tokenConfig->token_path ?? 'NULL'));

            $headers = [];
            if ($tokenConfig->headers) {
                foreach ($tokenConfig->headers as $header) {
                    $headers[$header['key']] = $header['value'];
                }
            }
            Log::info("Processed headers: " . json_encode($headers));

            // Force x-www-form-urlencoded for token acquisition to match Postman behavior
            $bodyArray = [];
            $rawBody = (string) ($tokenConfig->body ?? '');
            if ($rawBody !== '') {
                // Try JSON decode first
                $decoded = json_decode($rawBody, true);
                if (is_array($decoded)) {
                    $bodyArray = $decoded;
                } else {
                    // Try parse_str for key=value&...
                    $temp = [];
                    parse_str($rawBody, $temp);
                    if (is_array($temp) && !empty($temp)) {
                        $bodyArray = $temp;
                    }
                }
            }
            Log::info('Token request (scheduler) as FORMDATA keys: ' . (empty($bodyArray) ? 'NONE' : implode(',', array_keys($bodyArray))));

            // Ensure grant_type presence is visible in logs
            if (!empty($bodyArray) && array_key_exists('grant_type', $bodyArray)) {
                Log::info('grant_type detected: ' . (string) $bodyArray['grant_type']);
            } else {
                Log::warning('grant_type NOT found in form body');
            }

            // Ensure Content-Type header
            $headers['Content-Type'] = 'application/x-www-form-urlencoded';
            Log::info("Final headers: " . json_encode($headers));
            Log::info("Requesting new token from: {$tokenConfig->endpoint} using method: {$tokenConfig->method}");

            $client = Http::withHeaders($headers);
            if (!config('app.http_ssl_verify', true)) {
                $client = $client->withoutVerifying();
                Log::warning('SSL verification disabled for token request');
            }

            // Send as form
            $response = $client
                ->asForm()
                ->timeout(30)
                ->send($tokenConfig->method, $tokenConfig->endpoint, [ 'form_params' => $bodyArray ]);

            if ($response->successful()) {
                $responseData = $response->json();
                if (!is_array($responseData)) {
                    Log::warning('Token response is not JSON, attempting to parse body');
                    $responseData = json_decode((string) $response->body(), true) ?: [];
                }
                $token = $this->extractTokenFromResponse($responseData, $tokenConfig);

                if ($token) {
                    Log::info("Successfully obtained new token (masked length=" . strlen($token) . ")");
                    return $token;
                } else {
                    Log::error("Token not found in response at path: {$tokenConfig->token_path}");
                    $topKeys = is_array($responseData) ? implode(',', array_slice(array_keys($responseData), 0, 5)) : '';
                    Log::info("Top-level response keys: {$topKeys}");
                    return null;
                }
            } else {
                Log::error("Token request failed with status: {$response->status()}");
                $snippet = substr((string) $response->body(), 0, 300);
                Log::info("Token request response snippet: " . $snippet);
                return null;
            }
        } catch (\Exception $e) {
            Log::error("Error requesting new token: {$e->getMessage()}");
            return null;
        }
    }

    /**
     * Extract token from authentication response
     *
     * @param array $responseData
     * @param \App\Models\TokenConfig $tokenConfig
     * @return string|null
     */
    private function extractTokenFromResponse(array $responseData, $tokenConfig): ?string
    {
        try {
            $tokenPath = $tokenConfig->token_path;
            if (!$tokenPath) {
                return null;
            }

            // Navigate through the response using dot notation
            $value = $responseData;
            foreach (explode('.', $tokenPath) as $segment) {
                if (is_array($value) && array_key_exists($segment, $value)) {
                    $value = $value[$segment];
                } else {
                    return null;
                }
            }

            return is_string($value) ? $value : null;
        } catch (\Exception $e) {
            Log::error("Error extracting token from response: {$e->getMessage()}");
            return null;
        }
    }

    private function maskHeaders(array $headers): array
    {
        $masked = [];
        foreach ($headers as $key => $value) {
            if (strtolower($key) === 'authorization') {
                $masked[$key] = 'Bearer ***';
            } else {
                $masked[$key] = $value;
            }
        }
        return $masked;
    }

    private function maskUrlToken(string $url, string $paramName): string
    {
        if (!$paramName) {
            return $url;
        }
        $pattern = '/([?&]'.preg_quote($paramName, '/').'=)([^&#]*)/i';
        return preg_replace($pattern, '$1***', $url) ?: $url;
    }
}
