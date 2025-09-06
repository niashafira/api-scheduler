<?php

namespace App\Providers;

use App\Repositories\DynamicTableRepository;
use App\Repositories\Interfaces\DynamicTableRepositoryInterface;
use App\Repositories\TokenConfigRepository;
use App\Services\TokenConfigService;
use Illuminate\Support\ServiceProvider;

class RepositoryServiceProvider extends ServiceProvider
{
    /**
     * Register services.
     */
    public function register(): void
    {
        $this->app->bind(
            DynamicTableRepositoryInterface::class,
            DynamicTableRepository::class
        );

        $this->app->bind(TokenConfigRepository::class);
        $this->app->bind(TokenConfigService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
