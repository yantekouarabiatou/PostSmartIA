<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\AppNotification;
use App\Models\EmailHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request): JsonResponse
    {
        $user      = $request->user();
        $today     = now()->startOfDay();
        $weekStart = now()->startOfWeek();

        $query = $user->isAdmin()
            ? EmailHistory::query()
            : EmailHistory::where('user_id', $user->id);

        $emailsToday    = (clone $query)->where('created_at', '>=', $today)->count();
        $emailsThisWeek = (clone $query)->where('created_at', '>=', $weekStart)->count();
        $totalEmails    = (clone $query)->count();

        $qualityAvg = '—';

        // Unread notifications for current user
        $unreadNotifications = AppNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        // Top clients
        $topClients = (clone $query)
            ->groupBy('client_email')
            ->select('client_email', DB::raw('count(*) as count'))
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($item) => ['client_email' => $item->client_email, 'count' => $item->count]);

        // Status breakdown
        $statusStats = (clone $query)
            ->groupBy('status')
            ->select('status', DB::raw('count(*) as count'))
            ->get()
            ->reduce(fn($carry, $item) => array_merge($carry, [$item->status => $item->count]), []);

        return ApiResponse::success([
            'emails_today'         => $emailsToday,
            'emails_this_week'     => $emailsThisWeek,
            'total_emails'         => $totalEmails,
            'avg_time'             => '45s',
            'quality_avg'          => $qualityAvg,
            'unread_notifications' => $unreadNotifications,
            'top_clients'          => $topClients,
            'status_stats'         => $statusStats,
        ], 'Statistiques récupérées avec succès');
    }
}
