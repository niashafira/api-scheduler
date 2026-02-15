<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BgnPenerimaManfaat extends Model
{
    protected $table = 'bgn_penerima_manfaat';

    protected $fillable = [
        'kode_prov',
        'provinsi',
        'kode_kabko',
        'kabko',
        'total_penerima',
        'ingested_date'
    ];

    protected $casts = [
        'total_penerima' => 'integer',
        'ingested_date' => 'date'
    ];
}

