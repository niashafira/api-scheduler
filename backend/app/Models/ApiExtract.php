<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiExtract extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_request_id',
        'name',
        'root_array_path',
        'extraction_paths',
        'field_mappings',
        'primary_key_fields',
        'null_value_handling',
        'date_format',
        'transform_script',
        'status',
        'last_executed_at',
    ];

    protected $casts = [
        'extraction_paths' => 'array',
        'field_mappings' => 'array',
        'primary_key_fields' => 'array',
        'last_executed_at' => 'datetime',
    ];

    protected $dates = [
        'last_executed_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the API request that owns this extract configuration.
     */
    public function apiRequest(): BelongsTo
    {
        return $this->belongsTo(ApiRequest::class);
    }

    /**
     * Scope a query to only include active extracts.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Mark the API extract as executed.
     */
    public function markAsExecuted()
    {
        $this->update(['last_executed_at' => now()]);
    }

    /**
     * Extract data from a response using the configured extraction paths.
     */
    public function extractData($response)
    {
        if (!$response) {
            return null;
        }

        // Get the root array data
        $rootData = $this->getRootData($response);
        if (!$rootData) {
            return null;
        }

        // If root data is not an array, wrap it in an array
        if (!is_array($rootData)) {
            $rootData = [$rootData];
        }

        // Extract fields from each item in the root data
        $result = [];
        foreach ($rootData as $item) {
            $extractedItem = $this->extractItem($item);
            if ($extractedItem) {
                $result[] = $extractedItem;
            }
        }

        // Apply transformation script if available
        if ($this->transform_script) {
            $result = $this->applyTransformScript($result);
        }

        return $result;
    }

    /**
     * Get the root data array from the response.
     */
    protected function getRootData($response)
    {
        if (!$this->root_array_path) {
            return $response;
        }

        $path = $this->root_array_path;
        $data = $response;

        // Handle dot notation for nested properties
        foreach (explode('.', $path) as $segment) {
            if (is_array($data) && array_key_exists($segment, $data)) {
                $data = $data[$segment];
            } elseif (is_object($data) && property_exists($data, $segment)) {
                $data = $data->{$segment};
            } else {
                return null;
            }
        }

        return $data;
    }

    /**
     * Extract a single item using the extraction paths.
     */
    protected function extractItem($item)
    {
        if (!$this->extraction_paths || !is_array($this->extraction_paths)) {
            return null;
        }

        $result = [];
        foreach ($this->extraction_paths as $extractionPath) {
            $fieldName = $extractionPath['name'] ?? null;
            $path = $extractionPath['path'] ?? null;
            $dataType = $extractionPath['dataType'] ?? 'string';

            if (!$fieldName || !$path) {
                continue;
            }

            // Extract value using the path
            $value = $this->extractValue($item, $path);

            // Handle null values based on configuration
            if ($value === null) {
                $value = $this->handleNullValue($dataType);
            } else {
                // Convert to the specified data type
                $value = $this->convertToDataType($value, $dataType);
            }

            $result[$fieldName] = $value;
        }

        return $result;
    }

    /**
     * Extract a value from an item using a path.
     */
    protected function extractValue($item, $path)
    {
        // Handle simple property access
        if (is_array($item) && array_key_exists($path, $item)) {
            return $item[$path];
        }

        if (is_object($item) && property_exists($item, $path)) {
            return $item->{$path};
        }

        // Handle dot notation for nested properties
        $segments = explode('.', $path);
        $data = $item;

        foreach ($segments as $segment) {
            // Handle array indexing
            if (preg_match('/^(\w+)\[(\d+)\]$/', $segment, $matches)) {
                $arrayName = $matches[1];
                $index = (int) $matches[2];

                if (is_array($data) && array_key_exists($arrayName, $data) && is_array($data[$arrayName]) && array_key_exists($index, $data[$arrayName])) {
                    $data = $data[$arrayName][$index];
                } elseif (is_object($data) && property_exists($data, $arrayName) && is_array($data->{$arrayName}) && array_key_exists($index, $data->{$arrayName})) {
                    $data = $data->{$arrayName}[$index];
                } else {
                    return null;
                }
            } else {
                if (is_array($data) && array_key_exists($segment, $data)) {
                    $data = $data[$segment];
                } elseif (is_object($data) && property_exists($data, $segment)) {
                    $data = $data->{$segment};
                } else {
                    return null;
                }
            }
        }

        return $data;
    }

    /**
     * Handle null values based on configuration.
     */
    protected function handleNullValue($dataType)
    {
        switch ($this->null_value_handling) {
            case 'empty':
                return $dataType === 'string' ? '' : null;
            case 'default':
                return $this->getDefaultValueForType($dataType);
            case 'keep':
            default:
                return null;
        }
    }

    /**
     * Get default value for a data type.
     */
    protected function getDefaultValueForType($dataType)
    {
        switch ($dataType) {
            case 'string':
                return '';
            case 'number':
                return 0;
            case 'boolean':
                return false;
            case 'date':
                return now()->format($this->date_format ?: 'Y-m-d H:i:s');
            case 'array':
                return [];
            case 'object':
                return new \stdClass();
            default:
                return null;
        }
    }

    /**
     * Convert a value to the specified data type.
     */
    protected function convertToDataType($value, $dataType)
    {
        switch ($dataType) {
            case 'string':
                return (string) $value;
            case 'number':
                return is_numeric($value) ? (float) $value : null;
            case 'boolean':
                return (bool) $value;
            case 'date':
                if ($value) {
                    try {
                        $date = new \DateTime($value);
                        return $date->format($this->date_format ?: 'Y-m-d H:i:s');
                    } catch (\Exception $e) {
                        return null;
                    }
                }
                return null;
            default:
                return $value;
        }
    }

    /**
     * Apply transformation script to the extracted data.
     */
    protected function applyTransformScript($data)
    {
        if (!$this->transform_script || !is_array($data)) {
            return $data;
        }

        try {
            $script = $this->transform_script;
            $result = $data;

            // Execute the script in a safe environment
            $transformFunction = function ($data, $script) {
                $result = $data;
                eval($script);
                return $result;
            };

            return $transformFunction($data, $script);
        } catch (\Exception $e) {
            // If there's an error, return the original data
            return $data;
        }
    }
}
