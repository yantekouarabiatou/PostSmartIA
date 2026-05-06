<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    private string $systemPrompt = "Tu es un assistant expert de La Poste France. Tu aides les conseillers clientèle à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle de La Poste. Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client. Tu ne dois jamais inventer d'informations — si tu ne connais pas une procédure précise, indique-le clairement au conseiller.";

    public function __construct()
    {
        $this->apiKey  = config('services.groq.key', '');
        $this->model   = config('services.groq.model', 'llama-3.3-70b-versatile');
        $this->baseUrl = config('services.groq.base_url', 'https://api.groq.com/openai/v1');
    }

    private function complete(string $userMessage, int $maxTokens = 2048, ?string $systemOverride = null): string
    {
        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type'  => 'application/json',
        ])->post("{$this->baseUrl}/chat/completions", [
            'model'      => $this->model,
            'max_tokens' => $maxTokens,
            'messages'   => [
                ['role' => 'system', 'content' => $systemOverride ?? $this->systemPrompt],
                ['role' => 'user',   'content' => $userMessage],
            ],
        ]);

        if (!$response->successful()) {
            Log::error('Groq API error', ['status' => $response->status(), 'body' => $response->body()]);
            throw new \RuntimeException('Erreur lors de la communication avec Groq: ' . $response->body());
        }

        return $response->json('choices.0.message.content', '');
    }

    private function completeJson(string $userMessage, int $maxTokens = 2048, ?string $systemOverride = null): array
    {
        $text = $this->complete($userMessage, $maxTokens, $systemOverride);
        $text = preg_replace('/```json\s*|\s*```/', '', $text);
        $decoded = json_decode(trim($text), true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \RuntimeException('Réponse JSON invalide de Groq: ' . $text);
        }

        return $decoded;
    }

    public function analyzeEmail(string $emailContent): array
    {
        $prompt = "Analyse ce mail client de La Poste et retourne un JSON avec les champs suivants:\n" .
            "- service_type: type de service (reclamation, suivi_colis, information, demande_remboursement, autre)\n" .
            "- service_type_label: libellé en français du service\n" .
            "- entities: objet avec client_name, dossier_number, main_request, urgency (faible/moyenne/haute), tone (positif/neutre/négatif)\n" .
            "- quality_score: objet avec clarity (0-100), empathy_required (0-100), complexity (0-100)\n" .
            "- recommended_action: action recommandée en une phrase\n\n" .
            "Mail à analyser:\n{$emailContent}";

        return $this->completeJson($prompt);
    }

    public function generateEmailResponse(string $emailContent, string $serviceType = ''): array
    {
        $prompt = "Génère une réponse professionnelle et empathique à ce mail client de La Poste.\n" .
            "Type de service: {$serviceType}\n\n" .
            "Mail du client:\n{$emailContent}\n\n" .
            "Retourne un JSON avec:\n" .
            "- subject: objet du mail de réponse\n" .
            "- body: corps du mail complet et professionnel\n" .
            "- quality_score: objet avec clarity (0-100), empathy (0-100), compliance (0-100)";

        return $this->completeJson($prompt);
    }

    public function improveEmail(string $emailContent): array
    {
        $prompt = "Améliore ce brouillon de mail rédigé par un conseiller La Poste.\n\n" .
            "Brouillon:\n{$emailContent}\n\n" .
            "Retourne un JSON avec:\n" .
            "- improved_body: le mail amélioré\n" .
            "- changes_summary: tableau de chaînes décrivant les améliorations apportées\n" .
            "- quality_score: objet avec clarity (0-100), empathy (0-100), compliance (0-100)";

        return $this->completeJson($prompt);
    }

    public function generateCallReport(string $callSummary): array
    {
        $prompt = "Génère un mail de compte-rendu professionnel suite à un appel téléphonique avec un client de La Poste.\n\n" .
            "Résumé de l'appel:\n{$callSummary}\n\n" .
            "Retourne un JSON avec:\n" .
            "- subject: objet du mail\n" .
            "- body: mail complet avec contexte, résumé, actions, prochaines étapes\n" .
            "- quality_score: objet avec clarity (0-100), empathy (0-100), compliance (0-100)";

        return $this->completeJson($prompt);
    }

    public function chatAssistant(array $messages, string $context = ''): array
    {
        $systemPrompt = $this->systemPrompt;
        if ($context) {
            $systemPrompt .= "\n\nContexte base de connaissances disponible:\n{$context}";
        }

        $apiMessages = array_map(fn($m) => [
            'role'    => $m['role'],
            'content' => $m['content'],
        ], $messages);

        $response = Http::withHeaders([
            'Authorization' => "Bearer {$this->apiKey}",
            'Content-Type'  => 'application/json',
        ])->post("{$this->baseUrl}/chat/completions", [
            'model'      => $this->model,
            'max_tokens' => 1024,
            'messages'   => array_merge(
                [['role' => 'system', 'content' => $systemPrompt]],
                $apiMessages
            ),
        ]);

        if (!$response->successful()) {
            throw new \RuntimeException('Erreur Groq: ' . $response->body());
        }

        return [
            'reply'   => $response->json('choices.0.message.content', ''),
            'sources' => [],
        ];
    }
}
