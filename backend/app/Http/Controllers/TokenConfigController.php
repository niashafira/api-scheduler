<?php

namespace App\Http\Controllers;

use App\Services\TokenConfigService;
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

            return response()->json([
                'success' => true,
                'data' => $tokenConfigs,
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

            return response()->json([
                'success' => true,
                'data' => $tokenConfig,
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
    public function show(int $id): JsonResponse
    {
        try {
            $tokenConfig = $this->tokenConfigService->getTokenConfig($id);

            if (!$tokenConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $tokenConfig,
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
    public function update(Request $request, int $id): JsonResponse
    {
        try {
            $tokenConfig = $this->tokenConfigService->updateTokenConfig($id, $request->all());

            if (!$tokenConfig) {
                return response()->json([
                    'success' => false,
                    'message' => 'Token configuration not found'
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $tokenConfig,
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
    public function destroy(int $id): JsonResponse
    {
        try {
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

            return response()->json([
                'success' => true,
                'data' => $tokenConfigs,
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
    public function markAsUsed(int $id): JsonResponse
    {
        try {
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
