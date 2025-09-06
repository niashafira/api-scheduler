<?php

namespace App\Services;

use App\Models\ApiSource;
use App\Repositories\ApiSourceRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class ApiSourceService
{
    protected $repository;

    public function __construct(ApiSourceRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getAllApiSources(): Collection
    {
        return $this->repository->all();
    }

    public function getApiSource(int $id): ?ApiSource
    {
        return $this->repository->find($id);
    }

    public function createApiSource(array $data): ApiSource
    {
        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiSourceData($data);

        // Transform headers array to proper format
        if (isset($data['headers']) && is_array($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        // Handle token configuration
        if (isset($data['token_config']) && is_array($data['token_config'])) {
            $tokenConfig = $data['token_config'];
            if (isset($tokenConfig['selectedConfigId'])) {
                $data['token_config_id'] = $tokenConfig['selectedConfigId'];
            }
            unset($data['token_config']);
        }

        return $this->repository->create($data);
    }

    public function updateApiSource(int $id, array $data): ?ApiSource
    {
        $apiSource = $this->repository->find($id);
        if (!$apiSource) {
            return null;
        }

        // Convert camelCase to snake_case for database fields
        $data = $this->convertCamelCaseToSnakeCase($data);

        $this->validateApiSourceData($data, $id);

        // Transform headers array to proper format
        if (isset($data['headers']) && is_array($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        // Handle token configuration
        if (isset($data['token_config']) && is_array($data['token_config'])) {
            $tokenConfig = $data['token_config'];
            if (isset($tokenConfig['selectedConfigId'])) {
                $data['token_config_id'] = $tokenConfig['selectedConfigId'];
            }
            unset($data['token_config']);
        }

        $this->repository->update($id, $data);
        return $this->repository->find($id);
    }

    public function deleteApiSource(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function getActiveApiSources(): Collection
    {
        return $this->repository->active();
    }

    public function markApiSourceAsUsed(int $id): bool
    {
        return $this->repository->markAsUsed($id);
    }

    protected function validateApiSourceData(array $data, ?int $id = null): void
    {
        $rules = [
            'name' => 'required|string|max:255',
            'base_url' => 'required|url|max:500',
            'auth_type' => 'required|in:none,basic,bearer,apiKey,token,oauth2',
            'headers' => 'nullable|array',
            'headers.*.key' => 'required_with:headers|string|max:255',
            'headers.*.value' => 'required_with:headers|string|max:1000',
            'username' => 'nullable|string|max:255',
            'password' => 'nullable|string|max:255',
            'token' => 'nullable|string',
            'api_key_name' => 'nullable|string|max:255',
            'api_key_value' => 'nullable|string|max:255',
            'api_key_location' => 'nullable|in:header,query',
            'token_config_id' => 'nullable|integer|exists:token_configs,id',
            'save_credentials' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
        ];

        // Add conditional validation based on auth type
        if (isset($data['auth_type'])) {
            switch ($data['auth_type']) {
                case 'basic':
                    $rules['username'] = 'required|string|max:255';
                    $rules['password'] = 'required|string|max:255';
                    break;
                case 'bearer':
                    $rules['token'] = 'required|string';
                    break;
                case 'apiKey':
                    $rules['api_key_name'] = 'required|string|max:255';
                    $rules['api_key_value'] = 'required|string|max:255';
                    $rules['api_key_location'] = 'required|in:header,query';
                    break;
            }
        }

        if ($id) {
            $rules['name'] .= '|unique:api_sources,name,' . $id;
        } else {
            $rules['name'] .= '|unique:api_sources,name';
        }

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
            'baseUrl' => 'base_url',
            'authType' => 'auth_type',
            'apiKeyName' => 'api_key_name',
            'apiKeyValue' => 'api_key_value',
            'apiKeyLocation' => 'api_key_location',
            'tokenConfig' => 'token_config',
            'saveCredentials' => 'save_credentials',
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
