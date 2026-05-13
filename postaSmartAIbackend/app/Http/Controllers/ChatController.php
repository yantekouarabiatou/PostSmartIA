<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\KnowledgeBase;
use App\Services\GeminiService;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function assistant(Request $request): JsonResponse
    {
        $request->validate([
            'messages'              => 'required|array|min:1',
            'messages.*.role'       => 'required|in:user,assistant',
            'messages.*.content'    => 'required|string',
            'context'               => 'nullable|string',
        ]);

        $context = $request->context;

        if (!$context) {
            $kbItems = KnowledgeBase::active()
                ->select(['title', 'description', 'content', 'type'])
                ->limit(10)
                ->get();

            $context = $kbItems->map(fn($item) =>
                "[{$item->type}] {$item->title}\n{$item->description}\n{$item->content}"
            )->implode("\n\n---\n\n");

            $sources = $kbItems->pluck('title')->toArray();
        } else {
            $sources = [];
        }

        // Détection de mots-clés d'escalade pour enrichir le contexte
        $messagesArr      = $request->input('messages', []);
        $lastMessage      = end($messagesArr)['content'] ?? '';
        $escaladeKeywords = ['avocat', 'tribunal', 'plainte', 'poursuite', 'juridique', 'media', 'scandale', 'porter plainte'];
        $mentionsEscalade = false;
        foreach ($escaladeKeywords as $kw) {
            if (stripos($lastMessage, $kw) !== false) {
                $mentionsEscalade = true;
                break;
            }
        }
        if ($mentionsEscalade) {
            $context .= "\n\n[ESCALADE — Procédures La Poste]\n" .
                "- Menace avocat/tribunal → Escalade manager + service juridique immédiatement\n" .
                "- Délai >48h non résolu → Service réclamations N2\n" .
                "- Montant >100€ → Service réclamations spécialisé\n" .
                "- Insatisfaction persistante (2+ réponses) → Manager\n" .
                "- >2 mois sans résolution → Médiateur La Poste (médiateur-laposte.fr) — obligatoire légalement\n" .
                "Guide le conseiller sur la procédure à suivre et propose une formulation mail adaptée.";
        }

        try {
            $result = app(GeminiService::class)->chatAssistant($request->messages, $context);
        } catch (\Exception $e) {
            Log::warning('Gemini unavailable, falling back to Groq: ' . $e->getMessage());
            try {
                $result = app(GroqService::class)->chatAssistant($request->messages, $context);
            } catch (\Exception $e2) {
                Log::error('Groq fallback also failed: ' . $e2->getMessage());
                return ApiResponse::error(null, 'Le service IA est temporairement indisponible.', 503);
            }
        }

        $result['sources']        = $sources ?? [];
        $result['escalade_alert'] = $mentionsEscalade;
        return ApiResponse::success($result, 'Réponse générée');
    }
}
