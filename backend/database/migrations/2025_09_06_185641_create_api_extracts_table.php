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
        Schema::create('api_extracts', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('api_request_id');
            $table->string('name');
            $table->string('root_array_path')->nullable();
            $table->json('extraction_paths');
            $table->json('field_mappings')->nullable();
            $table->json('primary_key_fields')->nullable();
            $table->enum('null_value_handling', ['keep', 'empty', 'default'])->default('keep');
            $table->string('date_format')->nullable();
            $table->text('transform_script')->nullable();
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('api_request_id')->references('id')->on('api_requests')->onDelete('cascade');

            // Indexes
            $table->index('api_request_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_extracts');
    }
};
