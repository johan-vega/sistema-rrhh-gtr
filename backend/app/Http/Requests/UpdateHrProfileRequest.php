<?php

namespace App\Http\Requests;

use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UpdateHrProfileRequest extends ApiRequest
{
    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($this->user()?->id)],
            'current_password' => ['nullable', 'required_with:password', 'string'],
            'password' => ['nullable', 'string', 'min:8', 'confirmed'],
        ];
    }

    public function after(): array
    {
        return [function ($validator): void {
            if ($this->filled('password') && ! Hash::check((string) $this->input('current_password'), $this->user()->password)) {
                $validator->errors()->add('current_password', 'La contraseña actual no es correcta.');
            }
        }];
    }
}
