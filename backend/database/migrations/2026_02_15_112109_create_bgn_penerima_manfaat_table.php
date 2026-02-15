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
        Schema::create('bgn_penerima_manfaat', function (Blueprint $table) {
            $table->id();
            $table->string('kode_prov');
            $table->string('provinsi');
            $table->string('kode_kabko');
            $table->string('kabko');
            $table->integer('total_penerima');
            $table->date('ingested_date');
            $table->timestamps();

            // Add unique constraint for ingested_date and kode_kabko
            $table->unique(['ingested_date', 'kode_kabko'], 'unique_bgn_penerima_manfaat');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('bgn_penerima_manfaat');
    }
};
