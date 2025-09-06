<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TokenConfig extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'endpoint',
        'method',
        'headers',
        'body',
        'token_path',
        'expires_in_path',
        'refresh_token_path',
        'expires_in',
        'refresh_enabled',
        'status',
        'last_used_at',
    ];

    protected $casts = [
        'headers' => 'array',
        'refresh_enabled' => 'boolean',
        'expires_in' => 'integer',
        'last_used_at' => 'datetime',
    ];

    protected $dates = [
        'last_used_at',
        'created_at',
        'updated_at',
    ];

    public function scopeActive($query)
    {
        return $query->where('status', 'active');
    }

    public function markAsUsed()
    {
        $this->update(['last_used_at' => now()]);
    }
}
