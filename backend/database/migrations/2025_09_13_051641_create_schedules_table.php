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
        Schema::create('schedules', function (Blueprint $table) {
            $table->id();
            $table->enum('schedule_type', ['manual', 'cron'])->default('manual');
            $table->boolean('enabled')->default(true);
            $table->string('cron_expression')->nullable();
            $table->string('cron_description')->nullable();
            $table->string('timezone')->default('Asia/Jakarta');
            $table->integer('max_retries')->default(3);
            $table->integer('retry_delay')->default(5);
            $table->enum('retry_delay_unit', ['seconds', 'minutes', 'hours'])->default('minutes');
            $table->enum('status', ['active', 'inactive', 'paused'])->default('active');

            // Foreign key relationships
            $table->foreignId('api_source_id')->nullable()->constrained('api_sources')->onDelete('cascade');
            $table->foreignId('api_request_id')->nullable()->constrained('api_requests')->onDelete('cascade');
            $table->foreignId('api_extract_id')->nullable()->constrained('api_extracts')->onDelete('cascade');
            $table->foreignId('destination_id')->nullable()->constrained('destinations')->onDelete('cascade');

            $table->timestamps();

            // Indexes for better performance
            $table->index(['schedule_type', 'enabled']);
            $table->index(['status', 'enabled']);
            $table->index('api_source_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('schedules');
    }
};
