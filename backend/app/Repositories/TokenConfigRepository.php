<?php

namespace App\Repositories;

use App\Models\TokenConfig;
use Illuminate\Database\Eloquent\Collection;

class TokenConfigRepository
{
    protected $model;

    public function __construct(TokenConfig $model)
    {
        $this->model = $model;
    }

    public function all(): Collection
    {
        return $this->model->orderBy('created_at', 'desc')->get();
    }

    public function find(int $id): ?TokenConfig
    {
        return $this->model->find($id);
    }

    public function create(array $data): TokenConfig
    {
        return $this->model->create($data);
    }

    public function update(int $id, array $data): bool
    {
        $tokenConfig = $this->find($id);
        if (!$tokenConfig) {
            return false;
        }

        return $tokenConfig->update($data);
    }

    public function delete(int $id): bool
    {
        $tokenConfig = $this->find($id);
        if (!$tokenConfig) {
            return false;
        }

        return $tokenConfig->delete();
    }

    public function active(): Collection
    {
        return $this->model->active()->get();
    }

    public function markAsUsed(int $id): bool
    {
        $tokenConfig = $this->find($id);
        if (!$tokenConfig) {
            return false;
        }

        $tokenConfig->markAsUsed();
        return true;
    }
}
