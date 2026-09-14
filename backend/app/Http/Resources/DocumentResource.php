<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class DocumentResource extends JsonResource
{
    public function toArray(Request $request): array
    {
        $baseUrl = $request->user()?->isHr() ? '/api/hr/requests' : '/api/requests';

        return ['id' => $this->id, 'original_name' => $this->original_name, 'mime_type' => $this->mime_type, 'size' => $this->size, 'download_url' => secure_url(
            "{$baseUrl}/{$this->labor_request_id}/documents/{$this->id}"
        )];
    }
}
