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

        if (!Schema::hasColumn('neraca_pangan_kab_kota', 'komoditas')) {
            Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
                $table->string('komoditas')->after('kabkota');
            });

            Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
                $table->dropUnique('neraca_pangan_kab_kota_periode_prov_kabkota_unique');
            });

            Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
                $table->unique(
                    ['periode', 'provinsi', 'kabkota', 'komoditas'],
                    'neraca_pangan_kab_kota_periode_prov_kabkota_komoditas_unique'
                );
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

        if (!Schema::hasColumn('neraca_pangan_kab_kota', 'komoditas')) {
            return;
        }

        Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
            $table->dropUnique('neraca_pangan_kab_kota_periode_prov_kabkota_komoditas_unique');
        });

        Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
            $table->unique(['periode', 'provinsi', 'kabkota'], 'neraca_pangan_kab_kota_periode_prov_kabkota_unique');
        });

        Schema::table('neraca_pangan_kab_kota', function (Blueprint $table) {
            $table->dropColumn('komoditas');
        });
    }
};
