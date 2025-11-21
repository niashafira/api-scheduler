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
        Schema::create('harga_pangan_harian_produsen', function (Blueprint $table) {
            $table->id();
            $table->string('kab_kota');
            $table->string('komoditas');
            $table->date('tanggal');
            $table->decimal('harga', 10, 0);
            $table->string('kode_wilayah');
            $table->timestamps();

            // Add index on kode_wilayah
            $table->index('kode_wilayah');

            // Add unique constraint for upsert functionality
            $table->unique(['kode_wilayah', 'komoditas', 'tanggal'], 'unique_harga_pangan_harian_produsen');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('harga_pangan_harian_produsen');
    }
};
