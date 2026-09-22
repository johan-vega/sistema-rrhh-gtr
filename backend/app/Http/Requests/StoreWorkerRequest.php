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
            'hire_date' => ['nullable', 'date_format:Y-m-d'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:20480'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365']];
    }

    public function messages(): array
    {
        return [
            'hire_date.date_format' => 'La fecha de ingreso debe ser una fecha válida con formato AAAA-MM-DD.',
            'photo.max' => 'La fotografía no debe superar los 20 MB.',
        ];
    }
}
