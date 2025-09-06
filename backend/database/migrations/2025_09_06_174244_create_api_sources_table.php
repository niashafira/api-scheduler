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
        Schema::create('api_sources', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('base_url');
            $table->enum('auth_type', ['none', 'basic', 'bearer', 'apiKey', 'token', 'oauth2'])->default('none');
            $table->json('headers')->nullable();
            $table->string('username')->nullable(); // for basic auth
            $table->string('password')->nullable(); // for basic auth
            $table->text('token')->nullable(); // for bearer token
            $table->string('api_key_name')->nullable(); // for API key auth
            $table->string('api_key_value')->nullable(); // for API key auth
            $table->enum('api_key_location', ['header', 'query'])->nullable(); // for API key auth
            $table->unsignedBigInteger('token_config_id')->nullable(); // for token-based auth
            $table->boolean('save_credentials')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            // Foreign key constraint
            $table->foreign('token_config_id')->references('id')->on('token_configs')->onDelete('set null');

            // Indexes
            $table->index('status');
            $table->index('auth_type');
            $table->index('token_config_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('api_sources');
    }
};
