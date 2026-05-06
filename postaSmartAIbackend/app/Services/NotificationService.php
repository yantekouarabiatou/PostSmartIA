<?php

namespace App\Services;

use App\Models\AppNotification;
use App\Models\User;

class NotificationService
{
    public static function send(
        int $userId,
        string $type,
        string $title,
        string $message,
        array $data = []
    ): AppNotification {
        return AppNotification::create([
            'user_id' => $userId,
            'type'    => $type,
            'title'   => $title,
            'message' => $message,
            'data'    => $data ?: null,
            'is_read' => false,
        ]);
    }

    public static function sendToRole(string $role, string $type, string $title, string $message, array $data = []): void
    {
        User::where('role', $role)->where('is_active', true)->each(function (User $user) use ($type, $title, $message, $data) {
            self::send($user->id, $type, $title, $message, $data);
        });
    }

    public static function sendToAll(string $type, string $title, string $message, array $data = []): void
    {
        User::where('is_active', true)->each(function (User $user) use ($type, $title, $message, $data) {
            self::send($user->id, $type, $title, $message, $data);
        });
    }
}
