<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class BgnSppg extends Model
{
    protected $table = 'bgn_sppg';

    protected $fillable = [
        'periode',
        'kode_prov',
        'provinsi',
        'kode_kab',
        'kabupaten',
        'jumlah_sppg_operasional'
    ];

    protected $casts = [
        'jumlah_sppg_operasional' => 'integer'
    ];
}

