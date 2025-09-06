<?php

namespace App\Http\Controllers;

use App\Services\ApiRequestService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ApiRequestController extends Controller
{
    protected $apiRequestService;

    public function __construct(ApiRequestService $apiRequestService)
    {
        $this->apiRequestService = $apiRequestService;
    }

    /**
     * Display a listing of API requests.
     */
    public function index(): JsonResponse
    {
        try {
            $apiRequests = $this->apiRequestService->getAllApiRequests();

            return response()->json([
                'success' => true,
                'data' => $apiRequests,
                'message' => 'API requests retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created API request.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $apiRequest = $this->apiRequestService->createApiRequest($request->all());

            return response()->json([
                'success' => true,
                'data' => $apiRequest,
                'message' => 'API request created successfully'
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
                'message' => 'Failed to create API request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified API request.
     */
    public function show($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiRequest = $this->apiRequestService->getApiRequest($id);

            if (!$apiRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'API request not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $apiRequest,
                'message' => 'API request retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified API request.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiRequest = $this->apiRequestService->updateApiRequest($id, $request->all());

            if (!$apiRequest) {
                return response()->json([
                    'success' => false,
                    'message' => 'API request not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $apiRequest,
                'message' => 'API request updated successfully'
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
                'message' => 'Failed to update API request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified API request.
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $deleted = $this->apiRequestService->deleteApiRequest($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'API request not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API request deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete API request',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get API requests by API source.
     */
    public function bySource($sourceId): JsonResponse
    {
        try {
            // Convert string ID to integer
            $sourceId = (int) $sourceId;
            $apiRequests = $this->apiRequestService->getApiRequestsBySource($sourceId);

            return response()->json([
                'success' => true,
                'data' => $apiRequests,
                'message' => 'API requests retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active API requests.
     */
    public function active(): JsonResponse
    {
        try {
            $apiRequests = $this->apiRequestService->getActiveApiRequests();

            return response()->json([
                'success' => true,
                'data' => $apiRequests,
                'message' => 'Active API requests retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active API requests',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark API request as executed.
     */
    public function markAsExecuted($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $marked = $this->apiRequestService->markApiRequestAsExecuted($id);

            if (!$marked) {
                return response()->json([
                    'success' => false,
                    'message' => 'API request not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API request marked as executed'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark API request as executed',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
