<?php

namespace App\Services;

use App\Models\LaborRequest;
use App\Notifications\LaborRequestNotification;
use Illuminate\Notifications\DatabaseNotification;
use Illuminate\Support\Facades\{DB, Storage};
use RuntimeException;

class RequestDeletionService
{
    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
            $request = LaborRequest::whereKey($id)->lockForUpdate()->firstOrFail();
            $documents = $request->documents()->get();
            // Verificar todos los paths antes de borrar; nunca eliminar directorios completos.
            foreach ($documents as $document) {
                if (! str_starts_with($document->path, "request-documents/{$id}/")
                    || str_contains($document->path, '..') || str_contains($document->path, '\\')) {
                    throw new RuntimeException('Ruta de adjunto fuera del alcance de la solicitud.');
                }
            }
            $disk = Storage::disk(config('filesystems.default'));
            foreach ($documents as $document) {
                if (! $disk->delete($document->path)) {
                    throw new RuntimeException('No se pudo eliminar un adjunto privado.');
                }
            }
            DatabaseNotification::where('type', LaborRequestNotification::class)
                ->where('data->request_id', $id)->delete();
            // Borrado físico. Las FK eliminan filas de documentos e historial.
            DB::table('labor_requests')->where('id', $id)->delete();
            // R2 y MySQL no comparten transacción: si algo falla tras borrar un archivo,
            // se conservan las referencias de BD para reintentar, no se promete deshacer R2.
        });
    }
}
