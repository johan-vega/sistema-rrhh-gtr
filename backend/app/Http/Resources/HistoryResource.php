<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class HistoryResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        return ['id' => $this->id, 'action' => $this->action, 'comment' => $this->comment, 'created_at' => $this->created_at, 'user' => $this->whenLoaded('user', fn () => ['id' => $this->user?->id, 'name' => $this->user?->name])];
    }
}
