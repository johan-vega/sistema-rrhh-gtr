<?php

namespace App\Http\Requests;

class StoreWorkerRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['dni' => ['required', 'string', 'max:20', 'unique:workers,dni'], 'first_name' => ['required', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'], 'area_id' => ['required', 'integer', 'exists:areas,id'], 'position_id' => ['required', 'integer', 'exists:positions,id'], 'email' => ['required', 'email', 'max:255', 'unique:users,email'], 'password' => ['required', 'string', 'min:8', 'confirmed'], 'address' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:30'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365']];
    }
}
