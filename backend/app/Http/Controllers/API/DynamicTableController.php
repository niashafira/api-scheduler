<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Http\Requests\CreateTableRequest;
use App\Services\DynamicTableService;
use App\Utils\ResponseTransformer;
use Illuminate\Http\JsonResponse;

class DynamicTableController extends Controller
{
    protected $tableService;

    public function __construct(DynamicTableService $tableService)
    {
        $this->tableService = $tableService;
    }

    /**
     * Create a new dynamic table
     *
     * @param CreateTableRequest $request
     * @return JsonResponse
     */
    public function createTable(CreateTableRequest $request): JsonResponse
    {
        $result = $this->tableService->createTable(
            $request->getTableName(),
            $request->getColumns()
        );

        if (!$result['success']) {
            return response()->json([
                'success' => false,
                'message' => $result['message']
            ], 400);
        }

        $transformedData = ResponseTransformer::toCamelCase([
            'table_name' => $result['table_name']
        ]);

        return response()->json([
            'success' => true,
            'message' => $result['message'],
            'data' => $transformedData
        ], 201);
    }
}
