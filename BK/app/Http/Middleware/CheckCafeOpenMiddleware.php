<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use App\Models\IsClosed;

class CheckCafeOpenMiddleware
{
    public function handle(Request $request, Closure $next)
    {
        // Cache the value to avoid a database query on every request
        $cafeIsClosed = Cache::remember('cafe:is_closed', now()->addMinutes(5), function () {
            return IsClosed::first()?->is_closed ?? false;
        });

        if ($cafeIsClosed) {
            return response()->json(['message' => 'cafe is closed'], 503);
        }

        return $next($request);
    }
}
