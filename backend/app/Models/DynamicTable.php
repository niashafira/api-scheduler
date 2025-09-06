<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class DynamicTable extends Model
{
    protected $fillable = [
        'table_name',
        'schema',
        'is_active'
    ];

    protected $casts = [
        'schema' => 'array',
        'is_active' => 'boolean'
    ];
}
