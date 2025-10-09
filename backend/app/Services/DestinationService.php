<?php

namespace App\Services;

use App\Models\Destination;
use App\Services\DynamicTableService;
use Illuminate\Support\Str;

class DestinationService
{
    protected $dynamicTableService;

    public function __construct(DynamicTableService $dynamicTableService)
    {
        $this->dynamicTableService = $dynamicTableService;
    }

    /**
     * Create a new destination configuration
     *
     * @param array $data
     * @return array
     */
    public function createDestination(array $data)
    {
        try {
            // Validate that at least one column is marked as primary key
            $hasPrimaryKey = collect($data['columns'])->some(function ($column) {
                return $column['isPrimaryKey'] ?? false;
            });

            // if (!$hasPrimaryKey) {
            //     return [
            //         'success' => false,
            //         'message' => 'At least one column must be marked as primary key',
            //     ];
            // }

            // Convert column types to match DynamicTableService expectations
            $convertedColumns = $this->convertColumnsForTableCreation($data['columns']);

            // Create the actual database table
            $tableResult = $this->dynamicTableService->createTable(
                $data['table_name'],
                $convertedColumns
            );

            if (!$tableResult['success']) {
                return [
                    'success' => false,
                    'message' => $tableResult['message'],
                ];
            }

            // Create the destination record
            $destination = Destination::create([
                'table_name' => $data['table_name'],
                'columns' => $data['columns'],
                'include_raw_payload' => $data['include_raw_payload'] ?? true,
                'include_ingested_at' => $data['include_ingested_at'] ?? true,
                'status' => $data['status'] ?? 'active',
                'api_source_id' => $data['api_source_id'] ?? null,
                'api_request_id' => $data['api_request_id'] ?? null,
                'api_extract_id' => $data['api_extract_id'] ?? null,
            ]);

            return [
                'success' => true,
                'message' => 'Destination created successfully',
                'data' => $destination,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to create destination: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Update an existing destination
     *
     * @param Destination $destination
     * @param array $data
     * @return array
     */
    public function updateDestination(Destination $destination, array $data)
    {
        try {
            // Validate that at least one column is marked as primary key
            $hasPrimaryKey = collect($data['columns'])->some(function ($column) {
                return $column['isPrimaryKey'] ?? false;
            });

            // if (!$hasPrimaryKey) {
            //     return [
            //         'success' => false,
            //         'message' => 'At least one column must be marked as primary key',
            //     ];
            // }

            // Update the destination record
            $destination->update([
                'table_name' => $data['table_name'],
                'columns' => $data['columns'],
                'include_raw_payload' => $data['include_raw_payload'] ?? $destination->include_raw_payload,
                'include_ingested_at' => $data['include_ingested_at'] ?? $destination->include_ingested_at,
                'status' => $data['status'] ?? $destination->status,
                'api_source_id' => $data['api_source_id'] ?? $destination->api_source_id,
                'api_request_id' => $data['api_request_id'] ?? $destination->api_request_id,
                'api_extract_id' => $data['api_extract_id'] ?? $destination->api_extract_id,
            ]);

            return [
                'success' => true,
                'message' => 'Destination updated successfully',
                'data' => $destination,
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to update destination: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Delete a destination
     *
     * @param Destination $destination
     * @return array
     */
    public function deleteDestination(Destination $destination)
    {
        try {
            // Note: We don't drop the actual table here as it might contain data
            // In a production environment, you might want to add a flag to indicate
            // whether the table should be dropped or just marked as inactive

            $destination->delete();

            return [
                'success' => true,
                'message' => 'Destination deleted successfully',
            ];
        } catch (\Exception $e) {
            return [
                'success' => false,
                'message' => 'Failed to delete destination: ' . $e->getMessage(),
            ];
        }
    }

    /**
     * Convert frontend column format to DynamicTableService format
     *
     * @param array $columns
     * @return array
     */
    private function convertColumnsForTableCreation(array $columns)
    {
        return collect($columns)->map(function ($column) {
            $converted = [
                'name' => $column['name'],
                'type' => $this->convertColumnType($column['type']),
            ];

            if (isset($column['nullable'])) {
                $converted['nullable'] = $column['nullable'];
            }

            // Extract length from VARCHAR(255) format
            if (preg_match('/^VARCHAR\((\d+)\)$/i', $column['type'], $matches)) {
                $converted['length'] = (int) $matches[1];
            }

            // Extract precision and scale from DECIMAL(10,2) format
            if (preg_match('/^DECIMAL\((\d+),(\d+)\)$/i', $column['type'], $matches)) {
                $converted['precision'] = (int) $matches[1];
                $converted['scale'] = (int) $matches[2];
            }

            return $converted;
        })->toArray();
    }

    /**
     * Convert frontend column type to DynamicTableService type
     *
     * @param string $type
     * @return string
     */
    private function convertColumnType(string $type)
    {
        // Handle VARCHAR(255) format
        if (preg_match('/^VARCHAR\((\d+)\)$/i', $type, $matches)) {
            return 'string';
        }

        // Handle DECIMAL(10,2) format
        if (preg_match('/^DECIMAL\((\d+),(\d+)\)$/i', $type, $matches)) {
            return 'decimal';
        }

        // Handle other types (case insensitive)
        $mapping = [
            'TEXT' => 'text',
            'INTEGER' => 'integer',
            'BIGINT' => 'bigInteger',
            'BOOLEAN' => 'boolean',
            'DATE' => 'date',
            'TIMESTAMP' => 'timestamp',
            'JSONB' => 'json',
            'UUID' => 'string', // UUID is typically stored as string in Laravel
        ];

        // Convert to uppercase for mapping lookup
        $upperType = strtoupper($type);
        return $mapping[$upperType] ?? 'string';
    }
}
