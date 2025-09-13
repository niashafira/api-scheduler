<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Destination extends Model
{
    protected $fillable = [
        'table_name',
        'columns',
        'include_raw_payload',
        'include_ingested_at',
        'status',
        'api_source_id',
        'api_request_id',
        'api_extract_id'
    ];

    protected $casts = [
        'columns' => 'array',
        'include_raw_payload' => 'boolean',
        'include_ingested_at' => 'boolean',
        'api_source_id' => 'integer',
        'api_request_id' => 'integer',
        'api_extract_id' => 'integer'
    ];

    /**
     * Get the API source that owns the destination.
     */
    public function apiSource()
    {
        return $this->belongsTo(ApiSource::class);
    }

    /**
     * Get the API request that owns the destination.
     */
    public function apiRequest()
    {
        return $this->belongsTo(ApiRequest::class);
    }

    /**
     * Get the API extract that owns the destination.
     */
    public function apiExtract()
    {
        return $this->belongsTo(ApiExtract::class);
    }
}
