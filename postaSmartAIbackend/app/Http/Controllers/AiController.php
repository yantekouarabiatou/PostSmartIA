<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\CallReport;
use App\Models\EmailInbox;
use App\Models\KnowledgeBase;
use App\Services\ActivityLogService;
use App\Traits\HasAiFallback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    use HasAiFallback;

    public function analyzeIncoming(Request $request): JsonResponse
    {
        $request->validate(['email_content' => 'required|string|min:10']);

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->analyzeEmail($request->email_content));
            ActivityLogService::log('mail_analyzed', 'Analyse d\'un mail entrant effectuée');
            return ApiResponse::success($result, 'Analyse effectuée avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    public function generateResponse(Request $request): JsonResponse
    {
        $request->validate([
            'email_content'     => 'required|string',
            'service_type'      => 'required|string',
            'entities'          => 'nullable|array',
            'detected_language' => 'nullable|string|max:10',
        ]);

        try {
            $lang   = $request->input('detected_language', 'fr');
            $result = $this->withAiFallback(fn($ai) => $ai->generateEmailResponse(
                $request->email_content,
                $request->service_type,
                $lang
            ));
            ActivityLogService::log('mail_processed', 'Génération de réponse mail effectuée');
            return ApiResponse::success($result, 'Réponse générée avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    public function improveEmail(Request $request): JsonResponse
    {
        $request->validate([
            'original_email' => 'required|string',
            'advisor_draft'  => 'required|string',
        ]);

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->improveEmail($request->advisor_draft));
            return ApiResponse::success($result, 'Brouillon amélioré avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    public function generateCallReport(Request $request): JsonResponse
    {
        $request->validate([
            'client_name'  => 'required|string',
            'call_summary' => 'required|string',
        ]);

        $summary = "Client: {$request->client_name}\n"
            . "Résumé: {$request->call_summary}\n"
            . ($request->commitments ? "Engagements: {$request->commitments}\n" : '')
            . ($request->next_steps  ? "Prochaines étapes: {$request->next_steps}" : '');

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->generateCallReport($summary));
            ActivityLogService::log('call_report', "Compte-rendu d'appel généré pour: {$request->client_name}");
            return ApiResponse::success($result, 'Compte-rendu généré avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    public function chat(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|min:2',
            'history' => 'nullable|array',
        ]);

        $kbItems = KnowledgeBase::active()
            ->select(['title', 'description', 'content', 'type'])
            ->limit(10)
            ->get();

        $context = $kbItems->map(fn($item) =>
            "[{$item->type}] {$item->title}\n{$item->description}\n{$item->content}"
        )->implode("\n\n---\n\n");

        $messages   = array_filter($request->history ?? [], fn($m) => isset($m['role'], $m['content']));
        $messages[] = ['role' => 'user', 'content' => $request->message];

        try {
            $msgs   = array_values($messages);
            $result = $this->withAiFallback(fn($ai) => $ai->chatAssistant($msgs, $context));
            $result['sources'] = $kbItems->pluck('title')->toArray();
            return ApiResponse::success($result, 'Réponse générée');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    // ── Traduction ───────────────────────────────────────────────────────────

    public function translate(Request $request): JsonResponse
    {
        $request->validate([
            'text'          => 'required|string|min:5',
            'source_lang'   => 'required|string|max:10',
        ]);

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->translateEmail(
                $request->text,
                $request->source_lang
            ));
            return ApiResponse::success($result, 'Traduction effectuée');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur traduction: ' . $e->getMessage(), 503);
        }
    }

    // ── Prédiction satisfaction ──────────────────────────────────────────────

    public function predictSatisfaction(Request $request): JsonResponse
    {
        $request->validate([
            'response_body'  => 'required|string|min:20',
            'original_email' => 'required|string|min:10',
        ]);

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->predictSatisfaction(
                $request->response_body,
                $request->original_email
            ));
            return ApiResponse::success($result, 'Prédiction effectuée');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur prédiction: ' . $e->getMessage(), 503);
        }
    }

    // ── Rapport Coach ────────────────────────────────────────────────────────

    public function coachReport(Request $request): JsonResponse
    {
        $user  = auth()->user();
        $since = now()->subDays(30);

        $emails = EmailInbox::where('validated_by', $user->id)
            ->where('validated_at', '>=', $since)
            ->select(['ai_service_type', 'ai_quality_score', 'status', 'validated_at'])
            ->orderBy('validated_at', 'desc')
            ->limit(50)
            ->get()
            ->toArray();

        $all = $emails;

        if (empty($all)) {
            return ApiResponse::success([
                'overall_grade'     => 'N/A',
                'overall_label'     => 'Pas encore de données',
                'overall_message'   => 'Traitez quelques mails pour obtenir votre rapport de coaching personnalisé.',
                'strengths'         => [],
                'improvements'      => [],
                'weekly_tip'        => 'Commencez par traiter vos premiers mails pour activer le coaching IA.',
                'top_service_type'  => null,
                'avg_score_trend'   => 'stable',
                'total_analyzed'    => 0,
            ], 'Rapport généré');
        }

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->generateCoachReport($all, $user->first_name));
            $result['total_analyzed'] = count($all);
            return ApiResponse::success($result, 'Rapport Coach généré');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur Coach IA: ' . $e->getMessage(), 503);
        }
    }

    // ── Résumé journée ───────────────────────────────────────────────────────

    public function dailySummary(Request $request): JsonResponse
    {
        $user  = auth()->user();
        $today = now()->startOfDay();

        $emailsToday  = EmailInbox::where('validated_at', '>=', $today)->where('validated_by', $user->id)->count();
        $callsToday   = CallReport::where('user_id', $user->id)->where('created_at', '>=', $today)->count();
        $pending      = EmailInbox::whereIn('status', ['unread', 'pending', 'read'])->whereNull('archived_at')->count();
        $escalated    = EmailInbox::where('status', 'escalated')->whereNull('archived_at')->count();

        $avgScore = EmailInbox::where('validated_at', '>=', $today)
            ->whereNotNull('ai_quality_score')
            ->avg('ai_quality_score') ?? 0;

        $timeSaved = ($emailsToday * 15) + ($callsToday * 10);

        $stats = compact('emailsToday', 'callsToday', 'pending', 'escalated', 'timeSaved') + ['avg_score' => round($avgScore)];
        $stats['emails_today'] = $emailsToday;
        $stats['calls_today']  = $callsToday;
        $stats['time_saved']   = $timeSaved;

        try {
            $result = $this->withAiFallback(fn($ai) => $ai->generateDailySummary($stats, $user->first_name));
            $result['stats'] = $stats;
            return ApiResponse::success($result, 'Résumé journée généré');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur résumé: ' . $e->getMessage(), 503);
        }
    }
}
