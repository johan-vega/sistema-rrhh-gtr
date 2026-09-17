<?php
namespace App\Http\Controllers;

use App\Services\AreaAvailabilityService;
use App\Models\LaborRequest;
use Illuminate\Http\Request;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class RequestAvailabilityController extends ApiController
{
    public function __invoke(Request $request, AreaAvailabilityService $availability)
    {
        $data = $this->dateRange($request);
        return $this->success(['blocked_dates' => $availability->blockedDates($request->user()->worker, $data['from'], $data['to'])]);
    }

    public function forHrRequest(Request $httpRequest, LaborRequest $request, AreaAvailabilityService $availability)
    {
        $data = $this->dateRange($httpRequest);
        if ($data['from'] < $request->start_date->toDateString() || $data['to'] > $request->end_date->toDateString()) {
            throw ValidationException::withMessages(['from' => ['El rango debe estar comprendido en las fechas de la solicitud.']]);
        }
        $request->loadMissing(['worker.area', 'category']);
        return $this->success($availability->summary($request->worker, $data['from'], $data['to'], (bool) $request->category->is_absence))
            ->header('Cache-Control', 'private, no-store');
    }

    private function dateRange(Request $request): array
    {
        $data = $request->validate(['from' => ['required', 'date_format:Y-m-d'], 'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from']]);
        if (CarbonImmutable::parse($data['from'])->diffInDays(CarbonImmutable::parse($data['to'])) > 365) {
            throw ValidationException::withMessages(['to' => ['Consulta como máximo 366 días por vez.']]);
        }
        return $data;
    }
}
