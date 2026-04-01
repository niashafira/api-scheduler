<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('sp2kp_harga_kota', function (Blueprint $table) {
            $table->id();
            $table->string('kode_provinsi', 16);
            $table->string('nama_provinsi', 128);
            $table->string('kode_kabupaten', 16);
            $table->string('nama_kabupaten', 256);
            $table->string('kode_group_komoditas', 32);
            $table->string('nama_group_komoditas', 128);
            $table->string('kode_commodity', 64);
            $table->string('commodity', 256);
            $table->decimal('price', 18, 2);
            $table->string('kode_variant', 64)->nullable();
            $table->string('satuan', 32)->nullable();
            $table->string('kuantitas', 32)->nullable();
            $table->date('tanggal');
            $table->string('sumber', 128)->nullable();
            $table->timestamps();

            $table->unique(
                ['kode_provinsi', 'kode_kabupaten', 'kode_group_komoditas', 'kode_commodity', 'tanggal'],
                'sp2kp_harga_kota_unique_row'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sp2kp_harga_kota');
    }
};
