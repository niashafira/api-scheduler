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
        Schema::create('api_requests', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('api_source_id');
            $table->string('name')->nullable();
            $table->string('method')->default('GET');
            $table->string('path')->nullable();
            $table->json('path_params')->nullable();
            $table->json('query_params')->nullable();
            $table->json('headers')->nullable();
            $table->text('body')->nullable();
            $table->string('body_format')->default('json');
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_executed_at')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('api_source_id')->references('id')->on('api_sources')->onDelete('cascade');

            // Indexes
            $table->index('api_source_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_requests');
    }
};
