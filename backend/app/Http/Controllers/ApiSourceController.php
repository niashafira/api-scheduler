<?php

namespace App\Http\Controllers;

use App\Services\ApiSourceService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ApiSourceController extends Controller
{
    protected $apiSourceService;

    public function __construct(ApiSourceService $apiSourceService)
    {
        $this->apiSourceService = $apiSourceService;
    }

    /**
     * Display a listing of API sources.
     */
    public function index(): JsonResponse
    {
        try {
            $apiSources = $this->apiSourceService->getAllApiSources();

            return response()->json([
                'success' => true,
                'data' => $apiSources,
                'message' => 'API sources retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API sources',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created API source.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $apiSource = $this->apiSourceService->createApiSource($request->all());

            return response()->json([
                'success' => true,
                'data' => $apiSource,
                'message' => 'API source created successfully'
            ], 201);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to create API source',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified API source.
     */
    public function show($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiSource = $this->apiSourceService->getApiSource($id);

            if (!$apiSource) {
                return response()->json([
                    'success' => false,
                    'message' => 'API source not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $apiSource,
                'message' => 'API source retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API source',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified API source.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiSource = $this->apiSourceService->updateApiSource($id, $request->all());

            if (!$apiSource) {
                return response()->json([
                    'success' => false,
                    'message' => 'API source not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $apiSource,
                'message' => 'API source updated successfully'
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update API source',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified API source.
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $deleted = $this->apiSourceService->deleteApiSource($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'API source not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API source deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete API source',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active API sources.
     */
    public function active(): JsonResponse
    {
        try {
            $apiSources = $this->apiSourceService->getActiveApiSources();

            return response()->json([
                'success' => true,
                'data' => $apiSources,
                'message' => 'Active API sources retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active API sources',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark API source as used.
     */
    public function markAsUsed($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $marked = $this->apiSourceService->markApiSourceAsUsed($id);

            if (!$marked) {
                return response()->json([
                    'success' => false,
                    'message' => 'API source not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API source marked as used'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark API source as used',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
