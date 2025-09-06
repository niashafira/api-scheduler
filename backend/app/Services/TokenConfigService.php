<?php

namespace App\Services;

use App\Models\TokenConfig;
use App\Repositories\TokenConfigRepository;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Validation\ValidationException;

class TokenConfigService
{
    protected $repository;

    public function __construct(TokenConfigRepository $repository)
    {
        $this->repository = $repository;
    }

    public function getAllTokenConfigs(): Collection
    {
        return $this->repository->all();
    }

    public function getTokenConfig(int $id): ?TokenConfig
    {
        return $this->repository->find($id);
    }

    public function createTokenConfig(array $data): TokenConfig
    {
        $this->validateTokenConfigData($data);

        // Transform headers array to proper format
        if (isset($data['headers']) && is_array($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        return $this->repository->create($data);
    }

    public function updateTokenConfig(int $id, array $data): ?TokenConfig
    {
        $tokenConfig = $this->repository->find($id);
        if (!$tokenConfig) {
            return null;
        }

        $this->validateTokenConfigData($data, $id);

        // Transform headers array to proper format
        if (isset($data['headers']) && is_array($data['headers'])) {
            $data['headers'] = array_filter($data['headers'], function($header) {
                return !empty($header['key']) && !empty($header['value']);
            });
        }

        $this->repository->update($id, $data);
        return $this->repository->find($id);
    }

    public function deleteTokenConfig(int $id): bool
    {
        return $this->repository->delete($id);
    }

    public function getActiveTokenConfigs(): Collection
    {
        return $this->repository->active();
    }

    public function markTokenConfigAsUsed(int $id): bool
    {
        return $this->repository->markAsUsed($id);
    }

    protected function validateTokenConfigData(array $data, ?int $id = null): void
    {
        $rules = [
            'name' => 'required|string|max:255',
            'endpoint' => 'required|url|max:500',
            'method' => 'required|in:GET,POST,PUT,PATCH,DELETE',
            'headers' => 'nullable|array',
            'headers.*.key' => 'required_with:headers|string|max:255',
            'headers.*.value' => 'required_with:headers|string|max:1000',
            'body' => 'nullable|string',
            'tokenPath' => 'required|string|max:255',
            'expiresInPath' => 'nullable|string|max:255',
            'refreshTokenPath' => 'nullable|string|max:255',
            'expiresIn' => 'nullable|integer|min:60|max:86400',
            'refreshEnabled' => 'nullable|boolean',
            'status' => 'nullable|in:active,inactive',
        ];

        if ($id) {
            $rules['name'] .= '|unique:token_configs,name,' . $id;
        } else {
            $rules['name'] .= '|unique:token_configs,name';
        }

        $validator = validator($data, $rules);

        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }
}
