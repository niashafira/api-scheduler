<?php

namespace App\Repositories;

use App\Models\ApiSource;
use Illuminate\Database\Eloquent\Collection;

class ApiSourceRepository
{
    protected $model;

    public function __construct(ApiSource $model)
    {
        $this->model = $model;
    }

    public function all(): Collection
    {
        return $this->model->with('tokenConfig')->orderBy('created_at', 'desc')->get();
    }

    public function find(int $id): ?ApiSource
    {
        return $this->model->with('tokenConfig')->find($id);
    }

    public function create(array $data): ApiSource
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $apiSource = $this->find($id);
        if (!$apiSource) {
            return false;
        }

        return $apiSource->update($data);
    }

    public function delete(int $id): bool
    {
        $apiSource = $this->find($id);
        if (!$apiSource) {
            return false;
        }

        return $apiSource->delete();
    }

    public function active(): Collection
    {
        return $this->model->with('tokenConfig')->active()->get();
    }

    public function markAsUsed(int $id): bool
    {
        $apiSource = $this->find($id);
        if (!$apiSource) {
            return false;
        }

        $apiSource->markAsUsed();
        return true;
    }

    public function findByName(string $name): ?ApiSource
    {
        return $this->model->where('name', $name)->first();
    }
}
