<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureActiveWorker
{
    public function handle(Request $request, Closure $next): Response
    {
        $worker = $request->user()?->worker;

        if (! $worker || ! $worker->active) {
            return response()->json(['success' => false, 'message' => 'Esta operación requiere un trabajador activo'], 403);
        }

        return $next($request);
    }
}
