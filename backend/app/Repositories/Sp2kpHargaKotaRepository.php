<?php

namespace App\Repositories;

use App\Logging\Sp2kpHargaKotaLogger;
use App\Models\Sp2kpHargaKota;

class Sp2kpHargaKotaRepository
{
    /**
     * @param  array<int, array<string, mixed>>  $records
     */
    public function upsertRecords(array $records): void
    {
        try {
            foreach ($records as $record) {
                Sp2kpHargaKota::updateOrCreate(
                    [
                        'kode_provinsi' => $record['kode_provinsi'],
                        'kode_kabupaten' => $record['kode_kabupaten'],
                        'kode_group_komoditas' => $record['kode_group_komoditas'],
                        'kode_commodity' => $record['kode_commodity'],
                        'tanggal' => $record['tanggal'],
                    ],
                    [
                        'nama_provinsi' => $record['nama_provinsi'],
                        'nama_kabupaten' => $record['nama_kabupaten'],
                        'nama_group_komoditas' => $record['nama_group_komoditas'],
                        'commodity' => $record['commodity'],
                        'price' => $record['price'],
                        'kode_variant' => $record['kode_variant'],
                        'satuan' => $record['satuan'],
                        'kuantitas' => $record['kuantitas'],
                        'sumber' => $record['sumber'],
                    ]
                );
            }
        } catch (\Exception $e) {
            Sp2kpHargaKotaLogger::logger()->error('Failed to upsert sp2kp_harga_kota: '.$e->getMessage());
            throw $e;
        }
    }
}
