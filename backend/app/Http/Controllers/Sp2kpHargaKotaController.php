<?php

namespace App\Http\Controllers;

use App\Jobs\ProcessSp2kpHargaKotaData;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class Sp2kpHargaKotaController extends Controller
{
    /**
     * Pool SP2KP harga kota from SPLP API and upsert into the database.
     *
     * Body (JSON): { "tgl": "2026-03-25" }
     */
    public function pool(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'tgl' => 'required|date_format:Y-m-d',
        ]);

        $tgl = $validated['tgl'];

        try {
            ProcessSp2kpHargaKotaData::dispatch($tgl);

            return response()->json([
                'success' => true,
                'message' => 'Pool request accepted. Background process is running.',
                'data' => [
                    'tgl' => $tgl,
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
