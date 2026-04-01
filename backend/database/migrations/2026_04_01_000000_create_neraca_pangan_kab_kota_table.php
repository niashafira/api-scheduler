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
        Schema::create('neraca_pangan_kab_kota', function (Blueprint $table) {
            $table->id();
            $table->string('periode');
            $table->string('provinsi');
            $table->string('kabkota');
            $table->string('komoditas');
            $table->string('ketersediaan');
            $table->string('kebutuhan');
            $table->string('neraca');
            $table->string('ketahanan_stok');
            $table->string('status');
            $table->timestamps();

            $table->unique(
                ['periode', 'provinsi', 'kabkota', 'komoditas'],
                'neraca_pangan_kab_kota_periode_prov_kabkota_komoditas_unique'
            );
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('neraca_pangan_kab_kota');
    }
};
