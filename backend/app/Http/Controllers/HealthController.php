<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;

class HealthController
{
    public function __invoke(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'message' => 'API funcionando',
            'upload_limits' => [
                'file' => ini_get('upload_max_filesize'),
                'request' => ini_get('post_max_size'),
            ],
        ]);
    }
}
