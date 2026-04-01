<?php

namespace App\Logging;

use Illuminate\Support\Facades\Log;
use Psr\Log\LoggerInterface;

/**
 * Resolves the sp2kp_harga_kota log channel, or falls back to the default channel
 * if the custom channel is missing (e.g. stale config cache after deploy).
 */
final class Sp2kpHargaKotaLogger
{
    public static function logger(): LoggerInterface
    {
        $name = 'sp2kp_harga_kota';
        if (isset(config('logging.channels')[$name])) {
            return Log::channel($name);
        }

        return Log::channel(config('logging.default', 'stack'));
    }
}
