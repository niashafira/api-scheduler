<?php

namespace App\Services;

use App\Repositories\BgnPenerimaManfaatRepository;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class BgnPenerimaManfaatService
{
    protected $apiBaseUrl;
    protected $apiUsername;
    protected $apiPassword;
    protected $apiAuthToken;
    protected $repository;
    protected $logger;

    public function __construct(BgnPenerimaManfaatRepository $repository)
    {
        $this->apiBaseUrl = config('services.bgn.api_url', 'https://devapi.bgn.go.id');
        $this->apiUsername = config('services.bgn.username', 'pusdatin_bapanas');
        $this->apiPassword = config('services.bgn.password', 'K0xejsfd9328qu4=3BK');
        $this->apiAuthToken = config('services.bgn.auth_token');
        $this->repository = $repository;
        $this->logger = Log::channel('bgn_penerima_manfaat');
    }

    /**
     * Get token from BGN API
     */
    public function getToken(): ?string
    {
        try {
            $this->logger->info("Requesting token from BGN API");

            $response = Http::timeout(30)
                ->retry(2, 1000)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Authorization' => 'Bearer ' . $this->apiAuthToken,
                ])
                ->post($this->apiBaseUrl . '/api/login', [
                    'username' => $this->apiUsername,
                    'password' => $this->apiPassword
                ]);

            if (!$response->successful()) {
                $status = $response->status();
                $bodySnippet = substr($response->body() ?? '', 0, 500);
                $this->logger->error("Failed to get token (status {$status}): {$bodySnippet}");
                return null;
            }

            $json = $response->json();
            
            if (!isset($json['status']) || !$json['status'] || !isset($json['data']['token'])) {
                $this->logger->error("Invalid token response structure: " . json_encode($json));
                return null;
            }

            $token = $json['data']['token'];
            $this->logger->info("Token obtained successfully");
            
            return $token;
        } catch (\Exception $e) {
            $this->logger->error("Exception while getting token: " . $e->getMessage());
            return null;
        }
    }

    /**
     * Get penerima manfaat data from BGN API
     */
    public function getPenerimaManfaatData(?string $token = null): array
    {
        try {
            // Get token if not provided
            if (!$token) {
                $token = $this->getToken();
                if (!$token) {
                    $this->logger->error("Failed to obtain token for data fetch");
                    return [];
                }
            }

            $this->logger->info("Fetching penerima manfaat data from BGN API");

            $response = Http::timeout(60)
                ->retry(2, 1000)
                ->withHeaders([
                    'Authorization' => 'Bearer ' . $token,
                ])
                ->get($this->apiBaseUrl . '/api/penerima-manfaat/kab-summary');

            if (!$response->successful()) {
                $status = $response->status();
                $bodySnippet = substr($response->body() ?? '', 0, 500);
                $this->logger->error("Failed to get data (status {$status}): {$bodySnippet}");
                return [];
            }

            $json = $response->json();
            
            if (!isset($json['items']) || !is_array($json['items'])) {
                $this->logger->error("Invalid data response structure: " . json_encode($json));
                return [];
            }

            $items = $json['items'];
            $this->logger->info("Retrieved " . count($items) . " items from API");

            return $items;
        } catch (\Exception $e) {
            $this->logger->error("Exception while fetching data: " . $e->getMessage());
            return [];
        }
    }

    /**
     * Transform API data to database format and store
     */
    public function fetchAndStoreData(): array
    {
        try {
            // Get token
            $token = $this->getToken();
            if (!$token) {
                throw new \Exception("Failed to obtain authentication token");
            }

            // Get data
            $items = $this->getPenerimaManfaatData($token);
            if (empty($items)) {
                throw new \Exception("No data retrieved from API");
            }

            // Transform data
            $transformedData = $this->transformApiData($items);

            // Store data
            $this->repository->storeData($transformedData);

            $this->logger->info("Successfully stored " . count($transformedData) . " records");

            return [
                'success' => true,
                'message' => 'Data fetched and stored successfully',
                'count' => count($transformedData)
            ];
        } catch (\Exception $e) {
            $this->logger->error("Error in fetchAndStoreData: " . $e->getMessage());
            return [
                'success' => false,
                'message' => $e->getMessage(),
                'count' => 0
            ];
        }
    }

    /**
     * Transform API data to database format
     */
    protected function transformApiData(array $items): array
    {
        $transformedData = [];

        foreach ($items as $item) {
            $transformedData[] = [
                'kode_prov' => $item['kode_prov'] ?? '',
                'provinsi' => $item['provinsi'] ?? '',
                'kode_kabko' => $item['kode_kabko'] ?? '',
                'kabko' => $item['kabko'] ?? '',
                'total_penerima' => (int) ($item['total_penerima'] ?? 0),
                'ingested_date' => now()->toDateString(),
                'created_at' => now(),
                'updated_at' => now()
            ];
        }

        return $transformedData;
    }
}

