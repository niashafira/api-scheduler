<?php

namespace App\Services;

use App\Models\Schedule;
use App\Repositories\ScheduleRepository;
use App\Utils\ResponseTransformer;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Log;

class ScheduleService
{
    protected $scheduleRepository;

    public function __construct(ScheduleRepository $scheduleRepository)
    {
        $this->scheduleRepository = $scheduleRepository;
    }

    /**
     * Get all schedules with optional filtering.
     */
    public function getAllSchedules(array $filters = []): array
    {
        try {
            $schedules = $this->scheduleRepository->getAll($filters);

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedules->toArray()),
                'message' => 'Schedules retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get schedules: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Failed to retrieve schedules: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get schedule by ID.
     */
    public function getScheduleById(int $id): array
    {
        try {
            $schedule = $this->scheduleRepository->getById($id);

            if (!$schedule) {
                return [
                    'success' => false,
                    'data' => null,
                    'message' => 'Schedule not found'
                ];
            }

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedule->toArray()),
                'message' => 'Schedule retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get schedule by ID: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => null,
                'message' => 'Failed to retrieve schedule: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Create a new schedule.
     */
    public function createSchedule(array $data): array
    {
        try {
            // Validate required relationships
            $this->validateScheduleRelationships($data);

            // Prepare schedule data
            $scheduleData = $this->prepareScheduleData($data);

            // Create the schedule
            $schedule = $this->scheduleRepository->create($scheduleData);

            // Load relationships
            $schedule->load(['apiSource', 'apiRequest', 'apiExtract', 'destination']);

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedule->toArray()),
                'message' => 'Schedule created successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to create schedule: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => null,
                'message' => 'Failed to create schedule: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Update schedule by ID.
     */
    public function updateSchedule(int $id, array $data): array
    {
        try {
            // Validate required relationships
            $this->validateScheduleRelationships($data);

            // Prepare schedule data
            $scheduleData = $this->prepareScheduleData($data);

            // Update the schedule
            $updated = $this->scheduleRepository->update($id, $scheduleData);

            if (!$updated) {
                return [
                    'success' => false,
                    'data' => null,
                    'message' => 'Schedule not found or update failed'
                ];
            }

            // Get updated schedule with relationships
            $schedule = $this->scheduleRepository->getById($id);

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedule->toArray()),
                'message' => 'Schedule updated successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to update schedule: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => null,
                'message' => 'Failed to update schedule: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Delete schedule by ID.
     */
    public function deleteSchedule(int $id): array
    {
        try {
            $deleted = $this->scheduleRepository->delete($id);

            if (!$deleted) {
                return [
                    'success' => false,
                    'data' => null,
                    'message' => 'Schedule not found or delete failed'
                ];
            }

            return [
                'success' => true,
                'data' => null,
                'message' => 'Schedule deleted successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to delete schedule: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => null,
                'message' => 'Failed to delete schedule: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get schedules by source ID.
     */
    public function getSchedulesBySource(int $sourceId): array
    {
        try {
            $schedules = $this->scheduleRepository->getBySourceId($sourceId);

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedules->toArray()),
                'message' => 'Schedules retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get schedules by source: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Failed to retrieve schedules: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get active schedules for execution.
     */
    public function getActiveSchedules(): array
    {
        try {
            $schedules = $this->scheduleRepository->getActiveSchedules();

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedules->toArray()),
                'message' => 'Active schedules retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get active schedules: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Failed to retrieve active schedules: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Get cron schedules for execution.
     */
    public function getCronSchedules(): array
    {
        try {
            $schedules = $this->scheduleRepository->getCronSchedules();

            return [
                'success' => true,
                'data' => ResponseTransformer::toCamelCase($schedules->toArray()),
                'message' => 'Cron schedules retrieved successfully'
            ];
        } catch (\Exception $e) {
            Log::error('Failed to get cron schedules: ' . $e->getMessage());

            return [
                'success' => false,
                'data' => [],
                'message' => 'Failed to retrieve cron schedules: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Validate schedule relationships.
     */
    private function validateScheduleRelationships(array $data): void
    {
        // At least one relationship should be provided
        $hasRelationship = !empty($data['api_source_id']) ||
                          !empty($data['api_request_id']) ||
                          !empty($data['api_extract_id']) ||
                          !empty($data['destination_id']);

        if (!$hasRelationship) {
            throw new \InvalidArgumentException('At least one relationship (api_source_id, api_request_id, api_extract_id, or destination_id) must be provided.');
        }
    }

    /**
     * Prepare schedule data for storage.
     */
    private function prepareScheduleData(array $data): array
    {
        $preparedData = [
            'schedule_type' => $data['schedule_type'] ?? 'manual',
            'enabled' => $data['enabled'] ?? true,
            'timezone' => $data['timezone'] ?? 'Asia/Jakarta',
            'max_retries' => $data['max_retries'] ?? 3,
            'retry_delay' => $data['retry_delay'] ?? 5,
            'retry_delay_unit' => $data['retry_delay_unit'] ?? 'minutes',
            'status' => $data['status'] ?? 'active',
            'api_source_id' => $data['api_source_id'] ?? null,
            'api_request_id' => $data['api_request_id'] ?? null,
            'api_extract_id' => $data['api_extract_id'] ?? null,
            'destination_id' => $data['destination_id'] ?? null,
        ];

        // Add cron-specific data if schedule type is cron
        if ($preparedData['schedule_type'] === 'cron') {
            $preparedData['cron_expression'] = $data['cron_expression'] ?? null;
            $preparedData['cron_description'] = $data['cron_description'] ?? null;
        }

        return $preparedData;
    }
}
