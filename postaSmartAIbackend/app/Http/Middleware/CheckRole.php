<?php

namespace App\Http\Middleware;

use App\Http\Resources\ApiResponse;
use Closure;
use Illuminate\Http\Request;

class CheckRole
{
    public function handle(Request $request, Closure $next, string ...$roles)
    {
        $user = $request->user();

        if (!$user) {
            return ApiResponse::unauthorized('Vous devez être connecté.');
        }

        if (!in_array($user->role, $roles)) {
            return ApiResponse::forbidden('Vous n\'avez pas les permissions nécessaires.');
        }

        if (!$user->is_active) {
            return ApiResponse::forbidden('Votre compte est désactivé.');
        }

        return $next($request);
    }
}
