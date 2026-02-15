<?php

namespace App\Http\Controllers;

use App\Services\BgnSppgService;
use App\Repositories\BgnSppgRepository;
use App\Utils\ResponseTransformer;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BgnSppgController extends Controller
{
    protected $service;
    protected $repository;

    public function __construct(
        BgnSppgService $service,
        BgnSppgRepository $repository
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
            $periode = $request->get('periode');
            $kodeProv = $request->get('kode_prov');
            $kodeKab = $request->get('kode_kab');
            
            if ($periode) {
                $data = $this->repository->getDataByPeriode($periode);
            } elseif ($kodeProv) {
                $data = $this->repository->getDataByProvince($kodeProv);
            } elseif ($kodeKab) {
                $data = $this->repository->getDataByKab($kodeKab);
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
}

