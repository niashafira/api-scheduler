<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Support\Str;

class CreateDestinationRequest extends FormRequest
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
        // Convert camelCase to snake_case for validation
        $data = $this->all();

        // Convert main fields
        $convertedData = [
            'table_name' => $data['tableName'] ?? $data['table_name'] ?? null,
            'columns' => $data['columns'] ?? [],
            'include_raw_payload' => $data['includeRawPayload'] ?? $data['include_raw_payload'] ?? true,
            'include_ingested_at' => $data['includeIngestedAt'] ?? $data['include_ingested_at'] ?? true,
            'status' => $data['status'] ?? 'active',
            'api_source_id' => $data['apiSourceId'] ?? $data['api_source_id'] ?? null,
            'api_request_id' => $data['apiRequestId'] ?? $data['api_request_id'] ?? null,
            'api_extract_id' => $data['apiExtractId'] ?? $data['api_extract_id'] ?? null,
        ];

        // Convert column fields from camelCase to snake_case
        if (isset($data['columns']) && is_array($data['columns'])) {
            $convertedColumns = [];
            foreach ($data['columns'] as $column) {
                $convertedColumns[] = [
                    'name' => $column['name'] ?? '',
                    'type' => $column['type'] ?? '',
                    'nullable' => $column['nullable'] ?? false,
                    'isPrimaryKey' => $column['isPrimaryKey'] ?? false,
                    'isUnique' => $column['isUnique'] ?? false,
                    'description' => $column['description'] ?? '',
                ];
            }
            $convertedData['columns'] = $convertedColumns;
        }

        $this->merge($convertedData);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'table_name' => 'required|string|min:2|max:64|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'columns' => 'required|array|min:1',
            'columns.*.name' => 'required|string|min:1|max:64|regex:/^[a-zA-Z_][a-zA-Z0-9_]*$/',
            'columns.*.type' => ['required', 'string', function ($attribute, $value, $fail) {
                $pattern = '/^(VARCHAR\(\d+\)|TEXT|INTEGER|BIGINT|DECIMAL\(\d+,\d+\)|BOOLEAN|DATE|TIMESTAMP|JSONB|UUID)$/i';
                if (!preg_match($pattern, $value)) {
                    $fail('Invalid column type. Supported types: VARCHAR(255), TEXT, INTEGER, BIGINT, DECIMAL(10,2), BOOLEAN, DATE, TIMESTAMP, JSONB, UUID.');
                }
            }],
            'columns.*.nullable' => 'sometimes|boolean',
            'columns.*.isPrimaryKey' => 'sometimes|boolean',
            'columns.*.isUnique' => 'sometimes|boolean',
            'columns.*.description' => 'sometimes|string|max:255',
            'include_raw_payload' => 'sometimes|boolean',
            'include_ingested_at' => 'sometimes|boolean',
            'status' => 'sometimes|string|in:active,inactive',
            'api_source_id' => 'sometimes|integer|exists:api_sources,id',
            'api_request_id' => 'sometimes|integer|exists:api_requests,id',
            'api_extract_id' => 'sometimes|integer|exists:api_extracts,id',
        ];
    }

    /**
     * Get custom messages for validator errors.
     *
     * @return array
     */
    public function messages(): array
    {
        return [
            'table_name.regex' => 'Table name must start with a letter or underscore and contain only letters, numbers, and underscores.',
            'columns.*.name.regex' => 'Column name must start with a letter or underscore and contain only letters, numbers, and underscores.',
        ];
    }
}
