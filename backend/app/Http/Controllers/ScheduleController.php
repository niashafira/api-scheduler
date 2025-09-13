<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateScheduleRequest;
use App\Services\ScheduleService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ScheduleController extends Controller
{
    protected $scheduleService;

    public function __construct(ScheduleService $scheduleService)
    {
        $this->scheduleService = $scheduleService;
    }

    /**
     * Display a listing of schedules.
     */
    public function index(Request $request): JsonResponse
    {
        $filters = $request->only([
            'source_id',
            'request_id',
            'extract_id',
            'destination_id',
            'schedule_type',
            'enabled',
            'status'
        ]);

        $result = $this->scheduleService->getAllSchedules($filters);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Store a newly created schedule.
     */
    public function store(CreateScheduleRequest $request): JsonResponse
    {
        $result = $this->scheduleService->createSchedule($request->validated());

        return response()->json($result, $result['success'] ? 201 : 400);
    }

    /**
     * Display the specified schedule.
     */
    public function show(int $id): JsonResponse
    {
        $result = $this->scheduleService->getScheduleById($id);

        return response()->json($result, $result['success'] ? 200 : 404);
    }

    /**
     * Update the specified schedule.
     */
    public function update(CreateScheduleRequest $request, int $id): JsonResponse
    {
        $result = $this->scheduleService->updateSchedule($id, $request->validated());

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Remove the specified schedule.
     */
    public function destroy(int $id): JsonResponse
    {
        $result = $this->scheduleService->deleteSchedule($id);

        return response()->json($result, $result['success'] ? 200 : 404);
    }

    /**
     * Get schedules by source ID.
     */
    public function getBySource(int $sourceId): JsonResponse
    {
        $result = $this->scheduleService->getSchedulesBySource($sourceId);

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get active schedules.
     */
    public function getActive(): JsonResponse
    {
        $result = $this->scheduleService->getActiveSchedules();

        return response()->json($result, $result['success'] ? 200 : 400);
    }

    /**
     * Get cron schedules.
     */
    public function getCron(): JsonResponse
    {
        $result = $this->scheduleService->getCronSchedules();

        return response()->json($result, $result['success'] ? 200 : 400);
    }
}
