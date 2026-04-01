<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Sp2kpHargaKota extends Model
{
    protected $table = 'sp2kp_harga_kota';

    protected $fillable = [
        'kode_provinsi',
        'nama_provinsi',
        'kode_kabupaten',
        'nama_kabupaten',
        'kode_group_komoditas',
        'nama_group_komoditas',
        'kode_commodity',
        'commodity',
        'price',
        'kode_variant',
        'satuan',
        'kuantitas',
        'tanggal',
        'sumber',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'tanggal' => 'date',
            'price' => 'decimal:2',
        ];
    }
}
