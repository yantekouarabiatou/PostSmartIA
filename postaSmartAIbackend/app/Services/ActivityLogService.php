<?php

namespace App\Services;

use App\Models\ActivityLog;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Request;

class ActivityLogService
{
    public static function log(
        string $action,
        string $description,
        ?string $modelType = null,
        ?int $modelId = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id'     => Auth::id(),
            'action'      => $action,
            'model_type'  => $modelType,
            'model_id'    => $modelId,
            'description' => $description,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
            'created_at'  => now(),
        ]);
    }

    public static function logWithoutAuth(
        string $action,
        string $description,
        ?string $modelType = null,
        ?int $modelId = null
    ): ActivityLog {
        return ActivityLog::create([
            'user_id'     => null,
            'action'      => $action,
            'model_type'  => $modelType,
            'model_id'    => $modelId,
            'description' => $description,
            'ip_address'  => Request::ip(),
            'user_agent'  => Request::userAgent(),
            'created_at'  => now(),
        ]);
    }
}
