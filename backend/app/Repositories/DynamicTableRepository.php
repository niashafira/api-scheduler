<?php

namespace App\Repositories;

use App\Models\DynamicTable;
use App\Repositories\Interfaces\DynamicTableRepositoryInterface;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class DynamicTableRepository implements DynamicTableRepositoryInterface
{
    protected $model;

    public function __construct(DynamicTable $model)
    {
        $this->model = $model;
    }

    /**
     * Create a new dynamic table entry
     *
     * @param array $data
     * @return mixed
     */
    public function create(array $data)
    {
        return $this->model->create($data);
    }

    /**
     * Find a dynamic table by name
     *
     * @param string $tableName
     * @return mixed
     */
    public function findByName(string $tableName)
    {
        return $this->model->where('table_name', $tableName)->first();
    }

    /**
     * Check if a table exists in the database
     *
     * @param string $tableName
     * @return bool
     */
    public function tableExists(string $tableName)
    {
        return Schema::hasTable($tableName);
    }

    /**
     * Create a new database table
     *
     * @param string $tableName
     * @param array $columns
     * @return bool
     */
    public function createTable(string $tableName, array $columns)
    {
        if ($this->tableExists($tableName)) {
            return false;
        }

        try {
            Schema::create($tableName, function ($table) use ($columns) {
                $table->id();

                foreach ($columns as $column) {
                    $name = $column['name'];
                    $type = $column['type'];
                    $nullable = $column['nullable'] ?? false;

                    switch ($type) {
                        case 'string':
                            $length = $column['length'] ?? 255;
                            $tableColumn = $table->string($name, $length);
                            break;
                        case 'integer':
                            $tableColumn = $table->integer($name);
                            break;
                        case 'bigInteger':
                            $tableColumn = $table->bigInteger($name);
                            break;
                        case 'boolean':
                            $tableColumn = $table->boolean($name);
                            break;
                        case 'date':
                            $tableColumn = $table->date($name);
                            break;
                        // dateTime type removed as it's not supported
                        case 'decimal':
                            $precision = $column['precision'] ?? 8;
                            $scale = $column['scale'] ?? 2;
                            $tableColumn = $table->decimal($name, $precision, $scale);
                            break;
                        case 'text':
                            $tableColumn = $table->text($name);
                            break;
                        case 'json':
                            $tableColumn = $table->json($name);
                            break;
                        default:
                            $tableColumn = $table->string($name);
                            break;
                    }

                    if ($nullable) {
                        $tableColumn->nullable();
                    }
                }

                $table->timestamps();
            });

            return true;
        } catch (\Exception $e) {
            return false;
        }
    }
}
