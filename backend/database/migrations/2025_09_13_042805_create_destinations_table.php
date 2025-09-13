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
        Schema::create('destinations', function (Blueprint $table) {
            $table->id();
            $table->string('table_name');
            $table->json('columns');
            $table->boolean('include_raw_payload')->default(true);
            $table->boolean('include_ingested_at')->default(true);
            $table->string('status')->default('active');
            $table->unsignedBigInteger('api_source_id')->nullable();
            $table->unsignedBigInteger('api_request_id')->nullable();
            $table->unsignedBigInteger('api_extract_id')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('api_source_id')->references('id')->on('api_sources')->onDelete('cascade');
            $table->foreign('api_request_id')->references('id')->on('api_requests')->onDelete('cascade');
            $table->foreign('api_extract_id')->references('id')->on('api_extracts')->onDelete('cascade');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('destinations');
    }
};
