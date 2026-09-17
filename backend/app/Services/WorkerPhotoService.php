<?php
namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;
use Illuminate\Support\Facades\Log;
use RuntimeException;
use Throwable;

class WorkerPhotoService
{
    public function store(UploadedFile $photo): string
    {
        $path = Storage::disk(config('filesystems.default'))->putFile('worker-photos', $photo, 'private');
        if (! $path) throw new RuntimeException('No se pudo guardar la fotografía.');
        return $path;
    }

    public function delete(?string $path): void
    {
        // Solo borrar archivos propios de este módulo; nunca documentos u otras rutas.
        if (! $path || ! preg_match('#^worker-photos/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$#', $path)) return;
        try {
            $disk = Storage::disk(config('filesystems.default'));
            if ($disk->exists($path) && ! $disk->delete($path)) {
                Log::warning('No se pudo eliminar una fotografía reemplazada.');
            }
        } catch (Throwable $exception) {
            // La foto nueva ya está guardada: no devolver un falso fallo de actualización.
            Log::warning('No se pudo limpiar una fotografía reemplazada.', ['exception' => get_class($exception)]);
        }
    }
}
