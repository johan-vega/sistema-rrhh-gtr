<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class LaborRequestResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'start_date' => $this->start_date?->format('Y-m-d'), 'end_date' => $this->end_date?->format('Y-m-d'), 'reason' => $this->reason, 'status' => $this->status->value, 'requested_at' => $this->requested_at, 'responded_at' => $this->responded_at, 'hr_observation' => $this->hr_observation, 'category' => $this->whenLoaded('category', fn () => new CategoryResource($this->category)), 'worker' => $this->whenLoaded('worker', fn () => new WorkerResource($this->worker)), 'documents' => $this->whenLoaded('documents', fn () => DocumentResource::collection($this->documents)), 'history' => $this->whenLoaded('histories', fn () => HistoryResource::collection($this->histories))];
    }
}
