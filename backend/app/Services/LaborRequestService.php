<?php

namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\LaborRequest;
use App\Models\RequestCategory;
use App\Models\RequestHistory;
use App\Models\Role;
use App\Models\User;
use App\Models\Worker;
use App\Notifications\LaborRequestNotification;
use Carbon\Carbon;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class LaborRequestService
{
    public function create(Worker $worker, array $data, array $files, User $actor): LaborRequest
    {
        $category = RequestCategory::query()->whereKey($data['category_id'])->where('active', true)->first();
        if (! $category) {
            throw ValidationException::withMessages(['category_id' => ['La categoría no existe o está inactiva.']]);
        }
        $start = Carbon::parse($data['start_date'])->startOfDay();
        if ($start->lt(today()->addDays($category->minimum_notice_days))) {
            throw ValidationException::withMessages(['start_date' => ["La categoría exige {$category->minimum_notice_days} día(s) de anticipación."]]);
        }
        if ($category->requires_document && count($files) === 0) {
            throw ValidationException::withMessages(['documents' => ['Esta categoría requiere al menos un documento.']]);
        }
        $this->enforceMonthlyLimit($worker, $category, $start);

        return DB::transaction(function () use ($worker, $data, $files, $actor, $category) {
            $request = LaborRequest::create(['worker_id' => $worker->id, 'category_id' => $category->id, 'start_date' => $data['start_date'], 'end_date' => $data['end_date'], 'reason' => $data['reason'], 'status' => RequestStatus::PENDING, 'requested_at' => now()]);
            foreach ($files as $file) {
                $this->storeDocument($request, $file);
                $this->history($request, $actor, 'DOCUMENTO_AGREGADO', 'Documento adjuntado: '.$file->getClientOriginalName());
            }
            $this->history($request, $actor, 'CREADA', 'Solicitud creada por el trabajador.');
            $worker->user->notify(new LaborRequestNotification('SOLICITUD_CREADA', $request->id, 'Su solicitud fue registrada y está pendiente de revisión.'));
            $this->notifyHr('NUEVA_SOLICITUD', $request, "Nueva solicitud #{$request->id} recibida.");

            return $request;
        });
    }

    public function cancel(LaborRequest $request, User $actor, ?string $comment = null): void
    {
        $allowed = $request->status === RequestStatus::PENDING || ($request->status === RequestStatus::APPROVED && $request->category->allow_approved_cancellation);
        if (! $allowed) {
            throw ValidationException::withMessages(['status' => ['La solicitud no puede cancelarse en su estado actual.']]);
        }
        DB::transaction(function () use ($request, $actor, $comment) {
            $request->update(['status' => RequestStatus::CANCELLED]);
            $this->history($request, $actor, 'CANCELADA', $comment);
            $request->worker->user->notify(new LaborRequestNotification('SOLICITUD_CANCELADA', $request->id, 'Su solicitud fue cancelada.'));
            $this->notifyHr('SOLICITUD_CANCELADA', $request, "La solicitud #{$request->id} fue cancelada.");
        });
    }

    public function respond(LaborRequest $request, User $actor, bool $approved, string $observation): void
    {
        if ($request->status !== RequestStatus::PENDING) {
            throw ValidationException::withMessages(['status' => ['Solo se pueden responder solicitudes pendientes.']]);
        }
        DB::transaction(function () use ($request, $actor, $approved, $observation) {
            $status = $approved ? RequestStatus::APPROVED : RequestStatus::REJECTED;
            $request->update(['status' => $status, 'responded_at' => now(), 'hr_observation' => $observation]);
            $action = $approved ? 'APROBADA' : 'RECHAZADA';
            $this->history($request, $actor, $action, $observation);
            $request->worker->user->notify(new LaborRequestNotification("SOLICITUD_{$action}", $request->id, "Su solicitud fue {$status->value}."));
        });
    }

    private function storeDocument(LaborRequest $request, UploadedFile $file): void
    {
        $path = $file->store("request-documents/{$request->id}", 'local');
        $request->documents()->create(['original_name' => $file->getClientOriginalName(), 'stored_name' => basename($path), 'path' => $path, 'mime_type' => $file->getMimeType() ?? 'application/octet-stream', 'size' => $file->getSize()]);
    }

    private function enforceMonthlyLimit(Worker $worker, RequestCategory $category, Carbon $start): void
    {
        $worker->loadMissing('area');
        $field = $category->is_absence ? 'monthly_absence_limit' : 'monthly_permission_limit';
        $type = $category->is_absence ? 'faltas' : 'permisos';
        $monthStart = $start->copy()->startOfMonth();
        $monthEnd = $start->copy()->endOfMonth();

        $matchingRequests = LaborRequest::query()
            ->whereBetween('start_date', [$monthStart->toDateString(), $monthEnd->toDateString()])
            ->whereNotIn('status', [RequestStatus::REJECTED->value, RequestStatus::CANCELLED->value])
            ->whereHas('category', fn ($query) => $query->where('is_absence', $category->is_absence));

        $workerLimit = $worker->{$field};
        if ($workerLimit && (clone $matchingRequests)->where('worker_id', $worker->id)->count() >= $workerLimit) {
            throw ValidationException::withMessages(['start_date' => ["El trabajador ya alcanzó su tope mensual de {$workerLimit} {$type}."]]);
        }

        $areaLimit = $worker->area?->{$field};
        if ($areaLimit && (clone $matchingRequests)->whereHas('worker', fn ($query) => $query->where('area_id', $worker->area_id))->count() >= $areaLimit) {
            throw ValidationException::withMessages(['start_date' => ["El área {$worker->area?->name} ya alcanzó su tope mensual de {$areaLimit} {$type}."]]);
        }
    }

    private function history(LaborRequest $request, User $user, string $action, ?string $comment): void
    {
        RequestHistory::create(['labor_request_id' => $request->id, 'user_id' => $user->id, 'action' => $action, 'comment' => $comment]);
    }

    private function notifyHr(string $event, LaborRequest $request, string $message): void
    {
        User::whereHas('role', fn ($q) => $q->where('code', Role::HR))->get()->each->notify(new LaborRequestNotification($event, $request->id, $message));
    }
}
