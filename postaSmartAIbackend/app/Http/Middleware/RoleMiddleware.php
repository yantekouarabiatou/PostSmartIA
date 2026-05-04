<?php

namespace App\Http\Middleware;

use App\Http\Resources\ApiResponse;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class RoleMiddleware
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $role): Response
    {
        if (!$request->user() || $request->user()->role !== $role) {
            return ApiResponse::forbidden("You do not have permission to access this resource. Required role: {$role}");
        }

        return $next($request);
    }
}
