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

    'bgn' => [
        'api_url' => env('BGN_API_URL', 'https://devapi.bgn.go.id'),
        'username' => env('BGN_USERNAME', 'pusdatin_bapanas'),
        'password' => env('BGN_PASSWORD', 'K0xejsfd9328qu4=3BK'),
        'auth_token' => env('BGN_AUTH_TOKEN', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJhcGlfY2xpZW50X2lkIjoiNmI3MGFkNTAtZmNkNy00ODdkLWFkNzktMzI4MWI0MGY0ZjA0IiwidXNlcm5hbWUiOiJwdXNkYXRpbl9iYXBhbmFzIiwiZ3JvdXBfaWQiOiIiLCJ0eXAiOiJhcGlfY2xpZW50IiwiZXhwIjoxNzcxMTMyNTgyLCJpYXQiOjE3NzExMjg5ODJ9.ogW9TwtcutgZ74hmCRsChqDcJsh9SwOaVCjAY7BbNLE'),
    ],
];
