<?php

namespace App\Http\Controllers;

use App\Http\Requests\CreateDestinationRequest;
use App\Models\Destination;
use App\Services\DestinationService;
use App\Utils\ResponseTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class DestinationController extends Controller
{
    protected $destinationService;

    public function __construct(DestinationService $destinationService)
    {
        $this->destinationService = $destinationService;
    }

    /**
     * Display a listing of the resource.
     */
    public function index(Request $request): JsonResponse
    {
        $query = Destination::with(['apiSource', 'apiRequest', 'apiExtract']);

        // Filter by source ID if provided
        if ($request->has('source_id')) {
            $query->where('api_source_id', $request->get('source_id'));
        }

        // Filter by request ID if provided
        if ($request->has('request_id')) {
            $query->where('api_request_id', $request->get('request_id'));
        }

        // Filter by extract ID if provided
        if ($request->has('extract_id')) {
            $query->where('api_extract_id', $request->get('extract_id'));
        }

        $destinations = $query->get();

        $transformedData = ResponseTransformer::toCamelCase($destinations->toArray());

        return response()->json([
            'success' => true,
            'data' => $transformedData
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(CreateDestinationRequest $request): JsonResponse
    {
        $result = $this->destinationService->createDestination($request->validated());

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        $transformedData = ResponseTransformer::toCamelCase($result['data']->toArray());

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $transformedData
        ], 201);
    }

    /**
     * Display the specified resource.
     */
    public function show(Destination $destination): JsonResponse
    {
        $destination->load(['apiSource', 'apiRequest', 'apiExtract']);

        $transformedData = ResponseTransformer::toCamelCase($destination->toArray());

        return response()->json([
            'success' => true,
            'data' => $transformedData
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(CreateDestinationRequest $request, Destination $destination): JsonResponse
    {
        $result = $this->destinationService->updateDestination($destination, $request->validated());

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        $transformedData = ResponseTransformer::toCamelCase($result['data']->toArray());

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $transformedData
        ]);
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(Destination $destination): JsonResponse
    {
        $result = $this->destinationService->deleteDestination($destination);

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        return response()->json([
            'success' => true,
            'message' => $result['message']
        ]);
    }
}
