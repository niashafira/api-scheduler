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
        Schema::table('api_extracts', function (Blueprint $table) {
            // Drop the old primary_key_field column
            $table->dropColumn('primary_key_field');

            // Add the new primary_key_fields JSON column
            $table->json('primary_key_fields')->nullable();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('api_extracts', function (Blueprint $table) {
            // Drop the new primary_key_fields column
            $table->dropColumn('primary_key_fields');

            // Add back the old primary_key_field column
            $table->string('primary_key_field')->nullable();
        });
    }
};
