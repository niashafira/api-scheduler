<?php

namespace App\Http\Controllers;

use App\Services\TokenConfigService;
use App\Utils\ResponseTransformer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;
use Illuminate\Support\Facades\Http;

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

    /**
     * Proxy token acquisition to avoid browser CORS issues.
     */
    public function testAcquire(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|url',
            'method' => 'nullable|string|in:GET,POST,PUT,PATCH,DELETE',
            'headers' => 'nullable|array',
            'headers.*.key' => 'required_with:headers|string',
            'headers.*.value' => 'required_with:headers|string',
            'body' => 'nullable|string',
            'bodyFormat' => 'nullable|string|in:json,form',
            'tokenPath' => 'required|string',
            'expiresInPath' => 'nullable|string',
            'refreshTokenPath' => 'nullable|string',
        ]);

        try {
            $method = strtoupper($validated['method'] ?? 'POST');
            $endpoint = $validated['endpoint'];
            $body = $validated['body'] ?? null;
            $bodyFormat = $validated['bodyFormat'] ?? 'json';

            // Build headers
            $headers = [];
            if (!empty($validated['headers']) && is_array($validated['headers'])) {
                foreach ($validated['headers'] as $h) {
                    if (!empty($h['key']) && isset($h['value'])) {
                        $headers[$h['key']] = $h['value'];
                    }
                }
            }

            if (!isset($headers['Content-Type'])) {
                $headers['Content-Type'] = $bodyFormat === 'form'
                    ? 'application/x-www-form-urlencoded'
                    : 'application/json';
            }

            // Prepare body
            $payload = null;
            if ($body !== null && $body !== '') {
                if ($bodyFormat === 'form') {
                    // Accept JSON or key=value pre-encoded
                    $parsed = null;
                    try { $parsed = json_decode($body, true, 512, JSON_THROW_ON_ERROR); } catch (\Throwable $e) { $parsed = null; }
                    if (is_array($parsed)) {
                        $payload = http_build_query($parsed);
                    } else {
                        $payload = $body; // assume already encoded
                    }
                } else {
                    // JSON default
                    $parsed = null;
                    try { $parsed = json_decode($body, true, 512, JSON_THROW_ON_ERROR); } catch (\Throwable $e) { $parsed = null; }
                    $payload = $parsed !== null ? json_encode($parsed) : $body;
                }
            }

            $response = Http::withHeaders($headers)
                ->send($method, $endpoint, [ 'body' => $payload ]);

            if (!$response->ok()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Third-party request failed',
                    'status' => $response->status(),
                    'data' => $response->json() ?? $response->body(),
                ], $response->status());
            }

            $data = $response->json();
            if ($data === null) {
                return response()->json([
                    'success' => false,
                    'message' => 'Non-JSON token response received',
                    'data' => $response->body(),
                ], 422);
            }

            // Extract fields server-side using simple dot notation
            $tokenPath = $validated['tokenPath'];
            $expiresInPath = $validated['expiresInPath'] ?? null;
            $refreshTokenPath = $validated['refreshTokenPath'] ?? null;

            $getByPath = function ($obj, $path) {
                $current = $obj;
                foreach (explode('.', $path) as $key) {
                    if (is_array($current) && array_key_exists($key, $current)) {
                        $current = $current[$key];
                    } else {
                        return null;
                    }
                }
                return $current;
            };

            $token = $getByPath($data, $tokenPath);
            if (!$token) {
                return response()->json([
                    'success' => false,
                    'message' => 'No valid token found at path: ' . $tokenPath,
                    'data' => $data,
                ], 422);
            }

            return response()->json([
                'success' => true,
                'token' => $token,
                'expiresIn' => $expiresInPath ? $getByPath($data, $expiresInPath) : null,
                'refreshToken' => $refreshTokenPath ? $getByPath($data, $refreshTokenPath) : null,
                'fullResponse' => $data,
            ]);
        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors()
            ], 422);
        } catch (\Throwable $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to test token acquisition',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
