<?php

namespace App\Services;

use App\Models\{Role, User, Worker};
use Illuminate\Support\Facades\{DB, Storage};
use Illuminate\Validation\ValidationException;
use RuntimeException;

class WorkerDeletionService
{
    public function delete(int $id): void
    {
        DB::transaction(function () use ($id) {
            $worker = Worker::whereKey($id)->lockForUpdate()->firstOrFail();
            // Conservar TODO el historial, sin importar el estado de las solicitudes.
            if ($worker->requests()->exists()) {
                throw ValidationException::withMessages([
                    'worker' => 'No se puede eliminar este trabajador porque tiene solicitudes registradas. Usa Desactivar para conservar su historial.',
                ]);
            }
            $user = User::whereKey($worker->user_id)->lockForUpdate()->firstOrFail();
            abort_unless($user->role?->code === Role::WORKER, 403, 'Solo se pueden eliminar cuentas de trabajadores.');
            if ($worker->photo_path) {
                if (! preg_match('#^worker-photos/[a-zA-Z0-9_-]+\.[a-zA-Z0-9]+$#', $worker->photo_path)) {
                    throw new RuntimeException('Ruta de fotografía fuera del alcance del trabajador.');
                }
                $disk = Storage::disk(config('filesystems.default'));
                if ($disk->exists($worker->photo_path) && ! $disk->delete($worker->photo_path)) {
                    throw new RuntimeException('No se pudo eliminar la fotografía privada.');
                }
            }
            $user->tokens()->delete();
            $user->notifications()->delete();
            DB::table('sessions')->where('user_id', $user->id)->delete();
            DB::table('password_reset_tokens')->where('email', $user->email)->delete();
            $worker->delete();
            $user->delete();
            // Si la BD falla después de borrar la foto, conservar sus referencias permite
            // reintentar. R2 y MySQL no comparten una transacción reversible.
        });
    }
}
