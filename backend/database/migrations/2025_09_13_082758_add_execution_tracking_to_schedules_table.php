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
        Schema::table('schedules', function (Blueprint $table) {
            $table->timestamp('last_executed_at')->nullable()->after('status');
            $table->timestamp('next_execution_at')->nullable()->after('last_executed_at');
            $table->integer('execution_count')->default(0)->after('next_execution_at');
            $table->integer('failure_count')->default(0)->after('execution_count');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('schedules', function (Blueprint $table) {
            $table->dropColumn([
                'last_executed_at',
                'next_execution_at',
                'execution_count',
                'failure_count'
            ]);
        });
    }
};
