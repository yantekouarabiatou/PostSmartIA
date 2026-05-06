<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\KnowledgeBase;
use App\Services\ActivityLogService;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AiController extends Controller
{
    public function __construct(private GroqService $groq) {}

    public function analyzeIncoming(Request $request): JsonResponse
    {
        $request->validate(['email_content' => 'required|string|min:10']);

        try {
            $result = $this->groq->analyzeEmail($request->email_content);
            ActivityLogService::log('mail_analyzed', 'Analyse d\'un mail entrant effectuée');
            return ApiResponse::success($result, 'Analyse effectuée avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }

    public function generateResponse(Request $request): JsonResponse
    {
        $request->validate([
            'email_content' => 'required|string',
            'service_type'  => 'required|string',
            'entities'      => 'nullable|array',
        ]);

        try {
            $result = $this->groq->generateEmailResponse($request->email_content, $request->service_type);
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
            $result = $this->groq->improveEmail($request->advisor_draft);
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
            $result = $this->groq->generateCallReport($summary);
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
            $result = $this->groq->chatAssistant(array_values($messages), $context);
            $result['sources'] = $kbItems->pluck('title')->toArray();
            return ApiResponse::success($result, 'Réponse générée');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur IA: ' . $e->getMessage(), 503);
        }
    }
}
