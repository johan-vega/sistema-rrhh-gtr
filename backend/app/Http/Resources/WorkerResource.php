<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'dni' => $this->dni, 'first_name' => $this->first_name, 'last_name' => $this->last_name, 'full_name' => "{$this->first_name} {$this->last_name}", 'address' => $this->address, 'phone' => $this->phone, 'dni_address' => $this->dni_address, 'emergency_phone' => $this->emergency_phone, 'worker_type' => $this->worker_type, 'birth_date' => $this->birth_date?->format('Y-m-d'), 'has_photo' => (bool) $this->photo_path, 'monthly_permission_limit' => $this->monthly_permission_limit, 'monthly_absence_limit' => $this->monthly_absence_limit, 'active' => $this->active, 'email' => $this->whenLoaded('user', fn () => $this->user->email), 'area' => $this->whenLoaded('area', fn () => ['id' => $this->area->id, 'name' => $this->area->name, 'active' => $this->area->active]), 'position' => $this->whenLoaded('position', fn () => ['id' => $this->position->id, 'name' => $this->position->name, 'active' => $this->position->active])];
    }
}
