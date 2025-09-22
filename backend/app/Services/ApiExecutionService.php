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
        $apiRequest = $schedule->apiRequest;
        if (!$apiRequest) {
            return ['success' => false, 'message' => 'API Request not found'];
        }

        try {
            $url = $apiRequest->buildUrl();
            $headers = $this->buildHeaders($apiRequest);
            $body = $this->buildBody($apiRequest);

            // Add authentication headers if needed
            $authHeaders = $this->getAuthenticationHeaders($schedule->apiSource);
            $headers = array_merge($headers, $authHeaders);

            Log::info("Executing API request to: {$url}");
            Log::info("Request headers: " . json_encode($headers));

            $response = Http::withHeaders($headers)
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
        $apiExtract = $schedule->apiExtract;
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
        $destination = $schedule->destination;
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
        if (!$apiSource || $apiSource->auth_type !== 'token') {
            return [];
        }

        try {
            $tokenConfig = $apiSource->tokenConfig;
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
                return [$headerName => "Bearer {$token}"];
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

            if ($cachedToken && $this->isTokenValid($cachedToken, $tokenConfig)) {
                return $cachedToken;
            }

            // Get new token
            $token = $this->requestNewToken($tokenConfig);
            if ($token) {
                // Cache the token for its expiration time
                $expiresIn = $tokenConfig->expires_in ?: 3600; // Default 1 hour
                cache()->put($cacheKey, $token, now()->addSeconds($expiresIn));
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
            $headers = [];
            if ($tokenConfig->headers) {
                foreach ($tokenConfig->headers as $header) {
                    $headers[$header['key']] = $header['value'];
                }
            }

            $body = [];
            if ($tokenConfig->body) {
                $body = ['json' => json_decode($tokenConfig->body, true)];
            }

            Log::info("Requesting new token from: {$tokenConfig->endpoint}");

            $response = Http::withHeaders($headers)
                ->timeout(30)
                ->send($tokenConfig->method, $tokenConfig->endpoint, $body);

            if ($response->successful()) {
                $responseData = $response->json();
                $token = $this->extractTokenFromResponse($responseData, $tokenConfig);

                if ($token) {
                    Log::info("Successfully obtained new token");
                    return $token;
                } else {
                    Log::error("Token not found in response");
                    return null;
                }
            } else {
                Log::error("Token request failed with status: {$response->status()}");
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
}
