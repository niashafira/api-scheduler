<?php

namespace App\Repositories;

use App\Models\Schedule;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;

class ScheduleRepository
{
    protected $model;

    public function __construct(Schedule $model)
    {
        $this->model = $model;
    }

    /**
     * Get all schedules with optional filtering.
     */
    public function getAll(array $filters = []): Collection
    {
        $query = $this->model->with(['apiSource', 'apiRequest', 'apiExtract', 'destination']);

        // Apply filters
        if (isset($filters['source_id'])) {
            $query->where('api_source_id', $filters['source_id']);
        }

        if (isset($filters['request_id'])) {
            $query->where('api_request_id', $filters['request_id']);
        }

        if (isset($filters['extract_id'])) {
            $query->where('api_extract_id', $filters['extract_id']);
        }

        if (isset($filters['destination_id'])) {
            $query->where('destination_id', $filters['destination_id']);
        }

        if (isset($filters['schedule_type'])) {
            $query->where('schedule_type', $filters['schedule_type']);
        }

        if (isset($filters['enabled'])) {
            $query->where('enabled', $filters['enabled']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        return $query->orderBy('created_at', 'desc')->get();
    }

    /**
     * Get schedule by ID.
     */
    public function getById(int $id): ?Model
    {
        return $this->model->with(['apiSource', 'apiRequest', 'apiExtract', 'destination'])->find($id);
    }

    /**
     * Create a new schedule.
     */
    public function create(array $data): Model
    {
        return $this->model->create($data);
    }

    /**
     * Update schedule by ID.
     */
    public function update(int $id, array $data): bool
    {
        $schedule = $this->model->find($id);

        if (!$schedule) {
            return false;
        }

        return $schedule->update($data);
    }

    /**
     * Delete schedule by ID.
     */
    public function delete(int $id): bool
    {
        $schedule = $this->model->find($id);

        if (!$schedule) {
            return false;
        }

        return $schedule->delete();
    }

    /**
     * Get schedules by source ID.
     */
    public function getBySourceId(int $sourceId): Collection
    {
        return $this->model
            ->where('api_source_id', $sourceId)
            ->with(['apiSource', 'apiRequest', 'apiExtract', 'destination'])
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Get active schedules.
     */
    public function getActiveSchedules(): Collection
    {
        return $this->model
            ->where('enabled', true)
            ->where('status', 'active')
            ->with(['apiSource', 'apiRequest', 'apiExtract', 'destination'])
            ->get();
    }

    /**
     * Get cron schedules.
     */
    public function getCronSchedules(): Collection
    {
        return $this->model
            ->where('schedule_type', 'cron')
            ->where('enabled', true)
            ->where('status', 'active')
            ->whereNotNull('cron_expression')
            ->with(['apiSource', 'apiRequest', 'apiExtract', 'destination'])
            ->get();
    }
}
