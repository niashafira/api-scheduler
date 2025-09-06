<?php

namespace App\Providers;

use App\Repositories\DynamicTableRepository;
use App\Repositories\Interfaces\DynamicTableRepositoryInterface;
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
    }

    /**
     * Bootstrap services.
     */
    public function boot(): void
    {
        //
    }
}
