<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\AppNotification;
use App\Models\CallReport;
use App\Models\EmailHistory;
use App\Models\EmailInbox;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    // ── Endpoint historique (module génération) ──────────────────────────────
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

        $unreadNotifications = AppNotification::where('user_id', $user->id)
            ->where('is_read', false)
            ->count();

        $topClients = (clone $query)
            ->groupBy('client_email')
            ->select('client_email', DB::raw('count(*) as count'))
            ->orderByDesc('count')
            ->limit(5)
            ->get()
            ->map(fn($item) => ['client_email' => $item->client_email, 'count' => $item->count]);

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
            'quality_avg'          => '—',
            'unread_notifications' => $unreadNotifications,
            'top_clients'          => $topClients,
            'status_stats'         => $statusStats,
        ], 'Statistiques récupérées avec succès');
    }

    // ── Endpoint dashboard complet (temps réel) ──────────────────────────────
    public function index(Request $request): JsonResponse
    {
        $user    = $request->user();
        $isAdmin = in_array($user->role, ['admin', 'manager']);
        $today   = now()->toDateString();

        // ── Métriques principales ─────────────────────────────────────────────

        $emailsToday = EmailInbox::where('validated_by', $user->id)
            ->whereDate('validated_at', $today)
            ->count();

        $totalEmails = EmailInbox::where('validated_by', $user->id)
            ->whereIn('status', ['resolved', 'archived'])
            ->count();

        $pendingEmails = EmailInbox::whereNotIn('status', ['resolved', 'archived'])->count();
        $unreadEmails  = EmailInbox::where('is_read', false)->count();

        // Score qualité moyen — ai_quality_score est un entier (0-100), pas un objet JSON
        $allScores = EmailInbox::whereNotNull('ai_quality_score')
            ->where('ai_quality_score', '>', 0)
            ->pluck('ai_quality_score');

        $avgScore   = $allScores->count() > 0 ? (int) round($allScores->average()) : 0;
        $scoreCount = $allScores->count();

        $callsTotal = CallReport::where('user_id', $user->id)->count();
        $callsToday = CallReport::where('user_id', $user->id)
            ->whereDate('created_at', $today)->count();

        $timeSaved = ($totalEmails * 15) + ($callsTotal * 10);

        // ── Activité 7 jours ──────────────────────────────────────────────────

        $last7Days = collect(range(6, 0))->map(function ($diff) use ($user) {
            $date = now()->subDays($diff);
            return [
                'date'    => $date->format('d/m'),
                'day'     => $date->locale('fr')->dayName,
                'emails'  => EmailInbox::where('validated_by', $user->id)
                    ->whereDate('validated_at', $date)->count(),
                'calls'   => CallReport::where('user_id', $user->id)
                    ->whereDate('created_at', $date)->count(),
                'pending' => EmailInbox::whereDate('created_at', $date)
                    ->whereNotIn('status', ['resolved', 'archived'])->count(),
            ];
        });

        // ── Répartition par type de service ──────────────────────────────────

        $byService = EmailInbox::whereNotNull('ai_service_type')
            ->groupBy('ai_service_type')
            ->selectRaw('ai_service_type, count(*) as total')
            ->orderByDesc('total')
            ->get()
            ->map(fn($r) => [
                'type'  => $r->ai_service_type,
                'label' => $this->serviceLabel($r->ai_service_type),
                'total' => $r->total,
                'color' => $this->serviceColor($r->ai_service_type),
            ]);

        $totalByService = $byService->sum('total') ?: 1;
        $byService = $byService->map(fn($r) => array_merge($r, [
            'percent' => round(($r['total'] / $totalByService) * 100),
        ]))->values();

        // ── Statuts en temps réel ─────────────────────────────────────────────

        $statusCounts = EmailInbox::groupBy('status')
            ->selectRaw('status, count(*) as total')
            ->pluck('total', 'status');

        $statusCounts->put('unread', $unreadEmails);

        // ── Classement conseillers (admin/manager) ────────────────────────────

        $leaderboard = [];
        if ($isAdmin) {
            $leaderboard = User::where('is_active', true)
                ->whereIn('role', ['conseiller', 'manager'])
                ->get()
                ->map(function ($u) {
                    $emailsCount = EmailInbox::where('validated_by', $u->id)
                        ->whereIn('status', ['resolved', 'archived'])
                        ->count();

                    $scores = EmailInbox::where('validated_by', $u->id)
                        ->whereNotNull('ai_quality_score')
                        ->where('ai_quality_score', '>', 0)
                        ->pluck('ai_quality_score');

                    $avgScore = $scores->count() > 0 ? (int) round($scores->average()) : 0;
                    $callsCount = CallReport::where('user_id', $u->id)->count();

                    $initial1 = strtoupper(substr($u->first_name ?? '', 0, 1));
                    $initial2 = strtoupper(substr($u->last_name  ?? '', 0, 1));

                    return [
                        'id'         => $u->id,
                        'name'       => $u->full_name,
                        'role'       => $u->role,
                        'avatar'     => $initial1 . $initial2,
                        'emails'     => $emailsCount,
                        'calls'      => $callsCount,
                        'avg_score'  => $avgScore,
                        'total'      => $emailsCount + $callsCount,
                        'last_login' => $u->last_login_at
                            ? $u->last_login_at->diffForHumans() : 'Jamais',
                    ];
                })
                ->sortByDesc('total')
                ->values()
                ->take(10);
        }

        // ── Alertes temps réel ────────────────────────────────────────────────

        $alerts = [];

        $urgentPending = EmailInbox::where('priority', 'urgent')
            ->whereNotIn('status', ['resolved', 'archived'])
            ->count();
        if ($urgentPending > 0) {
            $alerts[] = [
                'type'    => 'urgent',
                'icon'    => '🚨',
                'color'   => '#DC2626',
                'bg'      => '#FEF2F2',
                'message' => "$urgentPending mail(s) urgent(s) en attente de traitement",
                'action'  => '/dashboard/incoming?filter=urgent',
            ];
        }

        $overdueFollowUps = EmailInbox::whereNotNull('follow_up_at')
            ->where('follow_up_at', '<', now())
            ->whereNotIn('status', ['resolved', 'archived'])
            ->count();
        if ($overdueFollowUps > 0) {
            $alerts[] = [
                'type'    => 'followup',
                'icon'    => '⏰',
                'color'   => '#D97706',
                'bg'      => '#FFFBEB',
                'message' => "$overdueFollowUps rappel(s) en retard",
                'action'  => '/dashboard/incoming?filter=pending',
            ];
        }

        $escalatedPending = EmailInbox::where('status', 'escalated')->count();
        if ($escalatedPending > 0) {
            $alerts[] = [
                'type'    => 'escalated',
                'icon'    => '⚡',
                'color'   => '#7C3AED',
                'bg'      => '#F5F3FF',
                'message' => "$escalatedPending dossier(s) escaladé(s) en attente",
                'action'  => '/dashboard/incoming?filter=escalated',
            ];
        }

        if ($avgScore > 0 && $avgScore < 60) {
            $alerts[] = [
                'type'    => 'quality',
                'icon'    => '📉',
                'color'   => '#DC2626',
                'bg'      => '#FEF2F2',
                'message' => "Score qualité moyen faible : $avgScore/100",
                'action'  => '/dashboard/profile',
            ];
        }

        // ── Activité récente ──────────────────────────────────────────────────

        $recentEmails = EmailInbox::whereIn('status', ['resolved', 'processing'])
            ->orderBy('updated_at', 'desc')
            ->limit(5)
            ->get()
            ->map(fn($e) => [
                'type'   => 'email',
                'icon'   => '📧',
                'color'  => '#0066CC',
                'title'  => $e->subject ?? 'Mail sans objet',
                'sub'    => 'De : ' . ($e->from_name ?? $e->from_email ?? '—'),
                'status' => $e->status,
                'time'   => $e->updated_at->diffForHumans(),
            ]);

        $recentCalls = CallReport::where('user_id', $user->id)
            ->orderBy('created_at', 'desc')
            ->limit(3)
            ->get()
            ->map(fn($c) => [
                'type'   => 'call',
                'icon'   => '📞',
                'color'  => '#0891B2',
                'title'  => 'Appel — ' . ($c->client_name ?? '—'),
                'sub'    => $c->demand_type ?? '',
                'status' => $c->status ?? 'draft',
                'time'   => $c->created_at->diffForHumans(),
            ]);

        $recentActivity = $recentEmails->concat($recentCalls)
            ->sortByDesc('time')
            ->values()
            ->take(8);

        return response()->json([
            'success' => true,
            'data'    => [
                'user'            => [
                    'name'  => $user->full_name,
                    'role'  => $user->role,
                    'email' => $user->email,
                ],
                'metrics'         => [
                    'emails_today' => $emailsToday,
                    'total_emails' => $totalEmails,
                    'pending'      => $pendingEmails,
                    'unread'       => $unreadEmails,
                    'avg_score'    => $avgScore,
                    'score_count'  => $scoreCount,
                    'time_saved'   => $timeSaved,
                    'calls_today'  => $callsToday,
                    'calls_total'  => $callsTotal,
                ],
                'last_7_days'     => $last7Days->values(),
                'by_service'      => $byService,
                'status_counts'   => $statusCounts,
                'leaderboard'     => $leaderboard,
                'alerts'          => $alerts,
                'recent_activity' => $recentActivity,
                'is_admin'        => $isAdmin,
            ],
        ]);
    }

    private function serviceLabel(string $type): string
    {
        return match ($type) {
            'reclamation'        => 'Réclamations',
            'suivi_colis'        => 'Suivi colis',
            'info_offre'         => 'Info offres',
            'escalade_mediateur' => 'Escalades',
            'handicap'           => 'Accessibilité',
            'formulaire'         => 'Formulaires',
            default              => 'Autres',
        };
    }

    private function serviceColor(string $type): string
    {
        return match ($type) {
            'reclamation'        => '#DC2626',
            'suivi_colis'        => '#0066CC',
            'info_offre'         => '#059669',
            'escalade_mediateur' => '#7C3AED',
            'handicap'           => '#D97706',
            'formulaire'         => '#0891B2',
            default              => '#6B7280',
        };
    }
}
