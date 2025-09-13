<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class CreateScheduleRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Prepare the data for validation.
     */
    protected function prepareForValidation(): void
    {
        $data = $this->all();
        $convertedData = [
            'schedule_type' => $data['scheduleType'] ?? $data['schedule_type'] ?? 'manual',
            'enabled' => $data['enabled'] ?? true,
            'cron_expression' => $data['cronExpression'] ?? $data['cron_expression'] ?? null,
            'cron_description' => $data['cronDescription'] ?? $data['cron_description'] ?? null,
            'timezone' => $data['timezone'] ?? 'Asia/Jakarta',
            'max_retries' => $data['maxRetries'] ?? $data['max_retries'] ?? 3,
            'retry_delay' => $data['retryDelay'] ?? $data['retry_delay'] ?? 5,
            'retry_delay_unit' => $data['retryDelayUnit'] ?? $data['retry_delay_unit'] ?? 'minutes',
            'status' => $data['status'] ?? 'active',
            'api_source_id' => $data['apiSourceId'] ?? $data['api_source_id'] ?? null,
            'api_request_id' => $data['apiRequestId'] ?? $data['api_request_id'] ?? null,
            'api_extract_id' => $data['apiExtractId'] ?? $data['api_extract_id'] ?? null,
            'destination_id' => $data['destinationId'] ?? $data['destination_id'] ?? null,
        ];

        $this->merge($convertedData);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'schedule_type' => ['required', 'string', 'in:manual,cron'],
            'enabled' => ['boolean'],
            'cron_expression' => [
                'nullable',
                'string',
                function ($attribute, $value, $fail) {
                    if ($this->input('schedule_type') === 'cron' && empty($value)) {
                        $fail('Cron expression is required when schedule type is cron.');
                    }
                    if (!empty($value)) {
                        // Basic cron validation (6 fields: second minute hour day month weekday)
                        $cronRegex = '/^(\*|([0-5]?\d)) (\*|([0-5]?\d)) (\*|(2[0-3]|[01]?\d)) (\*|(3[01]|[12]\d|0?[1-9])) (\*|(1[0-2]|0?[1-9])) (\*|([0-6]))$/';
                        if (!preg_match($cronRegex, $value)) {
                            $fail('Invalid cron expression format. Expected format: second minute hour day month weekday');
                        }
                    }
                }
            ],
            'cron_description' => ['nullable', 'string', 'max:255'],
            'timezone' => ['required', 'string', 'max:50'],
            'max_retries' => ['required', 'integer', 'min:0', 'max:10'],
            'retry_delay' => ['required', 'integer', 'min:1', 'max:3600'],
            'retry_delay_unit' => ['required', 'string', 'in:seconds,minutes,hours'],
            'status' => ['required', 'string', 'in:active,inactive,paused'],
            'api_source_id' => ['nullable', 'integer', 'exists:api_sources,id'],
            'api_request_id' => ['nullable', 'integer', 'exists:api_requests,id'],
            'api_extract_id' => ['nullable', 'integer', 'exists:api_extracts,id'],
            'destination_id' => ['nullable', 'integer', 'exists:destinations,id'],
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array<string, string>
     */
    public function messages(): array
    {
        return [
            'schedule_type.required' => 'Schedule type is required.',
            'schedule_type.in' => 'Schedule type must be either manual or cron.',
            'enabled.boolean' => 'Enabled must be a boolean value.',
            'cron_expression.required' => 'Cron expression is required for cron schedule type.',
            'cron_description.max' => 'Cron description may not be greater than 255 characters.',
            'timezone.required' => 'Timezone is required.',
            'timezone.max' => 'Timezone may not be greater than 50 characters.',
            'max_retries.required' => 'Max retries is required.',
            'max_retries.integer' => 'Max retries must be an integer.',
            'max_retries.min' => 'Max retries must be at least 0.',
            'max_retries.max' => 'Max retries may not be greater than 10.',
            'retry_delay.required' => 'Retry delay is required.',
            'retry_delay.integer' => 'Retry delay must be an integer.',
            'retry_delay.min' => 'Retry delay must be at least 1.',
            'retry_delay.max' => 'Retry delay may not be greater than 3600.',
            'retry_delay_unit.required' => 'Retry delay unit is required.',
            'retry_delay_unit.in' => 'Retry delay unit must be seconds, minutes, or hours.',
            'status.required' => 'Status is required.',
            'status.in' => 'Status must be active, inactive, or paused.',
            'api_source_id.exists' => 'The selected API source does not exist.',
            'api_request_id.exists' => 'The selected API request does not exist.',
            'api_extract_id.exists' => 'The selected API extract does not exist.',
            'destination_id.exists' => 'The selected destination does not exist.',
        ];
    }
}
