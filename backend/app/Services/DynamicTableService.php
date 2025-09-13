<?php

namespace App\Services;

use App\Repositories\Interfaces\DynamicTableRepositoryInterface;
use Illuminate\Support\Str;

class DynamicTableService
{
    protected $repository;

    public function __construct(DynamicTableRepositoryInterface $repository)
    {
        $this->repository = $repository;
    }

    /**
     * Create a new dynamic table
     *
     * @param string $tableName
     * @param array $columns
     * @return array
     */
    public function createTable(string $tableName, array $columns)
    {
        // Sanitize table name
        $tableName = $this->sanitizeTableName($tableName);

        // Check if table already exists
        if ($this->repository->tableExists($tableName)) {
            return [
                'success' => false,
                'message' => "Table '{$tableName}' already exists",
            ];
        }

        // Validate columns
        $validatedColumns = $this->validateColumns($columns);

        if (!$validatedColumns['valid']) {
            return [
                'success' => false,
                'message' => $validatedColumns['message'],
            ];
        }

        // Create the table
        $tableCreated = $this->repository->createTable($tableName, $validatedColumns['columns']);

        if (!$tableCreated) {
            return [
                'success' => false,
                'message' => "Failed to create table '{$tableName}'",
            ];
        }

        // Store table metadata
        $this->repository->create([
            'table_name' => $tableName,
            'schema' => $validatedColumns['columns'],
            'is_active' => true,
        ]);

        return [
            'success' => true,
            'message' => "Table '{$tableName}' created successfully",
            'table_name' => $tableName,
        ];
    }

    /**
     * Sanitize table name
     *
     * @param string $tableName
     * @return string
     */
    private function sanitizeTableName(string $tableName)
    {
        // Convert to snake_case
        $tableName = Str::snake($tableName);

        // Remove any characters that are not alphanumeric or underscore
        $tableName = preg_replace('/[^a-z0-9_]/', '', $tableName);

        // Ensure name starts with a letter
        if (!preg_match('/^[a-z]/', $tableName)) {
            $tableName = 'tbl_' . $tableName;
        }

        return $tableName;
    }

    /**
     * Validate columns
     *
     * @param array $columns
     * @return array
     */
    private function validateColumns(array $columns)
    {
        $validColumns = [];
        $supportedTypes = [
            'string', 'integer', 'bigInteger', 'boolean',
            'date', 'timestamp', 'decimal', 'text', 'json'
        ];

        foreach ($columns as $column) {
            // Check required fields
            if (!isset($column['name']) || !isset($column['type'])) {
                return [
                    'valid' => false,
                    'message' => 'Each column must have a name and type',
                ];
            }

            // Sanitize column name
            $columnName = Str::snake($column['name']);
            $columnName = preg_replace('/[^a-z0-9_]/', '', $columnName);

            if (empty($columnName)) {
                return [
                    'valid' => false,
                    'message' => "Invalid column name: {$column['name']}",
                ];
            }

            // Check column type
            $columnType = strtolower($column['type']);
            if (!in_array($columnType, $supportedTypes)) {
                return [
                    'valid' => false,
                    'message' => "Unsupported column type: {$column['type']}",
                ];
            }

            // Build validated column
            $validColumn = [
                'name' => $columnName,
                'type' => $columnType,
            ];

            // Add optional attributes
            if (isset($column['nullable'])) {
                $validColumn['nullable'] = (bool) $column['nullable'];
            }

            if ($columnType === 'string' && isset($column['length'])) {
                $validColumn['length'] = (int) $column['length'];
            }

            if ($columnType === 'decimal') {
                $validColumn['precision'] = isset($column['precision']) ? (int) $column['precision'] : 8;
                $validColumn['scale'] = isset($column['scale']) ? (int) $column['scale'] : 2;
            }

            $validColumns[] = $validColumn;
        }

        return [
            'valid' => true,
            'columns' => $validColumns,
        ];
    }
}
