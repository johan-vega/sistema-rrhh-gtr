<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class StoreWorkerRequest extends ApiRequest
{
    public function rules(): array
    {
        return ['dni' => ['required', 'string', 'max:20', 'unique:workers,dni'], 'first_name' => ['required', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'], 'area_id' => ['required', 'integer', Rule::exists('areas', 'id')->where('active', true)], 'position_id' => ['required', 'integer', Rule::exists('positions', 'id')->where('active', true)], 'email' => ['required', 'email', 'max:255', 'unique:users,email'], 'password' => ['required', 'string', 'min:6', 'confirmed'], 'address' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:30'],
            'dni_address' => ['nullable', 'string', 'max:255'],
            'emergency_phone' => ['nullable', 'string', 'max:30'],
            'worker_type' => ['required', 'in:OBRERO,EMPLEADO'],
            'birth_date' => ['required', 'date_format:Y-m-d', 'before:today'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365']];
    }
}
