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
        Schema::create('token_configs', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->string('endpoint');
            $table->enum('method', ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'])->default('POST');
            $table->json('headers')->nullable();
            $table->text('body')->nullable();
            $table->string('token_path');
            $table->string('expires_in_path')->nullable();
            $table->string('refresh_token_path')->nullable();
            $table->integer('expires_in')->default(3600);
            $table->boolean('refresh_enabled')->default(false);
            $table->enum('status', ['active', 'inactive'])->default('active');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('token_configs');
    }
};
