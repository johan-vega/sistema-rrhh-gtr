<?php

namespace App\Http\Requests;

class LoginRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['email' => ['required', 'email'], 'password' => ['required', 'string'], 'device_name' => ['nullable', 'string', 'max:100']];
    }
}
