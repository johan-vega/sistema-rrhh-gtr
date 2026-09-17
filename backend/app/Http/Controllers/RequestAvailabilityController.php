<?php
namespace App\Http\Controllers;

use App\Services\AreaAvailabilityService;
use Illuminate\Http\Request;
use Carbon\CarbonImmutable;
use Illuminate\Validation\ValidationException;

class RequestAvailabilityController extends ApiController
{
    public function __invoke(Request $request, AreaAvailabilityService $availability)
    {
        $data = $request->validate(['from' => ['required', 'date_format:Y-m-d'], 'to' => ['required', 'date_format:Y-m-d', 'after_or_equal:from']]);
        if (CarbonImmutable::parse($data['from'])->diffInDays(CarbonImmutable::parse($data['to'])) > 365) {
            throw ValidationException::withMessages(['to' => ['Consulta como máximo 366 días por vez.']]);
        }
        return $this->success(['blocked_dates' => $availability->blockedDates($request->user()->worker, $data['from'], $data['to'])]);
    }
}
