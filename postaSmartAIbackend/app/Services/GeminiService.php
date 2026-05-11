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
        $this->model   = config('services.gemini.model', 'gemini-2.0-flash');
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
            'temperature'     => 0.4,
            'maxOutputTokens' => 1024,
        ];

        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::withoutVerifying()->timeout(60)->post($url, $payload);

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
        $strictSystem = ($systemPrompt ?? $this->systemPrompt()) . "\n\n" .
            "RÈGLE ABSOLUE : Tu dois retourner UNIQUEMENT du JSON valide et rien d'autre. " .
            "Pas de texte avant. Pas de texte après. Pas d'explication. " .
            "Pas de balises markdown. Pas de ```json. " .
            "Ta réponse doit commencer par { et se terminer par }. " .
            "Aucune exception à cette règle.";

        $text = $this->complete($messages, $strictSystem);

        // Stratégie 1 : JSON direct
        $result = json_decode(trim($text), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        // Stratégie 2 : nettoyer les balises markdown
        $clean = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $clean = preg_replace('/\s*```$/m', '', $clean);
        $clean = trim($clean);
        $result = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        // Stratégie 3 : extraire { ... } même entouré de texte
        $start = strpos($clean, '{');
        $end   = strrpos($clean, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $extracted = substr($clean, $start, $end - $start + 1);
            $result = json_decode($extracted, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        Log::error('Invalid JSON from Gemini', [
            'raw_response' => $text,
            'json_error'   => json_last_error_msg(),
        ]);
        throw new \Exception('Réponse IA invalide — impossible d\'extraire le JSON. Raw: ' . substr($text, 0, 300));
    }

    private function systemPrompt(): string
    {
        return "Tu es PostSmart IA, l'assistant expert des conseillers clientèle de La Poste France.
Tu aides à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle.
Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client.
Tu ne dois jamais inventer d'informations. Si tu ne connais pas une procédure précise,
indique-le clairement au conseiller et suggère de vérifier les ressources internes.";
    }

    public function detectEscalationSignals(
        string $emailContent,
        string $serviceType,
        ?string $previousStatus = null,
        ?int $daysSinceFirstContact = null
    ): array {
        $truncated = substr(strip_tags($emailContent), 0, 1000);

        $context = '';
        if ($previousStatus)        $context .= "Statut précédent du dossier : $previousStatus. ";
        if ($daysSinceFirstContact) $context .= "Jours depuis premier contact : $daysSinceFirstContact jours. ";

        return $this->completeJson([
            ['role' => 'user', 'content' =>
                "Analyse ce mail client La Poste et détecte les signaux d'escalade.
                $context
                Type de demande : $serviceType

                Règles d'escalade La Poste :
                - DÉLAI : délai de réponse dépassé (>48h mail, >5j réclamation)
                - INSATISFACTION : client mentionne insatisfaction après réponse précédente
                - COMPLEXE : montant >100€, documents officiels, situation handicap, litige juridique
                - MENACE : client mentionne avocat, tribunal, plainte formelle, médias
                - MEDIATEUR : recours internes épuisés, >2 mois sans résolution

                Retourne ce JSON :
                {
                  \"should_escalate\": true,
                  \"urgency_level\": \"immediate|high|normal|none\",
                  \"signals_detected\": [
                    {
                      \"type\": \"delai|insatisfaction|complexe|menace|mediateur\",
                      \"description\": \"description courte du signal détecté\",
                      \"quote\": \"extrait exact du mail qui déclenche ce signal\"
                    }
                  ],
                  \"recommended_target\": \"manager|service_reclamations|specialiste|mediateur|none\",
                  \"recommended_target_label\": \"libellé lisible\",
                  \"suggested_message\": \"message suggéré pour expliquer l'escalade\",
                  \"delay_days_exceeded\": null,
                  \"estimated_amount\": null,
                  \"legal_threat\": false,
                  \"explanation\": \"explication claire en français pour le conseiller\"
                }

                Mail : $truncated"
            ]
        ], "Détecteur de signaux d'escalade La Poste. JSON uniquement.");
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
                Retourne UNIQUEMENT ce JSON (les scores sont des entiers réels entre 0 et 100, PAS des zéros) :
                {
                  \"subject\": \"Objet du mail de réponse\",
                  \"body\": \"Corps complet du mail\",
                  \"quality_score\": {
                    \"clarity\":    85,
                    \"empathy\":    80,
                    \"compliance\": 90,
                    \"overall\":    85
                  },
                  \"tone\": \"professionnel\",
                  \"warnings\": []
                }
                Évalue honnêtement la qualité de la réponse que tu génères sur ces 3 critères :
                - clarity (clarté et structure) : 0-100
                - empathy (ton empathique et humain) : 0-100
                - compliance (conformité à la charte La Poste) : 0-100
                - overall : moyenne pondérée des 3 scores
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
                "Génère un mail post-appel structuré destiné au client. Retourne un JSON :
                {
                  \"subject\": \"Objet du mail\",
                  \"body\": \"Corps complet du mail professionnel et empathique\",
                  \"quality_score\": { \"clarity\": 0, \"empathy\": 0, \"compliance\": 0, \"overall\": 0 }
                }
                Les scores sont des entiers entre 0 et 100.
                Données de l'appel : $callData",
            ]],
            $this->systemPrompt()
        );
    }

    // enableSearch active Google Search Grounding (ajoute ~10-15s — désactivé par défaut)
    public function chatAssistant(array $messages, string $context = '', bool $enableSearch = false): array
    {
        $lastMessage = end($messages)['content'] ?? '';

        $escaladeKeywords = ['avocat', 'tribunal', 'plainte', 'poursuite', 'juridique', 'media', 'scandale'];
        $mentionsEscalade = false;
        foreach ($escaladeKeywords as $kw) {
            if (stripos($lastMessage, $kw) !== false) {
                $mentionsEscalade = true;
                break;
            }
        }

        $system = $this->systemPrompt();

        if ($context) {
            $system .= "\n\nContexte documentaire disponible :\n$context";
        }

        if ($mentionsEscalade) {
            $system .= "\n\n[ESCALADE — Procédures La Poste]\n" .
                "Signaux nécessitant escalade immédiate :\n" .
                "- Avocat / tribunal / poursuite judiciaire → Escalade manager + service juridique\n" .
                "- Délai >48h non résolu → Service réclamations N2\n" .
                "- Montant >100€ → Service réclamations spécialisé\n" .
                "- Insatisfaction persistante après 2 réponses → Manager\n" .
                "- >2 mois sans résolution → Médiateur La Poste (obligatoire légalement)\n" .
                "Contact médiateur : mediateur-laposte.fr\n" .
                "Guide le conseiller clairement sur la procédure et propose une formulation adaptée pour le mail.";
        }

        $reply = $this->complete($messages, $system, enableSearch: $enableSearch);

        return [
            'reply'          => $reply,
            'sources'        => [],
            'escalade_alert' => $mentionsEscalade,
        ];
    }
}
