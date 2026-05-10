<?php

namespace App\Http\Controllers;

use App\Models\CallReport;
use App\Models\EmailInbox;
use Illuminate\Http\JsonResponse;

class ProfileStatsController extends Controller
{
    public function stats(): JsonResponse
    {
        $user = auth()->user();
        $now  = now();

        $emailsThisMonth = EmailInbox::where('validated_by', $user->id)
            ->whereMonth('validated_at', $now->month)
            ->whereYear('validated_at',  $now->year)
            ->count();

        $callsThisMonth = CallReport::where('user_id', $user->id)
            ->whereMonth('created_at', $now->month)
            ->whereYear('created_at',  $now->year)
            ->count();

        $avgScore = EmailInbox::where('validated_by', $user->id)
            ->whereNotNull('ai_quality_score_json')
            ->get()
            ->map(fn ($e) => $e->ai_quality_score_json['overall'] ?? 0)
            ->filter(fn ($v) => $v > 0)
            ->average() ?? 0;

        $timeSaved = ($emailsThisMonth * 15) + ($callsThisMonth * 10);

        $totalProcessed = EmailInbox::where('validated_by', $user->id)->count()
                        + CallReport::where('user_id', $user->id)->count();

        $last7Days = collect(range(6, 0))->map(function ($d) use ($user) {
            $date = now()->subDays($d);
            return [
                'date'   => $date->format('d/m'),
                'emails' => EmailInbox::where('validated_by', $user->id)
                    ->whereDate('validated_at', $date)->count(),
                'calls'  => CallReport::where('user_id', $user->id)
                    ->whereDate('created_at', $date)->count(),
            ];
        });

        $byService = EmailInbox::where('validated_by', $user->id)
            ->whereNotNull('ai_service_type')
            ->selectRaw('ai_service_type, count(*) as count')
            ->groupBy('ai_service_type')
            ->get()
            ->pluck('count', 'ai_service_type');

        return response()->json([
            'success' => true,
            'data'    => [
                'emails_this_month'  => $emailsThisMonth,
                'calls_this_month'   => $callsThisMonth,
                'avg_quality_score'  => (int) round($avgScore),
                'time_saved_minutes' => $timeSaved,
                'total_processed'    => $totalProcessed,
                'last_7_days'        => $last7Days,
                'by_service'         => $byService,
                'member_since'       => $user->created_at->translatedFormat('M Y'),
                'last_login'         => $user->last_login_at?->diffForHumans() ?? 'Maintenant',
            ],
        ]);
    }
}
