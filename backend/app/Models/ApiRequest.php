<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiRequest extends Model
{
    use HasFactory;

    protected $fillable = [
        'api_source_id',
        'name',
        'method',
        'path',
        'path_params',
        'query_params',
        'headers',
        'body',
        'body_format',
        'status',
        'last_executed_at',
    ];

    protected $casts = [
        'path_params' => 'array',
        'query_params' => 'array',
        'headers' => 'array',
        'last_executed_at' => 'datetime',
    ];

    protected $dates = [
        'last_executed_at',
        'created_at',
        'updated_at',
    ];

    /**
     * Get the API source that owns this request.
     */
    public function apiSource(): BelongsTo
    {
        return $this->belongsTo(ApiSource::class);
    }

    /**
     * Scope a query to only include active requests.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Mark the API request as executed.
     */
    public function markAsExecuted()
    {
        $this->update(['last_executed_at' => now()]);
    }

    /**
     * Build the full URL for this request.
     */
    public function buildUrl(): string
    {
        if (!$this->apiSource) {
            return '';
        }

        // Remove trailing slash from base URL if present
        $baseUrl = $this->apiSource->base_url;
        if (substr($baseUrl, -1) === '/') {
            $baseUrl = substr($baseUrl, 0, -1);
        }

        // Handle empty path
        if (empty($this->path) || $this->path === '/') {
            return $baseUrl;
        }

        // Add leading slash to path if not present
        $path = $this->path;
        if (substr($path, 0, 1) !== '/') {
            $path = '/' . $path;
        }

        // Replace path parameters
        if (!empty($this->path_params)) {
            foreach ($this->path_params as $param) {
                if (!empty($param['name']) && isset($param['value'])) {
                    $path = str_replace(
                        '{' . $param['name'] . '}',
                        urlencode($param['value']),
                        $path
                    );
                }
            }
        }

        // Build query string
        $queryString = '';
        if (!empty($this->query_params)) {
            $queryParams = [];
            foreach ($this->query_params as $param) {
                if (!empty($param['name'])) {
                    $queryParams[] = urlencode($param['name']) . '=' . urlencode($param['value'] ?? '');
                }
            }
            if (!empty($queryParams)) {
                $queryString = '?' . implode('&', $queryParams);
            }
        }

        return $baseUrl . $path . $queryString;
    }
}
