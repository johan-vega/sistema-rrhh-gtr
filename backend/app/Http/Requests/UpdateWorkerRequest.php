<?php

namespace App\Http\Requests;

use Illuminate\Validation\Rule;

class UpdateWorkerRequest extends ApiRequest
{
    public function rules(): array
    {
        $worker = $this->route('worker');

        return ['dni' => ['required', 'string', 'max:20', Rule::unique('workers', 'dni')->ignore($worker)], 'first_name' => ['required', 'string', 'max:100'], 'last_name' => ['required', 'string', 'max:100'], 'area_id' => ['required', 'integer', 'exists:areas,id'], 'position_id' => ['required', 'integer', 'exists:positions,id'], 'email' => ['required', 'email', 'max:255', Rule::unique('users', 'email')->ignore($worker->user_id)], 'address' => ['nullable', 'string', 'max:255'], 'phone' => ['nullable', 'string', 'max:30']];
    }
}
