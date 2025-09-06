<?php

namespace App\Repositories;

use App\Models\ApiRequest;
use Illuminate\Database\Eloquent\Collection;

class ApiRequestRepository
{
    protected $model;

    public function __construct(ApiRequest $model)
    {
        $this->model = $model;
    }

    public function all(): Collection
    {
        return $this->model->with('apiSource')->orderBy('created_at', 'desc')->get();
    }

    public function find(int $id): ?ApiRequest
    {
        return $this->model->with('apiSource')->find($id);
    }

    public function findByApiSource(int $apiSourceId): Collection
    {
        return $this->model->with('apiSource')
            ->where('api_source_id', $apiSourceId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function create(array $data): ApiRequest
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $apiRequest = $this->find($id);
        if (!$apiRequest) {
            return false;
        }

        return $apiRequest->update($data);
    }

    public function delete(int $id): bool
    {
        $apiRequest = $this->find($id);
        if (!$apiRequest) {
            return false;
        }

        return $apiRequest->delete();
    }

    public function active(): Collection
    {
        return $this->model->with('apiSource')->active()->get();
    }

    public function markAsExecuted(int $id): bool
    {
        $apiRequest = $this->find($id);
        if (!$apiRequest) {
            return false;
        }

        $apiRequest->markAsExecuted();
        return true;
    }
}
