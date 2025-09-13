<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Schedule extends Model
{
    use HasFactory;

    protected $fillable = [
        'schedule_type',
        'enabled',
        'cron_expression',
        'cron_description',
        'timezone',
        'max_retries',
        'retry_delay',
        'retry_delay_unit',
        'status',
        'api_source_id',
        'api_request_id',
        'api_extract_id',
        'destination_id'
    ];

    protected $casts = [
        'enabled' => 'boolean',
        'max_retries' => 'integer',
        'retry_delay' => 'integer',
        'cron_expression' => 'string',
        'cron_description' => 'string',
        'timezone' => 'string',
        'retry_delay_unit' => 'string',
        'status' => 'string'
    ];

    /**
     * Get the API source that owns the schedule.
     */
    public function apiSource(): BelongsTo
    {
        return $this->belongsTo(ApiSource::class);
    }

    /**
     * Get the API request that owns the schedule.
     */
    public function apiRequest(): BelongsTo
    {
        return $this->belongsTo(ApiRequest::class);
    }

    /**
     * Get the API extract that owns the schedule.
     */
    public function apiExtract(): BelongsTo
    {
        return $this->belongsTo(ApiExtract::class);
    }

    /**
     * Get the destination that owns the schedule.
     */
    public function destination(): BelongsTo
    {
        return $this->belongsTo(Destination::class);
    }
}
