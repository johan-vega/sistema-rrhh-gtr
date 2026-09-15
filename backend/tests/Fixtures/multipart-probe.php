<?php

// Solo para la prueba HTTP local. No carga Laravel, no consulta DB ni guarda documentos.
if (PHP_SAPI !== 'cli-server' || ! in_array($_SERVER['REMOTE_ADDR'] ?? '', ['127.0.0.1', '::1'], true)) {
    http_response_code(404);
    exit;
}

header('Content-Type: application/json');
$uploaded = $_FILES['documents'] ?? [];
$temporaryPath = $uploaded['tmp_name'][0] ?? null;
echo json_encode([
    'fields' => array_intersect_key($_POST, array_flip(['category_id', 'start_date', 'end_date', 'reason'])),
    'bypass' => $_GET['ngsw-bypass'] ?? null,
    'content_type' => $_SERVER['CONTENT_TYPE'] ?? '',
    'content_length' => (int) ($_SERVER['CONTENT_LENGTH'] ?? 0),
    'document' => $temporaryPath ? [
        'name' => $uploaded['name'][0],
        'size' => $uploaded['size'][0],
        'error' => $uploaded['error'][0],
        'sha256' => hash_file('sha256', $temporaryPath),
        'mime' => (new finfo(FILEINFO_MIME_TYPE))->file($temporaryPath),
    ] : null,
]);
