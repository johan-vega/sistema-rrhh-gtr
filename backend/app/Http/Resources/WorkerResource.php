<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class WorkerResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'dni' => $this->dni, 'first_name' => $this->first_name, 'last_name' => $this->last_name, 'full_name' => "{$this->first_name} {$this->last_name}", 'address' => $this->address, 'phone' => $this->phone, 'active' => $this->active, 'email' => $this->whenLoaded('user', fn () => $this->user->email), 'area' => $this->whenLoaded('area', fn () => ['id' => $this->area->id, 'name' => $this->area->name]), 'position' => $this->whenLoaded('position', fn () => ['id' => $this->position->id, 'name' => $this->position->name])];
    }
}
