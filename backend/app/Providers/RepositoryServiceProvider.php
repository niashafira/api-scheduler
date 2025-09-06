<?php

namespace App\Providers;

use App\Repositories\DynamicTableRepository;
use App\Repositories\Interfaces\DynamicTableRepositoryInterface;
use App\Repositories\TokenConfigRepository;
use App\Repositories\ApiSourceRepository;
use App\Repositories\ApiRequestRepository;
use App\Repositories\ApiExtractRepository;
use App\Repositories\Interfaces\ApiSourceRepositoryInterface;
use App\Services\TokenConfigService;
use App\Services\ApiSourceService;
use App\Services\ApiRequestService;
use App\Services\ApiExtractService;
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

        $this->app->bind(
            ApiSourceRepositoryInterface::class,
            ApiSourceRepository::class
        );

        $this->app->bind(TokenConfigRepository::class);
        $this->app->bind(TokenConfigService::class);
        $this->app->bind(ApiSourceRepository::class);
        $this->app->bind(ApiSourceService::class);
        $this->app->bind(ApiRequestRepository::class);
        $this->app->bind(ApiRequestService::class);
        $this->app->bind(ApiExtractRepository::class);
        $this->app->bind(ApiExtractService::class);
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
