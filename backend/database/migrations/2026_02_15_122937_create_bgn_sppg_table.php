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
        Schema::create('bgn_sppg', function (Blueprint $table) {
            $table->id();
            $table->string('periode');
            $table->string('kode_prov');
            $table->string('provinsi');
            $table->string('kode_kab');
            $table->string('kabupaten');
            $table->integer('jumlah_sppg_operasional');
            $table->timestamps();

            // Add unique constraint for periode and kode_kab
            $table->unique(['periode', 'kode_kab'], 'unique_bgn_sppg');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bgn_sppg');
    }
};
