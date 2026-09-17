<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateWorkerRequest extends ApiRequest
{
    public function rules(): array
    {
        $worker = $this->route('worker');

        return ['dni' => ['required', 'string', 'max:20', Rule::unique('workers', 'dni')->ignore($worker)], 'first_name' => ['required', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'], 'area_id' => ['required', 'integer', Rule::exists('areas', 'id')->where(fn ($query) => $query->where('active', true)->orWhere('id', $worker->area_id))], 'position_id' => ['required', 'integer', Rule::exists('positions', 'id')->where(fn ($query) => $query->where('active', true)->orWhere('id', $worker->position_id))], 'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($worker->user_id)], 'address' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:30'],
            'dni_address' => ['nullable', 'string', 'max:255'],
            'emergency_phone' => ['nullable', 'string', 'max:30'],
            'worker_type' => ['required', 'in:OBRERO,EMPLEADO'],
            'birth_date' => ['required', 'date_format:Y-m-d', 'before:today'],
            'photo' => ['nullable', 'image', 'mimes:jpg,jpeg,png,webp', 'max:5120'], 'monthly_permission_limit' => ['nullable', 'integer', 'min:0', 'max:365'], 'monthly_absence_limit' => ['nullable', 'integer', 'min:0', 'max:365']];
    }
}
