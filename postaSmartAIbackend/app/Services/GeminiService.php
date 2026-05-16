<?php

namespace App\Services;

use App\Contracts\AiServiceInterface;
use App\Helpers\LogSanitizer;
use App\Models\KnowledgeBase;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GeminiService implements AiServiceInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private SensitiveDataFilter $filter;

    public function __construct()
    {
        $this->apiKey  = config('services.gemini.api_key');
        $this->model   = config('services.gemini.model', 'gemini-2.0-flash');
        $this->baseUrl = config('services.gemini.base_url', 'https://generativelanguage.googleapis.com/v1beta');
        $this->filter  = new SensitiveDataFilter();
    }

    // ─── Couche transport ────────────────────────────────────────────────────

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
            $payload['systemInstruction'] = ['parts' => [['text' => $systemPrompt]]];
        }

        if ($enableSearch) {
            $payload['tools'] = [['google_search' => (object) []]];
        }

        // P0 — SSL vérifié ; P1 — fenêtre étendue à 4096 tokens
        $payload['generationConfig'] = [
            'temperature'     => 0.4,
            'maxOutputTokens' => 2048,
        ];

        $url = "{$this->baseUrl}/models/{$this->model}:generateContent?key={$this->apiKey}";

        $response = Http::withOptions(['verify' => true])->timeout(25)->post($url, $payload);

        if ($response->failed()) {
            LogSanitizer::error('Gemini API error', [
                'status' => $response->status(),
                'body'   => substr($response->body(), 0, 200),
            ]);
            throw new \Exception('Gemini error ' . $response->status() . ': ' . substr($response->body(), 0, 200));
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
        $clean = preg_replace('/\s*```$/m', '', $clean ?? '');
        $clean = trim($clean ?? '');
        $result = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        // Stratégie 3 : extraire { ... }
        $start = strpos($clean, '{');
        $end   = strrpos($clean, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $result = json_decode(substr($clean, $start, $end - $start + 1), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        LogSanitizer::error('Invalid JSON from Gemini', ['json_error' => json_last_error_msg()]);
        throw new \Exception('Réponse IA invalide — impossible d\'extraire le JSON.');
    }

    // ─── System prompt & helpers ─────────────────────────────────────────────

    private function systemPrompt(): string
    {
        return "Tu es PostSmart IA, l'assistant expert des conseillers clientèle de La Poste France.
Tu aides à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle.
Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client.
Tu ne dois jamais inventer d'informations. Si tu ne connais pas une procédure précise,
indique-le clairement au conseiller et suggère de vérifier les ressources internes.";
    }

    /**
     * Charge les règles de la charte relationnelle depuis la base de connaissances.
     * Retourne une chaîne vide si aucune entrée de type 'charte' n'existe.
     */
    private function loadCharteRules(): string
    {
        try {
            $items = KnowledgeBase::active()
                ->where('type', 'charte')
                ->select(['title', 'content'])
                ->get();

            if ($items->isEmpty()) {
                return '';
            }

            return $items->map(fn($item) => "### {$item->title}\n{$item->content}")->implode("\n\n");
        } catch (\Exception $e) {
            Log::warning('Impossible de charger les règles charte KB : ' . $e->getMessage());
            return '';
        }
    }

    /**
     * P2 — Seconde passe de vérification de conformité charte.
     * Le LLM vérificateur est distinct du LLM rédacteur (prompt isolé).
     */
    private function verifyCharteCompliance(string $emailBody, string $charteRules): array
    {
        try {
            $verifierSystem = "Tu es un auditeur qualité indépendant de La Poste. " .
                "Ta seule tâche est d'évaluer la conformité d'un mail aux règles de la charte. " .
                "Tu ne rédiges rien, tu audites uniquement. Réponds en JSON strict.";

            $prompt = "Évalue ce mail de réponse La Poste selon les règles de la charte suivantes.\n\n" .
                "## Règles de la charte :\n{$charteRules}\n\n" .
                "## Mail à auditer :\n{$emailBody}\n\n" .
                "Retourne ce JSON :\n" .
                "{\n" .
                "  \"score\": 85,\n" .
                "  \"compliant\": true,\n" .
                "  \"issues\": [\"violation détectée si applicable\"],\n" .
                "  \"suggestions\": [\"amélioration possible\"]\n" .
                "}";

            return $this->completeJson(
                [['role' => 'user', 'content' => $prompt]],
                $verifierSystem
            );
        } catch (\Exception $e) {
            Log::warning('Vérification charte échouée (non-bloquant) : ' . $e->getMessage());
            return ['score' => 0, 'compliant' => false, 'issues' => [], 'suggestions' => []];
        }
    }

    // ─── Interface publique ──────────────────────────────────────────────────

    public function detectEscalationSignals(
        string $emailContent,
        string $serviceType,
        ?string $previousStatus = null,
        ?int $daysSinceFirstContact = null
    ): array {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($emailContent);
        $truncated = substr(strip_tags($anonymized), 0, 1000);

        $context = '';
        if ($previousStatus)        $context .= "Statut précédent du dossier : $previousStatus. ";
        if ($daysSinceFirstContact) $context .= "Jours depuis premier contact : $daysSinceFirstContact jours. ";

        $result = $this->completeJson([
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

        // Restaurer les données sensibles dans les champs 'quote'
        if (isset($result['signals_detected']) && is_array($result['signals_detected'])) {
            foreach ($result['signals_detected'] as &$signal) {
                if (isset($signal['quote'])) {
                    $signal['quote'] = $this->filter->restore($signal['quote'], $map);
                }
            }
        }

        return $result;
    }

    public function analyzeEmail(string $emailContent): array
    {
        ['text' => $anonymized] = $this->filter->anonymize($emailContent);

        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Analyse ce mail client et retourne un JSON avec :
                {
                  \"detected_language\": \"fr\",
                  \"language_name\": \"Français\",
                  \"is_foreign_language\": false,
                  \"french_translation\": null,
                  \"service_type\": \"reclamation|suivi_colis|info_offre|escalade_mediateur|handicap|formulaire|autre\",
                  \"urgency\": \"haute|normale|faible\",
                  \"tone\": \"agressif|neutre|positif\",
                  \"client_name\": \"nom extrait ou null\",
                  \"dossier_number\": \"numéro extrait ou null\",
                  \"main_request\": \"résumé en une phrase (toujours en français)\",
                  \"key_points\": [\"point1\", \"point2\"],
                  \"suggested_actions\": [\"action1\", \"action2\"]
                }
                Règles détection langue :
                - detected_language = code ISO 639-1 (ex: \"en\", \"es\", \"de\", \"ar\", \"zh\")
                - language_name = nom en français (ex: \"Anglais\", \"Espagnol\", \"Arabe\")
                - is_foreign_language = true si la langue n'est pas le français
                - french_translation = traduction complète et fidèle du mail en français si is_foreign_language=true, null sinon
                - main_request, key_points et suggested_actions doivent toujours être en français
                Mail : $anonymized",
            ]],
            $this->systemPrompt()
        );
    }

    public function generateEmailResponse(string $emailContent, string $serviceType = '', string $detectedLanguage = 'fr'): array
    {
        // P0 — Anonymisation avant envoi API externe
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($emailContent);

        // P2 — Charger les règles de la charte
        $charteRules = $this->loadCharteRules();
        $system      = $this->systemPrompt();
        if ($charteRules) {
            $system .= "\n\n## Règles de la charte relationnelle La Poste (à respecter impérativement) :\n" . $charteRules;
        }

        $languageInstruction = '';
        if ($detectedLanguage && $detectedLanguage !== 'fr') {
            $languageInstruction = "\nIMPORTANT : Ce client a écrit dans une langue étrangère (code: {$detectedLanguage}). " .
                "Génère la réponse directement dans la même langue que le client ({$detectedLanguage}), " .
                "tout en respectant les standards professionnels La Poste. " .
                "Le champ 'body' doit être entièrement dans la langue du client.";
        }

        $result = $this->completeJson(
            [['role' => 'user', 'content' =>
                "Génère une réponse professionnelle à ce mail client ($serviceType).{$languageInstruction}
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
                Évalue honnêtement : clarity (0-100), empathy (0-100), compliance (0-100), overall = moyenne.
                Mail original : $anonymized",
            ]],
            $system
        );

        // P0 — Restaurer les données sensibles dans le corps généré
        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        // P2 — Seconde passe de vérification (LLM vérificateur ≠ LLM rédacteur)
        if ($charteRules && isset($result['body'])) {
            $compliance = $this->verifyCharteCompliance($result['body'], $charteRules);
            $result['compliance_verification'] = $compliance;

            // Écraser le score compliance auto-évalué par le score audité
            if (isset($compliance['score'], $result['quality_score'])) {
                $result['quality_score']['compliance'] = $compliance['score'];
                $result['quality_score']['overall'] = (int) round((
                    ($result['quality_score']['clarity']  ?? 0) +
                    ($result['quality_score']['empathy']  ?? 0) +
                    $compliance['score']
                ) / 3);
            }
        }

        return $result;
    }

    public function improveEmail(string $content): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($content);

        $charteRules = $this->loadCharteRules();
        $system      = $this->systemPrompt();
        if ($charteRules) {
            $system .= "\n\n## Règles charte à respecter :\n" . $charteRules;
        }

        $result = $this->completeJson(
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
                Brouillon : $anonymized",
            ]],
            $system
        );

        if (isset($result['improved_body'])) {
            $result['improved_body'] = $this->filter->restore($result['improved_body'], $map);
        }

        if ($charteRules && isset($result['improved_body'])) {
            $compliance = $this->verifyCharteCompliance($result['improved_body'], $charteRules);
            $result['compliance_verification'] = $compliance;
            if (isset($compliance['score'], $result['quality_score'])) {
                $result['quality_score']['compliance'] = $compliance['score'];
                $result['quality_score']['overall'] = (int) round((
                    ($result['quality_score']['clarity'] ?? 0) +
                    ($result['quality_score']['empathy'] ?? 0) +
                    $compliance['score']
                ) / 3);
            }
        }

        return $result;
    }

    public function generateCallReport(string $callData): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($callData);

        $result = $this->completeJson(
            [['role' => 'user', 'content' =>
                "Génère un mail post-appel structuré destiné au client ET un rapport interne.
                Retourne ce JSON :
                {
                  \"subject\": \"Objet du mail client\",
                  \"body\": \"Corps complet du mail professionnel et empathique destiné au client\",
                  \"structured_data\": {
                    \"context\": \"contexte de l'appel en 1-2 phrases\",
                    \"client_request\": \"demande principale du client\",
                    \"actions_taken\": [\"action effectuée 1\", \"action effectuée 2\"],
                    \"commitments\": [\"engagement pris 1\"],
                    \"follow_up_date\": null,
                    \"status\": \"open\"
                  },
                  \"quality_score\": { \"clarity\": 0, \"empathy\": 0, \"compliance\": 0, \"overall\": 0 }
                }
                Les scores sont des entiers entre 0 et 100.
                Données de l'appel : $anonymized",
            ]],
            $this->systemPrompt()
        );

        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        return $result;
    }

    public function translateEmail(string $text, string $sourceLang): array
    {
        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Traduis fidèlement ce texte depuis la langue '{$sourceLang}' vers le français professionnel.\n" .
                "Retourne ce JSON :\n" .
                "{\"translated_text\": \"traduction complète\", \"source_language\": \"{$sourceLang}\", \"key_phrases\": [\"expression clé traduite\"]}\n\n" .
                "Texte :\n{$text}"
            ]],
            "Tu es un traducteur expert multilingue au service des conseillers La Poste. JSON uniquement."
        );
    }

    public function predictSatisfaction(string $responseBody, string $originalEmail): array
    {
        ['text' => $anonResponse] = $this->filter->anonymize($responseBody);
        ['text' => $anonOriginal] = $this->filter->anonymize($originalEmail);

        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Évalue la satisfaction probable du client après réception de cette réponse.\n\n" .
                "Mail original du client :\n{$anonOriginal}\n\n" .
                "Réponse rédigée par le conseiller :\n{$anonResponse}\n\n" .
                "Retourne ce JSON :\n" .
                "{\n" .
                "  \"satisfaction_score\": 4,\n" .
                "  \"stars\": 4,\n" .
                "  \"label\": \"Satisfait\",\n" .
                "  \"strengths\": [\"point fort 1\", \"point fort 2\"],\n" .
                "  \"improvements\": [\"amélioration possible 1\"],\n" .
                "  \"risk_level\": \"low|medium|high\",\n" .
                "  \"risk_reason\": \"explication si risque moyen ou élevé\"\n" .
                "}\n" .
                "satisfaction_score est entre 1 (très insatisfait) et 5 (très satisfait)."
            ]],
            "Tu es expert en relation client La Poste. Évalue objectivement la satisfaction prévisible. JSON uniquement."
        );
    }

    public function generateCoachReport(array $recentEmails, string $agentName): array
    {
        $summary = array_map(fn($e) => sprintf(
            "- Service: %s | Score qualité: %s | Statut: %s",
            $e['ai_service_type'] ?? 'autre',
            $e['ai_quality_score'] ?? 'N/A',
            $e['status'] ?? 'inconnu'
        ), array_slice($recentEmails, 0, 30));

        $summaryText = implode("\n", $summary);
        $count = count($recentEmails);

        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Tu es le coach IA du conseiller {$agentName}. Analyse ses {$count} derniers mails traités.\n\n" .
                "Données :\n{$summaryText}\n\n" .
                "Génère un rapport de coaching personnalisé en JSON :\n" .
                "{\n" .
                "  \"overall_grade\": \"A|B|C|D\",\n" .
                "  \"overall_label\": \"Excellent|Bien|À améliorer|Insuffisant\",\n" .
                "  \"overall_message\": \"message motivant personnalisé de 2 phrases\",\n" .
                "  \"strengths\": [{\"title\": \"titre\", \"detail\": \"détail\"}],\n" .
                "  \"improvements\": [{\"title\": \"axe à améliorer\", \"tip\": \"conseil concret\", \"priority\": \"high|medium|low\"}],\n" .
                "  \"weekly_tip\": \"conseil de la semaine en 1 phrase\",\n" .
                "  \"top_service_type\": \"type de mail le plus traité\",\n" .
                "  \"avg_score_trend\": \"stable|improving|declining\"\n" .
                "}"
            ]],
            "Tu es un coach bienveillant et expert en relation client La Poste. JSON uniquement."
        );
    }

    public function generateDailySummary(array $stats, string $agentName): array
    {
        $hour = now()->format('H');

        return $this->completeJson(
            [['role' => 'user', 'content' =>
                "Génère un résumé de fin de journée personnalisé pour {$agentName}.\n\n" .
                "Statistiques de la journée :\n" .
                "- Mails traités : " . ($stats['emails_today'] ?? 0) . "\n" .
                "- Appels traités : " . ($stats['calls_today'] ?? 0) . "\n" .
                "- Score qualité moyen : " . ($stats['avg_score'] ?? 0) . "/100\n" .
                "- Mails en attente : " . ($stats['pending'] ?? 0) . "\n" .
                "- Escalades : " . ($stats['escalated'] ?? 0) . "\n" .
                "- Temps économisé estimé : " . ($stats['time_saved'] ?? 0) . " min\n\n" .
                "Retourne ce JSON :\n" .
                "{\n" .
                "  \"headline\": \"titre accrocheur de la journée (max 10 mots)\",\n" .
                "  \"mood\": \"excellent|good|average|tough\",\n" .
                "  \"mood_emoji\": \"🌟|😊|😐|😤\",\n" .
                "  \"highlights\": [\"point fort 1\", \"point fort 2\"],\n" .
                "  \"watch_out\": \"point de vigilance si applicable sinon null\",\n" .
                "  \"tomorrow_tip\": \"conseil pour demain en 1 phrase\",\n" .
                "  \"motivation_quote\": \"citation motivante courte\"\n" .
                "}"
            ]],
            "Tu es l'assistant coach La Poste. Génère un résumé encourageant et factuel. JSON uniquement."
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

        // Anonymiser le dernier message utilisateur avant envoi
        $sanitizedMessages = $messages;
        $lastIdx = count($sanitizedMessages) - 1;
        ['text' => $sanitizedMessages[$lastIdx]['content']] = $this->filter->anonymize($sanitizedMessages[$lastIdx]['content']);

        $reply = $this->complete($sanitizedMessages, $system, enableSearch: $enableSearch);

        return [
            'reply'          => $reply,
            'sources'        => [],
            'escalade_alert' => $mentionsEscalade,
        ];
    }
}
