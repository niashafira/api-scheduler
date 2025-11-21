<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HargaPanganHarianProdusen extends Model
{
    protected $table = 'harga_pangan_harian_produsen';

    protected $fillable = [
        'kab_kota',
        'komoditas',
        'tanggal',
        'harga',
        'kode_wilayah'
    ];

    protected $casts = [
        'tanggal' => 'date',
        'harga' => 'decimal:0'
    ];
}
