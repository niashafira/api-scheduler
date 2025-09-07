<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ApiSource extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'base_url',
        'auth_type',
        'headers',
        'username',
        'password',
        'token',
        'api_key_name',
        'api_key_value',
        'api_key_location',
        'token_config_id',
        'status',
        'last_used_at',
    ];

    protected $casts = [
        'headers' => 'array',
        'last_used_at' => 'datetime',
    ];

    protected $dates = [
        'last_used_at',
        'created_at',
        'updated_at',
    ];

    protected $hidden = [
        'password',
        'token',
        'api_key_value',
    ];

    /**
     * Get the token configuration associated with this API source.
     */
    public function tokenConfig(): BelongsTo
    {
        return $this->belongsTo(TokenConfig::class);
    }

    /**
     * Scope a query to only include active sources.
     */
    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    /**
     * Mark the API source as used.
     */
    public function markAsUsed()
    {
        $this->update(['last_used_at' => now()]);
    }

    /**
     * Get the authentication configuration for this source.
     */
    public function getAuthConfig(): array
    {
        switch ($this->auth_type) {
            case 'basic':
                return [
                    'type' => 'basic',
                    'username' => $this->username,
                    'password' => $this->password,
                ];
            case 'bearer':
                return [
                    'type' => 'bearer',
                    'token' => $this->token,
                ];
            case 'apiKey':
                return [
                    'type' => 'apiKey',
                    'name' => $this->api_key_name,
                    'value' => $this->api_key_value,
                    'location' => $this->api_key_location,
                ];
            case 'token':
                return [
                    'type' => 'token',
                    'config_id' => $this->token_config_id,
                    'config' => $this->tokenConfig,
                ];
            default:
                return ['type' => 'none'];
        }
    }
}
