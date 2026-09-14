<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class CategoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'name' => $this->name, 'description' => $this->description, 'requires_document' => $this->requires_document, 'minimum_notice_days' => $this->minimum_notice_days, 'maximum_past_days' => $this->maximum_past_days, 'allow_approved_cancellation' => $this->allow_approved_cancellation, 'is_absence' => $this->is_absence, 'active' => $this->active];
    }
}
