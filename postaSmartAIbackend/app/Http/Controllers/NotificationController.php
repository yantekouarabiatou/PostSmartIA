<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\AppNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class NotificationController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $notifications = AppNotification::where('user_id', $request->user()->id)
            ->orderBy('created_at', 'desc')
            ->paginate($request->get('per_page', 20));

        $unreadCount = AppNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->count();

        return ApiResponse::success([
            'notifications' => $notifications,
            'unread_count'  => $unreadCount,
        ], 'Notifications récupérées avec succès');
    }

    public function markAsRead(Request $request, int $id): JsonResponse
    {
        $notification = AppNotification::where('id', $id)
            ->where('user_id', $request->user()->id)
            ->first();

        if (!$notification) {
            return ApiResponse::notFound('Notification introuvable');
        }

        $notification->update([
            'is_read' => true,
            'read_at' => now(),
        ]);

        return ApiResponse::success($notification, 'Notification marquée comme lue');
    }

    public function markAllAsRead(Request $request): JsonResponse
    {
        AppNotification::where('user_id', $request->user()->id)
            ->where('is_read', false)
            ->update(['is_read' => true, 'read_at' => now()]);

        return ApiResponse::success(null, 'Toutes les notifications marquées comme lues');
    }
}
