<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    |
    | This file is for storing the credentials for third party services such
    | as Mailgun, Postmark, AWS and more. This file provides the de facto
    | location for this type of information, allowing packages to have
    | a conventional file to locate the various service credentials.
    |
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'ses' => [
        'key' => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel' => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    'harga_pangan' => [
        'api_url' => env('HARGA_PANGAN_API_URL', 'https://webapi.badanpangan.go.id/api/panel-harga-pangan-v2/data-harian-provkabkota'),
        'api_key' => env('HARGA_PANGAN_API_KEY', 'jISkop4xnPYUl54GyKvCdHPnJkxw2n3l0EnXd8A2S7SQDbo7L2Dl6c8peXSwH3zu'),
    ],
    'neraca_pangan' => [
        'api_url' => env('NERACA_PANGAN_API_URL', 'https://proyeksineracapangan.badanpangan.go.id/api/summary'),
        'api_key' => env('NERACA_PANGAN_API_KEY', 'sAxriNG5PHhgM2lJTSaZXv2X9Rxghe3Ai5IjuGm1tfFsKzuXgh6vRR7vsOHuyjBy'),
    ],

    // 'neraca_pangan' => [
    //     // env() returns '' if .env sets empty string — use ?: so the base URL is never missing
    //     'api_url' => trim((string) env('NERACA_PANGAN_API_URL', '')) ?: 'https://proyeksineracapangan.badanpangan.go.id/api/summary',
    //     'api_key' => trim((string) env('NERACA_PANGAN_API_KEY', '')) ?: 'sAxriNG5PHhgM2lJTSaZXv2X9Rxghe3Ai5IjuGm1tfFsKzuXgh6vRR7vsOHuyjBy',
    //     // cURL 60 on Windows: unset/blank NERACA_PANGAN_HTTP_VERIFY => verify only when APP_ENV is production.
    //     'http_verify_ssl' => env('NERACA_PANGAN_HTTP_VERIFY') !== null && trim((string) env('NERACA_PANGAN_HTTP_VERIFY')) !== ''
    //         ? filter_var(env('NERACA_PANGAN_HTTP_VERIFY'), FILTER_VALIDATE_BOOLEAN)
    //         : env('APP_ENV') === 'production',
    // ],

    'bgn' => [
        'api_url' => env('BGN_API_URL', 'https://devapi.bgn.go.id'),
        'username' => env('BGN_USERNAME', 'pusdatin_bapanas'),
        'password' => env('BGN_PASSWORD', 'K0xejsfd9328qu4=3BK'),
        'auth_token' => env('BGN_AUTH_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfY2xpZW50X2lkIjoiNmI3MGFkNTAtZmNkNy00ODdkLWFkNzktMzI4MWI0MGY0ZjA0IiwidXNlcm5hbWUiOiJwdXNkYXRpbl9iYXBhbmFzIiwiZ3JvdXBfaWQiOiIiLCJ0eXAiOiJhcGlfY2xpZW50IiwiZXhwIjoxNzcxMTMyNTgyLCJpYXQiOjE3NzExMjg5ODJ9.ogW9TwtcutgZ74hmCRsChqDcJsh9SwOaVCjAY7BbNLE'),
    ],

    /*
    | SPLP / SP2KP Harga Kota (oauth + getHargaKota). Adjust credentials in this file as needed.
    */
    'sp2kp' => [
        'oauth_url' => 'https://splp.layanan.go.id/oauth2/token',
        'data_url' => 'https://api-splp.layanan.go.id/komoditi/1.0/getHargaKota',
        'oauth_username' => 'badanpangan_splp',
        'oauth_password' => 'panganSPLP@123',
        'oauth_basic_base64' => 'Wmk3WkxyVXJFYTI5QXZ6QWRjc0pEdDdpWFdjYTpnZ1FzbWpnbDFQRXVmV0FkcU5OZG1GM1lmeU1h',
        'x_api_key' => '7as7SbY5t1ct9geKgF2aj0tEnkoZDRZCPIl13B6t',
        'http_verify_ssl' => true,
        'rate_limit_per_minute' => 10,
    ],
];
