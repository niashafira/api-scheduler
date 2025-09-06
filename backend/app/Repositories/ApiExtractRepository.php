<?php

namespace App\Repositories;

use App\Models\ApiExtract;
use Illuminate\Database\Eloquent\Collection;

class ApiExtractRepository
{
    protected $model;

    public function __construct(ApiExtract $model)
    {
        $this->model = $model;
    }

    public function all(): Collection
    {
        return $this->model->with('apiRequest')->orderBy('created_at', 'desc')->get();
    }

    public function find(int $id): ?ApiExtract
    {
        return $this->model->with('apiRequest')->find($id);
    }

    public function findByApiRequest(int $apiRequestId): Collection
    {
        return $this->model->with('apiRequest')
            ->where('api_request_id', $apiRequestId)
            ->orderBy('created_at', 'desc')
            ->get();
    }

    public function create(array $data): ApiExtract
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $apiExtract = $this->find($id);
        if (!$apiExtract) {
            return false;
        }

        return $apiExtract->update($data);
    }

    public function delete(int $id): bool
    {
        $apiExtract = $this->find($id);
        if (!$apiExtract) {
            return false;
        }

        return $apiExtract->delete();
    }

    public function active(): Collection
    {
        return $this->model->with('apiRequest')->active()->get();
    }

    public function markAsExecuted(int $id): bool
    {
        $apiExtract = $this->find($id);
        if (!$apiExtract) {
            return false;
        }

        $apiExtract->markAsExecuted();
        return true;
    }

    public function extractData(int $id, $response): ?array
    {
        $apiExtract = $this->find($id);
        if (!$apiExtract) {
            return null;
        }

        return $apiExtract->extractData($response);
    }
}
