<?php
namespace App\Services;

use App\Enums\RequestStatus;
use App\Models\{Area, LaborRequest, Worker};
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class AreaAvailabilityService
{
    /** Cupo por personas distintas: solicitudes solapadas de una misma persona cuentan una vez.
     * Las justificaciones no reservan cupo. null = sin límite; pendientes tampoco reservan.
     * Se excluye al solicitante: otro permiso suyo no agrega una persona al cupo.
     */
    private function fullPeriods(Area $area, string $from, string $to, int $workerId): array
    {
        if ($area->max_simultaneous_permissions === null) return [];
        $requests = LaborRequest::query()->select(['worker_id', 'start_date', 'end_date'])
            ->where('status', RequestStatus::APPROVED)->where('worker_id', '!=', $workerId)
            ->whereHas('worker', fn ($q) => $q->where('area_id', $area->id))
            ->whereHas('category', fn ($q) => $q->where('is_absence', false))
            ->where('end_date', '>=', $from)->where('start_date', '<=', $to)
            ->orderBy('start_date')->get()->groupBy('worker_id');
        $events = [];
        foreach ($requests as $items) {
            $merged = [];
            foreach ($items as $item) {
                $start = max($from, $item->start_date->toDateString());
                $end = min($to, $item->end_date->toDateString());
                $last = count($merged) - 1;
                if ($last >= 0 && $start <= $merged[$last][1]) {
                    $merged[$last][1] = max($merged[$last][1], $end);
                } else {
                    $merged[] = [$start, $end];
                }
            }
            foreach ($merged as [$start, $end]) {
                $after = CarbonImmutable::parse($end)->addDay()->toDateString();
                $events[$start] = ($events[$start] ?? 0) + 1;
                $events[$after] = ($events[$after] ?? 0) - 1;
            }
        }
        ksort($events);
        $periods = [];
        $count = 0;
        $previous = null;
        foreach ($events as $date => $delta) {
            if ($previous !== null && $date > $previous && $count >= $area->max_simultaneous_permissions) {
                $periods[] = [$previous, CarbonImmutable::parse($date)->subDay()->toDateString()];
            }
            $count += $delta;
            $previous = $date;
        }
        return $periods;
    }

    public function blockedDates(Worker $worker, string $from, string $to): array
    {
        $dates = [];
        foreach ($this->fullPeriods($worker->area, $from, $to, $worker->id) as [$start, $end]) {
            for ($day = CarbonImmutable::parse($start); $day->toDateString() <= $end; $day = $day->addDay()) {
                $dates[] = $day->toDateString();
            }
        }
        return $dates;
    }

    /** Debe invocarse dentro de la transacción que crea/aprueba; bloquea la misma área. */
    public function assertAvailable(Worker $worker, string $from, string $to): void
    {
        $area = Area::whereKey($worker->area_id)->lockForUpdate()->firstOrFail();
        $periods = $this->fullPeriods($area, $from, $to, $worker->id);
        if ($periods !== []) {
            $date = CarbonImmutable::parse($periods[0][0])->format('d/m/Y');
            throw ValidationException::withMessages(['start_date' => ["La fecha {$date} no está disponible porque el área alcanzó el límite de permisos."]]);
        }
    }
}
