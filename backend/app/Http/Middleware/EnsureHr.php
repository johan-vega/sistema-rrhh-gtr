<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureHr
{
    public function handle(Request $request, Closure $next): Response
    {
        if (! $request->user()?->isHr()) {
            return response()->json(['success' => false, 'message' => 'No tiene permisos para esta acción'], 403);
        }

return $next($request);
    }
}
