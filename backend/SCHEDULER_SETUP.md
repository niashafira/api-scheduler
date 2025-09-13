# API Call Scheduler Setup Guide

This guide explains how to set up and use the Laravel-based API call scheduler system.

## Overview

The scheduler system allows you to:
- Schedule API calls using cron expressions
- Execute API requests, extract data, and store results
- Monitor schedule execution and failures
- Pause/resume schedules
- Track execution statistics

## Architecture

### Components

1. **Console Commands**
   - `ProcessScheduledTasks`: Runs every minute to check for due schedules
   - `MonitorSchedules`: Monitors schedule health and reports issues

2. **Queue Jobs**
   - `ExecuteScheduledApiCall`: Handles individual schedule execution

3. **Services**
   - `ApiExecutionService`: Orchestrates the API call → extract → store pipeline
   - `ScheduleService`: Manages schedule CRUD operations

4. **Models**
   - `Schedule`: Stores schedule configuration and execution tracking

## Setup Instructions

### 1. Install Dependencies

```bash
cd backend
composer install
```

### 2. Run Migrations

```bash
php artisan migrate
```

### 3. Configure Queue

The system uses Laravel's database queue driver. Ensure your `.env` has:

```env
QUEUE_CONNECTION=database
DB_QUEUE_TABLE=jobs
DB_QUEUE=default
```

### 4. Set Up Cron Job

Add this to your server's crontab to run the scheduler every minute:

```bash
* * * * * cd /path-to-your-project/backend && php artisan schedule:run >> /dev/null 2>&1
```

### 5. Start Queue Worker

Run the queue worker to process scheduled jobs:

```bash
php artisan queue:work --queue=default --tries=3 --timeout=60
```

For production, consider using a process manager like Supervisor.

## Usage

### Creating a Schedule

1. **API Source**: Configure your API endpoint details
2. **API Request**: Define the specific request (method, path, headers, body)
3. **API Extract** (optional): Configure data extraction from response
4. **Destination** (optional): Configure where to store the extracted data
5. **Schedule**: Set up the cron expression and timing

### Schedule Types

- **Cron**: Uses cron expressions (e.g., `0 */6 * * *` for every 6 hours)
- **Manual**: Execute on-demand only

### Cron Expression Examples

- `0 * * * *` - Every hour
- `0 */6 * * *` - Every 6 hours
- `0 0 * * *` - Daily at midnight
- `0 0 * * 1` - Weekly on Monday
- `0 0 1 * *` - Monthly on the 1st

### Monitoring Commands

```bash
# Process scheduled tasks (runs automatically)
php artisan scheduler:process

# Monitor schedule health
php artisan scheduler:monitor

# Check queue status
php artisan queue:work --once
```

### Schedule Management

The `ScheduleService` provides these methods:

```php
// Pause a schedule
$scheduleService->pauseSchedule($id);

// Resume a schedule
$scheduleService->resumeSchedule($id);

// Get statistics
$scheduleService->getScheduleStats();

// Reset failure count
$scheduleService->resetFailureCount($id);

// Execute manually
$scheduleService->executeScheduleManually($id);
```

## Database Schema

### Schedules Table

| Field | Type | Description |
|-------|------|-------------|
| id | bigint | Primary key |
| schedule_type | string | 'cron' or 'manual' |
| enabled | boolean | Whether schedule is active |
| cron_expression | string | Cron expression for timing |
| cron_description | string | Human-readable description |
| timezone | string | Timezone for execution |
| max_retries | integer | Maximum retry attempts |
| retry_delay | integer | Delay between retries |
| retry_delay_unit | string | Unit for retry delay |
| status | string | 'active', 'paused', 'failed' |
| api_source_id | bigint | Related API source |
| api_request_id | bigint | Related API request |
| api_extract_id | bigint | Related API extract |
| destination_id | bigint | Related destination |
| last_executed_at | timestamp | Last execution time |
| next_execution_at | timestamp | Next scheduled execution |
| execution_count | integer | Total executions |
| failure_count | integer | Total failures |

## Execution Flow

1. **Scheduler Process** (`scheduler:process`)
   - Runs every minute
   - Checks all enabled cron schedules
   - Dispatches jobs for due schedules

2. **Job Execution** (`ExecuteScheduledApiCall`)
   - Executes API request
   - Extracts data (if configured)
   - Stores data (if configured)
   - Updates execution timestamps

3. **Monitoring** (`scheduler:monitor`)
   - Checks for failed schedules
   - Identifies stuck schedules
   - Reports stale schedules
   - Displays statistics

## Error Handling

- **Retry Logic**: Jobs retry up to 3 times with exponential backoff
- **Failure Tracking**: Failed schedules are marked and counted
- **Logging**: All operations are logged for debugging
- **Monitoring**: Automated monitoring detects issues

## Production Considerations

### Performance
- Use Redis for queue backend in production
- Consider horizontal scaling with multiple queue workers
- Monitor memory usage and queue depth

### Reliability
- Set up process monitoring for queue workers
- Implement dead letter queues for failed jobs
- Regular database maintenance and cleanup

### Security
- Validate cron expressions to prevent injection
- Sanitize API request data
- Implement rate limiting for API calls

## Troubleshooting

### Common Issues

1. **Schedules not running**
   - Check if cron job is set up correctly
   - Verify queue worker is running
   - Check schedule `enabled` status

2. **API calls failing**
   - Verify API source configuration
   - Check network connectivity
   - Review API request parameters

3. **Data extraction issues**
   - Validate extraction paths
   - Check response format
   - Review field mappings

### Debugging

```bash
# Check schedule status
php artisan scheduler:monitor

# View queue jobs
php artisan queue:work --once --verbose

# Check logs
tail -f storage/logs/laravel.log

# Test specific schedule
php artisan tinker
>>> $schedule = App\Models\Schedule::find(1);
>>> App\Jobs\ExecuteScheduledApiCall::dispatch($schedule);
```

## API Endpoints

The system integrates with your existing API endpoints for:
- Schedule CRUD operations
- Schedule statistics
- Manual execution
- Pause/resume functionality

See your existing API routes for endpoint details.
