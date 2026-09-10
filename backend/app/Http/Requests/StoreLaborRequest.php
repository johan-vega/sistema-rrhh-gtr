<?php

namespace App\Http\Requests;

class StoreLaborRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['category_id' => ['required', 'integer', 'exists:request_categories,id'], 'start_date' => ['required', 'date'], 'end_date' => ['required', 'date', 'after_or_equal:start_date'], 'reason' => ['required', 'string', 'max:2000'], 'documents' => ['nullable', 'array', 'max:5'], 'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png', 'max:5120']];
    }
}
