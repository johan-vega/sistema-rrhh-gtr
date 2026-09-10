<?php

namespace App\Http\Requests;

class UpdateProfileRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['address' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:30']];
    }
}
