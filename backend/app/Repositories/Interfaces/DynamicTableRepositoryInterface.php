<?php

namespace App\Repositories\Interfaces;

interface DynamicTableRepositoryInterface
{
    /**
     * Create a new dynamic table entry
     *
     * @param array $data
     * @return mixed
     */
    public function create(array $data);

    /**
     * Find a dynamic table by name
     *
     * @param string $tableName
     * @return mixed
     */
    public function findByName(string $tableName);

    /**
     * Check if a table exists in the database
     *
     * @param string $tableName
     * @return bool
     */
    public function tableExists(string $tableName);

    /**
     * Create a new database table
     *
     * @param string $tableName
     * @param array $columns
     * @return bool
     */
    public function createTable(string $tableName, array $columns);
}
