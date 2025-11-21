<?php

use App\Http\Controllers\API\DynamicTableController;
use App\Http\Controllers\TokenConfigController;
use App\Http\Controllers\ApiSourceController;
use App\Http\Controllers\ApiRequestController;
use App\Http\Controllers\ApiExtractController;
use App\Http\Controllers\DestinationController;
use App\Http\Controllers\ScheduleController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// Test CORS endpoint
Route::get('/test-cors', function () {
    return response()->json([
        'success' => true,
        'message' => 'CORS is working!',
        'timestamp' => now()
    ]);
});

// Dynamic Table Routes
Route::post('/tables', [DynamicTableController::class, 'createTable']);

// Token Configuration Routes - specific routes must come before resource routes
Route::get('/token-configs/active', [TokenConfigController::class, 'active']);
Route::post('/token-configs/{id}/mark-used', [TokenConfigController::class, 'markAsUsed']);
Route::post('/token-configs/test', [TokenConfigController::class, 'testAcquire']);
Route::apiResource('token-configs', TokenConfigController::class);

// API Source Routes - specific routes must come before resource routes
Route::get('/api-sources/active', [ApiSourceController::class, 'active']);
Route::post('/api-sources/{id}/mark-used', [ApiSourceController::class, 'markAsUsed']);
Route::apiResource('api-sources', ApiSourceController::class);

// API Request Routes - specific routes must come before resource routes
Route::get('/api-requests/active', [ApiRequestController::class, 'active']);
Route::get('/api-requests/source/{sourceId}', [ApiRequestController::class, 'bySource']);
Route::post('/api-requests/{id}/mark-executed', [ApiRequestController::class, 'markAsExecuted']);
Route::apiResource('api-requests', ApiRequestController::class);

// API Extract Routes - specific routes must come before resource routes
Route::get('/api-extracts/active', [ApiExtractController::class, 'active']);
Route::get('/api-extracts/request/{requestId}', [ApiExtractController::class, 'byRequest']);
Route::post('/api-extracts/{id}/mark-executed', [ApiExtractController::class, 'markAsExecuted']);
Route::post('/api-extracts/{id}/test', [ApiExtractController::class, 'testExtraction']);
Route::get('/api-extracts/custom/harga-pangan', [ApiExtractController::class, 'hargaPangan']);
Route::get('/api-extracts/custom/harga-pangan-harian-produsen', [ApiExtractController::class, 'hargaPanganHarianProdusen']);
Route::apiResource('api-extracts', ApiExtractController::class);

// Destination Routes
Route::apiResource('destinations', DestinationController::class);

// Schedule Routes - specific routes must come before resource routes
Route::get('/schedules/active', [ScheduleController::class, 'getActive']);
Route::get('/schedules/cron', [ScheduleController::class, 'getCron']);
Route::get('/schedules/source/{sourceId}', [ScheduleController::class, 'getBySource']);
Route::post('/schedules/{id}/execute', [ScheduleController::class, 'execute']);
Route::apiResource('schedules', ScheduleController::class);
