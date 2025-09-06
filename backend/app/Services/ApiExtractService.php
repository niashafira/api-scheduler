<?php

namespace App\Services;

use App\Models\ApiExtract;
use App\Repositories\ApiExtractRepository;
use App\Repositories\ApiRequestRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ApiExtractService
{
    protected $repository;
    protected $apiRequestRepository;
    protected $apiRequestService;

    public function __construct(
        ApiExtractRepository $repository,
        ApiRequestRepository $apiRequestRepository,
        ApiRequestService $apiRequestService
    ) {
        $this->repository = $repository;
        $this->apiRequestRepository = $apiRequestRepository;
        $this->apiRequestService = $apiRequestService;
    }

    public function getAllApiExtracts(): Collection
    {
        return $this->repository->all();
    }

    public function getApiExtract(int $id): ?ApiExtract
    {
        return $this->repository->find($id);
    }

    public function getApiExtractsByRequest(int $apiRequestId): Collection
    {
        return $this->repository->findByApiRequest($apiRequestId);
    }

    public function createApiExtract(array $data): ApiExtract
    {
        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiExtractData($data);

        // Ensure API request exists
        $apiRequestId = $data['api_request_id'];
        $apiRequest = $this->apiRequestRepository->find($apiRequestId);
        if (!$apiRequest) {
            throw new \Exception("API Request with ID {$apiRequestId} not found");
        }

        // Process extraction paths
        if (isset($data['extraction_paths'])) {
            $data['extraction_paths'] = array_filter($data['extraction_paths'], function($path) {
                return !empty($path['name']) && !empty($path['path']);
            });
        }

        return $this->repository->create($data);
    }

    public function updateApiExtract(int $id, array $data): ?ApiExtract
    {
        $apiExtract = $this->repository->find($id);
        if (!$apiExtract) {
            return null;
        }

        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiExtractData($data, $id);

        // Process extraction paths
        if (isset($data['extraction_paths'])) {
            $data['extraction_paths'] = array_filter($data['extraction_paths'], function($path) {
                return !empty($path['name']) && !empty($path['path']);
            });
        }

        $this->repository->update($id, $data);
        return $this->repository->find($id);
    }

    public function deleteApiExtract(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function getActiveApiExtracts(): Collection
    {
        return $this->repository->active();
    }

    public function markApiExtractAsExecuted(int $id): bool
    {
        return $this->repository->markAsExecuted($id);
    }

    public function testExtraction(int $id): ?array
    {
        $apiExtract = $this->repository->find($id);
        if (!$apiExtract) {
            throw new \Exception("API Extract with ID {$id} not found");
        }

        $apiRequest = $apiExtract->apiRequest;
        if (!$apiRequest) {
            throw new \Exception("Associated API Request not found");
        }

        // Execute the API request to get a response
        $response = $this->apiRequestService->executeApiRequest($apiRequest->id);
        if (!$response || !isset($response['data'])) {
            throw new \Exception("Failed to get API response");
        }

        // Extract data from the response
        $extractedData = $apiExtract->extractData($response['data']);
        if ($extractedData === null) {
            throw new \Exception("Failed to extract data from response");
        }

        return [
            'success' => true,
            'data' => $extractedData,
            'response' => $response['data'],
            'count' => count($extractedData),
            'message' => 'Data extracted successfully'
        ];
    }

    public function extractData(int $id, $response): ?array
    {
        return $this->repository->extractData($id, $response);
    }

    protected function validateApiExtractData(array $data, ?int $id = null): void
    {
        $rules = [
            'api_request_id' => 'required|integer|exists:api_requests,id',
            'name' => 'required|string|max:255',
            'root_array_path' => 'nullable|string|max:255',
            'extraction_paths' => 'required|array',
            'extraction_paths.*.name' => 'required|string|max:255',
            'extraction_paths.*.path' => 'required|string|max:255',
            'extraction_paths.*.dataType' => 'nullable|string|in:string,number,boolean,date,array,object',
            'extraction_paths.*.required' => 'nullable|boolean',
            'field_mappings' => 'nullable|array',
            'primary_key_field' => 'nullable|string|max:255',
            'null_value_handling' => 'nullable|string|in:keep,empty,default',
            'date_format' => 'nullable|string|max:255',
            'transform_script' => 'nullable|string',
            'status' => 'nullable|in:active,inactive',
        ];

        $validator = validator($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    /**
     * Convert camelCase field names to snake_case for database compatibility
     */
    protected function convertCamelCaseToSnakeCase(array $data): array
    {
        $fieldMapping = [
            'apiRequestId' => 'api_request_id',
            'rootArrayPath' => 'root_array_path',
            'extractionPaths' => 'extraction_paths',
            'fieldMappings' => 'field_mappings',
            'primaryKeyField' => 'primary_key_field',
            'nullValueHandling' => 'null_value_handling',
            'dateFormat' => 'date_format',
            'transformScript' => 'transform_script',
            'lastExecutedAt' => 'last_executed_at',
        ];

        foreach ($fieldMapping as $camelCase => $snakeCase) {
            if (isset($data[$camelCase])) {
                $data[$snakeCase] = $data[$camelCase];
                unset($data[$camelCase]);
            }
        }

        return $data;
    }
}
