<?php

namespace App\Http\Controllers;

use App\Models\LaborRequest;
use App\Services\RequestDeletionService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Throwable;

class RequestDeletionController extends ApiController
{
    public function __invoke(LaborRequest $request, RequestDeletionService $deletion)
    {
        try {
            $deletion->delete($request->id);
        } catch (ModelNotFoundException $exception) {
            throw $exception;
        } catch (Throwable $exception) {
            report($exception);
            return response()->json(['success' => false, 'message' => 'No se pudo completar la eliminación. Algunos adjuntos podrían haberse eliminado; revisa el almacenamiento y vuelve a intentarlo.'], 503);
        }
        return $this->success(null, 'Solicitud, historial y adjuntos eliminados definitivamente.');
    }
}
