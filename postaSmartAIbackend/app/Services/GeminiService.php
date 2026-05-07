<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;

    public function __construct()
    {
        $this->apiKey  = config('services.gemini.api_key');
        $this->model   = config('services.gemini.model', 'gemini-1.5-flash');
        $this->baseUrl = config('services.gemini.base_url',
            'https://generativelanguage.googleapis.com/v1beta');
    }

    private function complete(
        array $messages,
        ?string $systemPrompt = null,
        bool $enableSearch = false
    ): string {
        $contents = [];
        foreach ($messages as $msg) {
            $contents[] = [
                'role'  => $msg['role'] === 'assistant' ? 'model' : 'user',
                'parts' => [['text' => $msg['content']]],
            ];
        }

        $payload = ['contents' => $contents];

        if ($systemPrompt) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemPrompt]],
            ];
        }

        if ($enableSearch) {
            $payload['tools'] = [
                ['google_search' => (object) []],
            ];
        }

        $payload['generationConfig'] = [
            'temperature'     => 0.7,
            'maxOutputTokens' => 2048,
        ];

        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::withoutVerifying()->timeout(30)->post($url, $payload);

        if ($response->failed()) {
            Log::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => $response->body(),
            ]);
            throw new \Exception('Gemini error ' . $response->status() . ': ' . $response->body());
        }

        return $response->json('candidates.0.content.parts.0.text', '');
    }

    private function completeJson(array $messages, ?string $systemPrompt = null): array
    {
        $text  = $this->complete($messages, ($systemPrompt ?? $this->systemPrompt())
            . "\nRéponds UNIQUEMENT en JSON valide, sans balises markdown.");
        $clean = preg_replace('/^```json\s*|\s*```$/m', '', trim($text));

        $result = json_decode($clean, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Invalid JSON from Gemini: ' . $clean);
        }

        return $result;
    }

    private function systemPrompt(): string
    {
        return "Tu es PostSmart IA, l'assistant expert des conseillers clientèle de La Poste France.
Tu aides à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle.
Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client.
Tu ne dois jamais inventer d'informations. Si tu ne connais pas une procédure précise,
indique-le clairement au conseiller et suggère de vérifier les ressources internes.";
    }

    public function analyzeEmail(string $emailContent): array
    {
        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Analyse ce mail client et retourne un JSON avec :
                {
                  \"service_type\": \"reclamation|suivi_colis|info_offre|escalade_mediateur|handicap|formulaire|autre\",
                  \"urgency\": \"haute|normale|faible\",
                  \"tone\": \"agressif|neutre|positif\",
                  \"client_name\": \"nom extrait ou null\",
                  \"dossier_number\": \"numéro extrait ou null\",
                  \"main_request\": \"résumé en une phrase\",
                  \"key_points\": [\"point1\", \"point2\"],
                  \"suggested_actions\": [\"action1\", \"action2\"]
                }
                Mail : $emailContent",
            ]],
            $this->systemPrompt()
        );
    }

    public function generateEmailResponse(string $emailContent, string $serviceType = ''): array
    {
        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Génère une réponse professionnelle à ce mail client ($serviceType).
                Retourne un JSON :
                {
                  \"subject\": \"Objet du mail de réponse\",
                  \"body\": \"Corps complet du mail\",
                  \"quality_score\": {
                    \"clarity\": 0,
                    \"empathy\": 0,
                    \"compliance\": 0,
                    \"overall\": 0
                  },
                  \"tone\": \"professionnel|empathique|formel\",
                  \"warnings\": []
                }
                Mail original : $emailContent",
            ]],
            $this->systemPrompt()
        );
    }

    public function improveEmail(string $draftContent): array
    {
        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Améliore ce brouillon de réponse conseiller.
                Retourne un JSON :
                {
                  \"improved_body\": \"version améliorée\",
                  \"changes\": [\"changement1\", \"changement2\"],
                  \"quality_score\": {
                    \"clarity\": 0,
                    \"empathy\": 0,
                    \"compliance\": 0,
                    \"overall\": 0
                  }
                }
                Brouillon : $draftContent",
            ]],
            $this->systemPrompt()
        );
    }

    public function generateCallReport(string $callData): array
    {
        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Génère un mail post-appel structuré. Retourne un JSON :
                {
                  \"subject\": \"Objet du mail\",
                  \"body\": \"Corps complet du mail\",
                  \"quality_score\": { \"clarity\": 0, \"empathy\": 0, \"overall\": 0 }
                }
                Données de l'appel : $callData",
            ]],
            $this->systemPrompt()
        );
    }

    // enableSearch = true active Google Search Grounding pour les recherches externes
    public function chatAssistant(array $messages, string $context = ''): array
    {
        $system = $this->systemPrompt();
        if ($context) {
            $system .= "\n\nContexte documentaire disponible :\n$context";
        }

        $reply = $this->complete($messages, $system, enableSearch: true);

        return [
            'reply'   => $reply,
            'sources' => [],
        ];
    }
}
