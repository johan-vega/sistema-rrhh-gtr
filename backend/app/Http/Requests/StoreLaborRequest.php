<?php

namespace App\Http\Requests;

class StoreLaborRequest extends ApiRequest
{
    protected function prepareForValidation(): void
    {
        $categoryId = $this->header('X-Request-Category-Id');

        if (! $this->filled('category_id') && is_string($categoryId) && ctype_digit($categoryId)) {
            $this->merge(['category_id' => $categoryId]);
        }
    }

    public function rules(): array
    {
        return ['category_id' => ['required', 'integer', 'exists:request_categories,id'], 'start_date' => ['required', 'date'], 'end_date' => ['required', 'date', 'after_or_equal:start_date'], 'reason' => ['required', 'string', 'max:2000'], 'documents' => ['nullable', 'array', 'max:5'], 'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,heic,heif', 'max:10240']];
    }
}
