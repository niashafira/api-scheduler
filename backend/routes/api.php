<?php

use App\Http\Controllers\API\DynamicTableController;
use App\Http\Controllers\TokenConfigController;
use App\Http\Controllers\ApiSourceController;
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
Route::apiResource('token-configs', TokenConfigController::class);

// API Source Routes - specific routes must come before resource routes
Route::get('/api-sources/active', [ApiSourceController::class, 'active']);
Route::post('/api-sources/{id}/mark-used', [ApiSourceController::class, 'markAsUsed']);
Route::apiResource('api-sources', ApiSourceController::class);
