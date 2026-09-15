<?php

namespace App\Http\Requests;

class StoreLaborRequest extends ApiRequest
{
    protected function prepareForValidation(): void
    {
        $metadata = $this->mobileRequestMetadata();
        $missing = [];

        foreach (['category_id', 'start_date', 'end_date', 'reason'] as $field) {
            if (! $this->filled($field) && array_key_exists($field, $metadata)) {
                $missing[$field] = $metadata[$field];
            }
        }

        if ($missing !== []) {
            $this->merge($missing);
        }
    }

    public function rules(): array
    {
        return ['category_id' => ['required', 'integer', 'exists:request_categories,id'], 'start_date' => ['required', 'date'], 'end_date' => ['required', 'date', 'after_or_equal:start_date'], 'reason' => ['required', 'string', 'max:2000'], 'documents' => ['nullable', 'array', 'max:5'], 'documents.*' => ['file', 'mimes:pdf,jpg,jpeg,png,webp,heic,heif', 'max:10240']];
    }

    private function mobileRequestMetadata(): array
    {
        $encoded = $this->header('X-Request-Metadata');
        if (! is_string($encoded) || $encoded === '') {
            return [];
        }

        $base64 = strtr($encoded, '-_', '+/');
        $remainder = strlen($base64) % 4;
        if ($remainder !== 0) {
            $base64 .= str_repeat('=', 4 - $remainder);
        }

        $decoded = base64_decode($base64, true);
        if ($decoded === false) {
            return [];
        }

        $metadata = json_decode($decoded, true);
        if (! is_array($metadata)) {
            return [];
        }

        return array_intersect_key($metadata, array_flip(['category_id', 'start_date', 'end_date', 'reason']));
    }
}
