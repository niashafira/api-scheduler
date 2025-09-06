<?php

namespace App\Repositories\Interfaces;

use App\Models\ApiSource;
use Illuminate\Database\Eloquent\Collection;

interface ApiSourceRepositoryInterface
{
    public function all(): Collection;
    public function find(int $id): ?ApiSource;
    public function create(array $data): ApiSource;
    public function update(int $id, array $data): bool;
    public function delete(int $id): bool;
    public function active(): Collection;
    public function markAsUsed(int $id): bool;
    public function findByName(string $name): ?ApiSource;
}
