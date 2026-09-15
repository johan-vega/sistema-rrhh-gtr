<?php

return ['paths' => ['api/*', 'sanctum/csrf-cookie'], 'allowed_methods' => ['*'], 'allowed_origins' => array_filter(explode(',', env('CORS_ALLOWED_ORIGINS', 'http://localhost:4200,http://127.0.0.1:4200'))), 'allowed_origins_patterns' => [], 'allowed_headers' => ['Content-Type', 'Authorization', 'Accept', 'Origin', 'X-Requested-With', 'X-Request-Category-Id'], 'exposed_headers' => [], 'max_age' => 0, 'supports_credentials' => false];
