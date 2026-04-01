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
        if (!Schema::hasTable('neraca_pangan_kab_kota')) {
            return;
        }

        if (
            Schema::hasColumn('neraca_pangan_kab_kota', 'kebutuhan_stok')
            && !Schema::hasColumn('neraca_pangan_kab_kota', 'ketahanan_stok')
        ) {
            Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
                $table->renameColumn('kebutuhan_stok', 'ketahanan_stok');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        if (!Schema::hasTable('neraca_pangan_kab_kota')) {
            return;
        }

        if (
            Schema::hasColumn('neraca_pangan_kab_kota', 'ketahanan_stok')
            && !Schema::hasColumn('neraca_pangan_kab_kota', 'kebutuhan_stok')
        ) {
            Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
                $table->renameColumn('ketahanan_stok', 'kebutuhan_stok');
            });
        }
    }
};
