<?php

namespace App\Http\Requests;

class ManageResourceRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['name' => ['required', 'string', 'max:150'], 'description' => ['nullable', 'string', 'max:1000'], 'active' => ['sometimes', 'boolean'], 'requires_document' => ['sometimes', 'boolean'], 'minimum_notice_days' => ['sometimes', 'integer', 'min:0', 'max:365'], 'allow_approved_cancellation' => ['sometimes', 'boolean']];
    }
}
