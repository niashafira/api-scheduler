<?php

namespace App\Services;

use App\Models\ApiRequest;
use App\Repositories\ApiRequestRepository;
use App\Repositories\ApiSourceRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ApiRequestService
{
    protected $repository;
    protected $apiSourceRepository;

    public function __construct(ApiRequestRepository $repository, ApiSourceRepository $apiSourceRepository)
    {
        $this->repository = $repository;
        $this->apiSourceRepository = $apiSourceRepository;
    }

    public function getAllApiRequests(): Collection
    {
        return $this->repository->all();
    }

    public function getApiRequest(int $id): ?ApiRequest
    {
        return $this->repository->find($id);
    }

    public function getApiRequestsBySource(int $apiSourceId): Collection
    {
        return $this->repository->findByApiSource($apiSourceId);
    }

    public function createApiRequest(array $data): ApiRequest
    {
        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiRequestData($data);

        // Ensure API source exists
        $apiSourceId = $data['api_source_id'];
        $apiSource = $this->apiSourceRepository->find($apiSourceId);
        if (!$apiSource) {
            throw new \Exception("API Source with ID {$apiSourceId} not found");
        }

        // Process arrays
        if (isset($data['path_params'])) {
            $data['path_params'] = array_filter($data['path_params'], function($param) {
                return !empty($param['name']);
            });
        }

        if (isset($data['query_params'])) {
            $data['query_params'] = array_filter($data['query_params'], function($param) {
                return !empty($param['name']);
            });
        }

        if (isset($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        return $this->repository->create($data);
    }

    public function updateApiRequest(int $id, array $data): ?ApiRequest
    {
        $apiRequest = $this->repository->find($id);
        if (!$apiRequest) {
            return null;
        }

        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiRequestData($data, $id);

        // Process arrays
        if (isset($data['path_params'])) {
            $data['path_params'] = array_filter($data['path_params'], function($param) {
                return !empty($param['name']);
            });
        }

        if (isset($data['query_params'])) {
            $data['query_params'] = array_filter($data['query_params'], function($param) {
                return !empty($param['name']);
            });
        }

        if (isset($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        $this->repository->update($id, $data);
        return $this->repository->find($id);
    }

    public function deleteApiRequest(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function getActiveApiRequests(): Collection
    {
        return $this->repository->active();
    }

    public function markApiRequestAsExecuted(int $id): bool
    {
        return $this->repository->markAsExecuted($id);
    }

    protected function validateApiRequestData(array $data, ?int $id = null): void
    {
        $rules = [
            'api_source_id' => 'required|integer|exists:api_sources,id',
            'name' => 'nullable|string|max:255',
            'method' => 'required|string|in:GET,POST,PUT,PATCH,DELETE,HEAD,OPTIONS',
            'path' => 'nullable|string|max:500',
            'path_params' => 'nullable|array',
            'path_params.*.name' => 'required_with:path_params|string|max:255',
            'path_params.*.value' => 'nullable|string|max:255',
            'path_params.*.required' => 'nullable|boolean',
            'query_params' => 'nullable|array',
            'query_params.*.name' => 'required_with:query_params|string|max:255',
            'query_params.*.value' => 'nullable|string|max:255',
            'query_params.*.required' => 'nullable|boolean',
            'headers' => 'nullable|array',
            'headers.*.key' => 'required_with:headers|string|max:255',
            'headers.*.value' => 'required_with:headers|string|max:1000',
            'body' => 'nullable|string',
            'body_format' => 'nullable|string|in:json,form,text',
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
            'apiSourceId' => 'api_source_id',
            'pathParams' => 'path_params',
            'queryParams' => 'query_params',
            'bodyFormat' => 'body_format',
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
