<?php

namespace App\Http\Controllers;

use App\Services\ApiExtractService;
use App\Services\HargaPanganService;
use App\Utils\ResponseTransformer;
use App\Models\HargaPangan;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ApiExtractController extends Controller
{
    protected $apiExtractService;
    protected $hargaPanganService;

    public function __construct(ApiExtractService $apiExtractService, HargaPanganService $hargaPanganService)
    {
        $this->apiExtractService = $apiExtractService;
        $this->hargaPanganService = $hargaPanganService;
    }

    /**
     * Display a listing of API extracts.
     */
    public function index(): JsonResponse
    {
        try {
            $apiExtracts = $this->apiExtractService->getAllApiExtracts();
            $transformedData = ResponseTransformer::transformCollection($apiExtracts);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'API extracts retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API extracts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created API extract.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $apiExtract = $this->apiExtractService->createApiExtract($request->all());
            $transformedData = ResponseTransformer::transformModel($apiExtract);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'API extract created successfully'
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
                'message' => 'Failed to create API extract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified API extract.
     */
    public function show($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiExtract = $this->apiExtractService->getApiExtract($id);

            if (!$apiExtract) {
                return response()->json([
                    'success' => false,
                    'message' => 'API extract not found'
                ], 404);
            }

            $transformedData = ResponseTransformer::transformModel($apiExtract);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'API extract retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API extract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified API extract.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $apiExtract = $this->apiExtractService->updateApiExtract($id, $request->all());

            if (!$apiExtract) {
                return response()->json([
                    'success' => false,
                    'message' => 'API extract not found'
                ], 404);
            }

            $transformedData = ResponseTransformer::transformModel($apiExtract);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'API extract updated successfully'
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
                'message' => 'Failed to update API extract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified API extract.
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $deleted = $this->apiExtractService->deleteApiExtract($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'API extract not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API extract deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete API extract',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get API extracts by API request.
     */
    public function byRequest($requestId): JsonResponse
    {
        try {
            // Convert string ID to integer
            $requestId = (int) $requestId;
            $apiExtracts = $this->apiExtractService->getApiExtractsByRequest($requestId);
            $transformedData = ResponseTransformer::transformCollection($apiExtracts);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'API extracts retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve API extracts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active API extracts.
     */
    public function active(): JsonResponse
    {
        try {
            $apiExtracts = $this->apiExtractService->getActiveApiExtracts();
            $transformedData = ResponseTransformer::transformCollection($apiExtracts);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Active API extracts retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active API extracts',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark API extract as executed.
     */
    public function markAsExecuted($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $marked = $this->apiExtractService->markApiExtractAsExecuted($id);

            if (!$marked) {
                return response()->json([
                    'success' => false,
                    'message' => 'API extract not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'API extract marked as executed'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark API extract as executed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Test extraction with live API data.
     */
    public function testExtraction($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $result = $this->apiExtractService->testExtraction($id);
            $transformedData = ResponseTransformer::toCamelCase($result['data']);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'response' => $result['response'],
                'count' => $result['count'],
                'message' => 'Extraction test completed successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Extraction test failed',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get harga pangan data with date range and region code filter.
     */
    public function hargaPangan(Request $request): JsonResponse
    {
        try {
            // Validate required parameters
            $request->validate([
                'startDate' => 'required|date',
                'endDate' => 'required|date|after_or_equal:startDate'
            ]);

            $startDate = $request->input('startDate');
            $endDate = $request->input('endDate');

            // Use the service to get data
            $hargaPanganData = $this->hargaPanganService->getHargaPanganData($startDate, $endDate);
            $transformedData = ResponseTransformer::transformCollection(collect($hargaPanganData));

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'count' => count($hargaPanganData),
                'filters' => [
                    'startDate' => $startDate,
                    'endDate' => $endDate
                ],
                'message' => 'Harga pangan data retrieved successfully'
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
                'message' => 'Failed to retrieve harga pangan data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
