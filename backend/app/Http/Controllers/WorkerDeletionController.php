<?php

namespace App\Http\Controllers;

use App\Models\Worker;
use App\Services\WorkerDeletionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;
use Throwable;

class WorkerDeletionController extends ApiController
{
    public function __invoke(Worker $worker, WorkerDeletionService $deletion)
    {
        try {
            $deletion->delete($worker->id);
        } catch (ValidationException | ModelNotFoundException | HttpExceptionInterface $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => 'No se pudo completar la eliminación. La fotografía podría haberse eliminado; actualiza la lista antes de reintentar.'], 503);
        }
        return $this->success(null, 'Trabajador y cuenta de acceso eliminados definitivamente.');
    }
}
