<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class AreaResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'description' => $this->description, 'monthly_permission_limit' => $this->monthly_permission_limit, 'monthly_absence_limit' => $this->monthly_absence_limit, 'active' => $this->active];
    }
}
