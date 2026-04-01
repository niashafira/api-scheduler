<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessNeracaPanganKabKotaData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NeracaPanganKabKotaController extends Controller
{
    /**
     * Pool neraca pangan kab/kota from the external API and upsert into the database.
     *
     * Body (JSON): { "periode_awal": "2026-04", "periode_akhir": "2026-04" }
     * Or send a single "periode" to use for both awal and akhir.
     */
    public function pool(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'periode_awal' => 'nullable|string|max:32',
            'periode_akhir' => 'nullable|string|max:32',
            'periode' => 'nullable|string|max:32',
        ]);

        $periodeAwal = $validated['periode_awal'] ?? $validated['periode'] ?? null;
        $periodeAkhir = $validated['periode_akhir'] ?? $validated['periode'] ?? null;

        if ($periodeAwal === null || $periodeAkhir === null) {
            return response()->json([
                'success' => false,
                'message' => 'Provide periode_awal and periode_akhir, or a single periode for both.',
            ], 422);
        }

        try {
            ProcessNeracaPanganKabKotaData::dispatch($periodeAwal, $periodeAkhir);

            return response()->json([
                'success' => true,
                'message' => 'Pool request accepted. Background process is running.',
                'data' => [
                    'periodeAwal' => $periodeAwal,
                    'periodeAkhir' => $periodeAkhir,
                ],
            ], 202);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to dispatch background pool job.',
                'error' => $e->getMessage(),
            ], 500);
        }
    }
}
