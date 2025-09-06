<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateTableRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, \Illuminate\Contracts\Validation\ValidationRule|array|string>
     */
    public function rules(): array
    {
        return [
            'table_name' => 'required|string|min:2|max:64',
            'columns' => 'required|array|min:1',
            'columns.*.name' => 'required|string|min:1|max:64',
            'columns.*.type' => 'required|string|in:string,integer,bigInteger,boolean,date,decimal,text,json',
            'columns.*.nullable' => 'sometimes|boolean',
            'columns.*.length' => 'sometimes|integer|min:1|max:255',
            'columns.*.precision' => 'sometimes|integer|min:1|max:65',
            'columns.*.scale' => 'sometimes|integer|min:0|max:30',
        ];
    }

    /**
     * Get the table name from the request
     */
    public function getTableName(): string
    {
        return $this->validated('table_name');
    }

    /**
     * Get the columns from the request
     */
    public function getColumns(): array
    {
        return $this->validated('columns');
    }
}
