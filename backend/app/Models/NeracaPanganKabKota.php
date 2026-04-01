<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class NeracaPanganKabKota extends Model
{
    protected $table = 'neraca_pangan_kab_kota';

    protected $fillable = [
        'periode',
        'provinsi',
        'kabkota',
        'komoditas',
        'ketersediaan',
        'kebutuhan',
        'neraca',
        'ketahanan_stok',
        'status',
    ];
}
