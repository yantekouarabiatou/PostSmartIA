<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\EmailHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    /**
     * Get dashboard statistics
     */
    public function stats(Request $request): JsonResponse
    {
        $user = $request->user();
        $today = now()->startOfDay();
        $weekStart = now()->startOfWeek();
        $monthStart = now()->startOfMonth();

        if ($user->isAdmin()) {
            $query = EmailHistory::query();
        } else {
            $query = EmailHistory::where('user_id', $user->id);
        }

        // Statistics for today
        $emailsToday = (clone $query)
            ->where('created_at', '>=', $today)
            ->count();

        // Statistics for this week
        $emailsThisWeek = (clone $query)
            ->where('created_at', '>=', $weekStart)
            ->count();

        // Statistics for this month
        $emailsThisMonth = (clone $query)
            ->where('created_at', '>=', $monthStart)
            ->count();

        // Total emails
        $totalEmails = (clone $query)->count();

        // Top clients (by number of emails)
        $topClients = (clone $query)
            ->groupBy('client_email')
            ->select('client_email', DB::raw('count(*) as count'))
            ->orderBy('count', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($item) => [
                'client_email' => $item->client_email,
                'count' => $item->count,
            ]);

        // Email stats by status
        $statusStats = (clone $query)
            ->groupBy('status')
            ->select('status', DB::raw('count(*) as count'))
            ->get()
            ->reduce(fn($carry, $item) => [
                ...$carry,
                $item->status => $item->count,
            ], []);

        return ApiResponse::success([
            'emails_today' => $emailsToday,
            'emails_this_week' => $emailsThisWeek,
            'emails_this_month' => $emailsThisMonth,
            'total_emails' => $totalEmails,
            'top_clients' => $topClients,
            'status_stats' => $statusStats,
        ], 'Dashboard statistics retrieved successfully', 200);
    }
}
