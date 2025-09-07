<?php

namespace App\Http\Controllers;

use App\Services\TokenConfigService;
use App\Utils\ResponseTransformer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class TokenConfigController extends Controller
{
    protected $tokenConfigService;

    public function __construct(TokenConfigService $tokenConfigService)
    {
        $this->tokenConfigService = $tokenConfigService;
    }

    /**
     * Display a listing of token configurations.
     */
    public function index(): JsonResponse
    {
        try {
            $tokenConfigs = $this->tokenConfigService->getAllTokenConfigs();
            $transformedData = ResponseTransformer::transformCollection($tokenConfigs);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Token configurations retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve token configurations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Store a newly created token configuration.
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $tokenConfig = $this->tokenConfigService->createTokenConfig($request->all());
            $transformedData = ResponseTransformer::transformModel($tokenConfig);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Token configuration created successfully'
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
                'message' => 'Failed to create token configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Display the specified token configuration.
     */
    public function show($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $tokenConfig = $this->tokenConfigService->getTokenConfig($id);

            if (!$tokenConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            $transformedData = ResponseTransformer::transformModel($tokenConfig);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Token configuration retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve token configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Update the specified token configuration.
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $tokenConfig = $this->tokenConfigService->updateTokenConfig($id, $request->all());

            if (!$tokenConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            $transformedData = ResponseTransformer::transformModel($tokenConfig);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Token configuration updated successfully'
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
                'message' => 'Failed to update token configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Remove the specified token configuration.
     */
    public function destroy($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $deleted = $this->tokenConfigService->deleteTokenConfig($id);

            if (!$deleted) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Token configuration deleted successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to delete token configuration',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get active token configurations.
     */
    public function active(): JsonResponse
    {
        try {
            $tokenConfigs = $this->tokenConfigService->getActiveTokenConfigs();
            $transformedData = ResponseTransformer::transformCollection($tokenConfigs);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'message' => 'Active token configurations retrieved successfully'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve active token configurations',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Mark token configuration as used.
     */
    public function markAsUsed($id): JsonResponse
    {
        try {
            // Convert string ID to integer
            $id = (int) $id;
            $marked = $this->tokenConfigService->markTokenConfigAsUsed($id);

            if (!$marked) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'message' => 'Token configuration marked as used'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to mark token configuration as used',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
