<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\AiFeedback;
use App\Models\EmailInbox;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class FeedbackController extends Controller
{
    /**
     * POST /emails/{id}/feedback
     * Soumet ou met à jour le feedback sur une réponse IA (un seul par conseiller par mail).
     */
    public function store(Request $request, int $id): JsonResponse
    {
        $email = EmailInbox::findOrFail($id);

        $validated = $request->validate([
            'rating'          => 'required|in:positive,negative',
            'rejection_tags'  => 'nullable|array',
            'rejection_tags.*'=> 'string|in:ton_incorrect,information_manquante,hors_charte,trop_long,trop_formel,erreur_factuelle,autre',
            'correction'      => 'nullable|string|max:5000',
        ]);

        $feedback = AiFeedback::updateOrCreate(
            [
                'email_inbox_id' => $email->id,
                'user_id'        => Auth::id(),
            ],
            [
                'rating'            => $validated['rating'],
                'rejection_tags'    => $validated['rejection_tags'] ?? null,
                'correction'        => $validated['correction'] ?? null,
                'original_response' => $email->ai_response ?? null,
            ]
        );

        $action = $feedback->wasRecentlyCreated ? 'créé' : 'mis à jour';
        ActivityLogService::log(
            'feedback_submitted',
            "Feedback {$validated['rating']} {$action} pour le mail #{$email->id}"
        );

        return ApiResponse::success($feedback, "Feedback {$action} avec succès");
    }

    /**
     * GET /emails/{id}/feedback
     * Retourne le feedback de l'utilisateur connecté pour un mail donné.
     */
    public function show(int $id): JsonResponse
    {
        $feedback = AiFeedback::where('email_inbox_id', $id)
            ->where('user_id', Auth::id())
            ->first();

        return ApiResponse::success($feedback);
    }

    /**
     * GET /feedback/stats
     * Tableau de bord qualité IA — visible admin/manager.
     */
    public function stats(Request $request): JsonResponse
    {
        $days = (int) $request->input('days', 30);
        $since = now()->subDays($days);

        // Totaux positif / négatif
        $totals = AiFeedback::where('created_at', '>=', $since)
            ->select('rating', DB::raw('COUNT(*) as count'))
            ->groupBy('rating')
            ->pluck('count', 'rating');

        $positive = (int) ($totals['positive'] ?? 0);
        $negative = (int) ($totals['negative'] ?? 0);
        $total    = $positive + $negative;

        // Top tags de rejet
        $allTags = AiFeedback::where('created_at', '>=', $since)
            ->where('rating', 'negative')
            ->whereNotNull('rejection_tags')
            ->pluck('rejection_tags');

        $tagCounts = [];
        foreach ($allTags as $tags) {
            foreach ((array) $tags as $tag) {
                $tagCounts[$tag] = ($tagCounts[$tag] ?? 0) + 1;
            }
        }
        arsort($tagCounts);
        $topTags = array_slice(
            array_map(fn($tag, $count) => ['tag' => $tag, 'count' => $count], array_keys($tagCounts), $tagCounts),
            0, 8,
            true
        );
        $topTags = array_values($topTags);

        // Tendance hebdomadaire (feedback par semaine sur la période)
        $weeks = [];
        $cursor = clone $since;
        while ($cursor <= now()) {
            $weekEnd = (clone $cursor)->addDays(6);
            $weekStart = clone $cursor;
            $weekKey = $cursor->format('d/m');

            $weekData = AiFeedback::whereBetween('created_at', [$weekStart, $weekEnd])
                ->select('rating', DB::raw('COUNT(*) as count'))
                ->groupBy('rating')
                ->pluck('count', 'rating');

            $weeks[] = [
                'week'     => $weekKey,
                'positive' => (int) ($weekData['positive'] ?? 0),
                'negative' => (int) ($weekData['negative'] ?? 0),
            ];

            $cursor->addDays(7);
        }

        // Nombre de corrections manuelles soumises
        $corrections = AiFeedback::where('created_at', '>=', $since)
            ->whereNotNull('correction')
            ->where('correction', '!=', '')
            ->count();

        // Score d'amélioration IA : ratio positif sur total (0–100)
        $improvementScore = $total > 0 ? round(($positive / $total) * 100) : null;

        // Feedbacks récents avec correction (pour les managers)
        $recentCorrections = AiFeedback::with(['email:id,subject,from_email', 'user:id,name'])
            ->whereNotNull('correction')
            ->where('correction', '!=', '')
            ->where('created_at', '>=', $since)
            ->orderByDesc('created_at')
            ->limit(10)
            ->get()
            ->map(fn($f) => [
                'id'          => $f->id,
                'email_id'    => $f->email_inbox_id,
                'subject'     => $f->email->subject ?? null,
                'from_email'  => $f->email->from_email ?? null,
                'user'        => $f->user->name ?? null,
                'correction'  => $f->correction,
                'created_at'  => $f->created_at,
            ]);

        return ApiResponse::success([
            'period_days'       => $days,
            'total'             => $total,
            'positive'          => $positive,
            'negative'          => $negative,
            'improvement_score' => $improvementScore,
            'correction_count'  => $corrections,
            'top_rejection_tags'=> $topTags,
            'weekly_trend'      => $weeks,
            'recent_corrections'=> $recentCorrections,
        ]);
    }
}
