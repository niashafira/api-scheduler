<?php

namespace App\Http\Controllers;

use App\Services\BgnPenerimaManfaatService;
use App\Repositories\BgnPenerimaManfaatRepository;
use App\Utils\ResponseTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BgnPenerimaManfaatController extends Controller
{
    protected $service;
    protected $repository;

    public function __construct(
        BgnPenerimaManfaatService $service,
        BgnPenerimaManfaatRepository $repository
    ) {
        $this->service = $service;
        $this->repository = $repository;
    }

    /**
     * Fetch and store data from BGN API
     */
    public function fetchAndStore(): JsonResponse
    {
        try {
            $result = $this->service->fetchAndStoreData();

            if (!$result['success']) {
                return response()->json([
                    'success' => false,
                    'message' => $result['message']
                ], 500);
            }

            return response()->json([
                'success' => true,
                'message' => $result['message'],
                'data' => [
                    'count' => $result['count']
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch and store data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get all data from database
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $kodeProv = $request->get('kode_prov');
            
            if ($kodeProv) {
                $data = $this->repository->getDataByProvince($kodeProv);
            } else {
                $data = $this->repository->getAllData();
            }

            $transformedData = ResponseTransformer::toCamelCase($data);

            return response()->json([
                'success' => true,
                'data' => $transformedData,
                'count' => count($data)
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve data',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Get data by kabko code
     */
    public function show(string $kodeKabko): JsonResponse
    {
        try {
            $data = $this->repository->getDataByKabko($kodeKabko);

            if (!$data) {
                return response()->json([
                    'success' => false,
                    'message' => 'Data not found'
                ], 404);
            }

            $transformedData = ResponseTransformer::toCamelCase($data->toArray());

            return response()->json([
                'success' => true,
                'data' => $transformedData
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve data',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}

