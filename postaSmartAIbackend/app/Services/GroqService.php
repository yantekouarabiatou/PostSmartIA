<?php

namespace App\Services;

use App\Contracts\AiServiceInterface;
use App\Helpers\LogSanitizer;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class GroqService implements AiServiceInterface
{
    private string $systemPrompt = "Tu es un assistant expert de La Poste France. Tu aides les conseillers clientèle à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle de La Poste. Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client. Tu ne dois jamais inventer d'informations — si tu ne connais pas une procédure précise, indique-le clairement au conseiller.";

    private SensitiveDataFilter $filter;

    public function __construct()
    {
        $this->filter = new SensitiveDataFilter();
    }

    private function complete(array $messages, ?string $systemPrompt = null): string
    {
        $payload = [
            'model'       => config('services.groq.model', 'llama-3.3-70b-versatile'),
            'messages'    => $systemPrompt
                ? array_merge([['role' => 'system', 'content' => $systemPrompt]], $messages)
                : $messages,
            'temperature' => 0.7,
            'max_tokens'  => 2048,
        ];

        // P0 — SSL vérifié (suppression de withoutVerifying)
        $response = Http::withOptions(['verify' => true])
            ->withHeaders([
                'Authorization' => 'Bearer ' . config('services.groq.api_key'),
                'Content-Type'  => 'application/json',
            ])
            ->timeout(30)
            ->post(
                config('services.groq.base_url', 'https://api.groq.com/openai/v1') . '/chat/completions',
                $payload
            );

        if ($response->failed()) {
            LogSanitizer::error('Groq API error', [
                'status' => $response->status(),
                'body'   => substr($response->body(), 0, 200),
            ]);
            throw new \Exception('Groq API error ' . $response->status());
        }

        return $response->json('choices.0.message.content', '');
    }

    private function completeJson(string $prompt, ?string $systemOverride = null): array
    {
        $strictSystem = ($systemOverride ?? $this->systemPrompt) . "\n\n" .
            "RÈGLE ABSOLUE : Tu dois retourner UNIQUEMENT du JSON valide et rien d'autre. " .
            "Pas de texte avant. Pas de texte après. Pas d'explication. " .
            "Pas de balises markdown. Pas de ```json. " .
            "Ta réponse doit commencer par { et se terminer par }. " .
            "Aucune exception à cette règle.";

        $text = $this->complete([['role' => 'user', 'content' => $prompt]], $strictSystem);

        $result = json_decode(trim($text), true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        $clean = preg_replace('/^```(?:json)?\s*/m', '', $text);
        $clean = preg_replace('/\s*```$/m', '', $clean ?? '');
        $clean = trim($clean ?? '');
        $result = json_decode($clean, true);
        if (json_last_error() === JSON_ERROR_NONE) {
            return $result;
        }

        $start = strpos($clean, '{');
        $end   = strrpos($clean, '}');
        if ($start !== false && $end !== false && $end > $start) {
            $result = json_decode(substr($clean, $start, $end - $start + 1), true);
            if (json_last_error() === JSON_ERROR_NONE) {
                return $result;
            }
        }

        LogSanitizer::error('Invalid JSON from Groq', ['json_error' => json_last_error_msg()]);
        throw new \RuntimeException('Réponse IA invalide — impossible d\'extraire le JSON.');
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
        if ($previousStatus)        $context .= "Statut précédent : $previousStatus. ";
        if ($daysSinceFirstContact) $context .= "Jours depuis premier contact : $daysSinceFirstContact. ";

        $prompt = "Analyse ce mail client La Poste et détecte les signaux d'escalade.\n" .
            "{$context}Type de demande : {$serviceType}\n\n" .
            "Règles : DÉLAI (>48h mail, >5j réclamation), INSATISFACTION, COMPLEXE (>100€, handicap, litige), MENACE (avocat/tribunal), MEDIATEUR (>2 mois).\n\n" .
            "Retourne ce JSON :\n" .
            "{\n" .
            "  \"should_escalate\": true|false,\n" .
            "  \"urgency_level\": \"immediate|high|normal|none\",\n" .
            "  \"signals_detected\": [{\"type\": \"delai|insatisfaction|complexe|menace|mediateur\", \"description\": \"...\", \"quote\": \"...\"}],\n" .
            "  \"recommended_target\": \"manager|service_reclamations|specialiste|mediateur|none\",\n" .
            "  \"recommended_target_label\": \"...\",\n" .
            "  \"suggested_message\": \"...\",\n" .
            "  \"delay_days_exceeded\": null,\n" .
            "  \"estimated_amount\": null,\n" .
            "  \"legal_threat\": false,\n" .
            "  \"explanation\": \"...\"\n" .
            "}\n\nMail : {$truncated}";

        $result = $this->completeJson($prompt, "Détecteur signaux escalade La Poste. JSON uniquement.");

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

        $prompt = "Analyse ce mail client de La Poste et retourne un JSON avec :\n" .
            "- detected_language: code ISO 639-1 de la langue détectée (ex: \"fr\", \"en\", \"es\")\n" .
            "- language_name: nom de la langue en français (ex: \"Français\", \"Anglais\", \"Espagnol\")\n" .
            "- is_foreign_language: true si la langue n'est pas le français, false sinon\n" .
            "- french_translation: traduction complète et fidèle en français si is_foreign_language=true, null sinon\n" .
            "- service_type: reclamation|suivi_colis|info_offre|escalade_mediateur|handicap|formulaire|autre\n" .
            "- urgency: haute|normale|faible\n" .
            "- tone: agressif|neutre|positif\n" .
            "- client_name: null ou nom\n" .
            "- dossier_number: null ou numéro\n" .
            "- main_request: résumé en une phrase (toujours en français)\n" .
            "- key_points: [\"point1\"]\n" .
            "- suggested_actions: [\"action1\"]\n\n" .
            "Mail : {$anonymized}";

        return $this->completeJson($prompt);
    }

    public function generateEmailResponse(string $emailContent, string $serviceType = '', string $detectedLanguage = 'fr'): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($emailContent);

        $languageInstruction = ($detectedLanguage && $detectedLanguage !== 'fr')
            ? "\nIMPORTANT : Réponds directement dans la langue du client (code ISO: {$detectedLanguage}). Le champ body doit être entièrement dans cette langue.\n"
            : '';

        $prompt = "Génère une réponse professionnelle et empathique à ce mail client de La Poste.\n" .
            "Type de service: {$serviceType}{$languageInstruction}\n\n" .
            "Mail du client:\n{$anonymized}\n\n" .
            "Retourne un JSON avec:\n" .
            "- subject: objet du mail\n" .
            "- body: corps complet\n" .
            "- quality_score: {clarity: 0-100, empathy: 0-100, compliance: 0-100, overall: 0-100}\n" .
            "- tone: professionnel\n" .
            "- warnings: []";

        $result = $this->completeJson($prompt);

        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        return $result;
    }

    public function improveEmail(string $content): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($content);

        $prompt = "Améliore ce brouillon de mail rédigé par un conseiller La Poste.\n\n" .
            "Brouillon:\n{$anonymized}\n\n" .
            "Retourne un JSON avec:\n" .
            "- improved_body: le mail amélioré\n" .
            "- changes: tableau de chaînes décrivant les améliorations\n" .
            "- quality_score: {clarity: 0-100, empathy: 0-100, compliance: 0-100, overall: 0-100}";

        $result = $this->completeJson($prompt);

        if (isset($result['improved_body'])) {
            $result['improved_body'] = $this->filter->restore($result['improved_body'], $map);
        }

        return $result;
    }

    public function generateCallReport(string $callData): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($callData);

        $prompt = "Génère un mail de compte-rendu professionnel suite à un appel téléphonique avec un client de La Poste.\n\n" .
            "Données de l'appel:\n{$anonymized}\n\n" .
            "Retourne un JSON avec:\n" .
            "- subject: objet du mail\n" .
            "- body: mail complet avec contexte, résumé, actions, prochaines étapes\n" .
            "- structured_data: {context: \"\", client_request: \"\", actions_taken: [], commitments: [], follow_up_date: null, status: \"open\"}\n" .
            "- quality_score: {clarity: 0-100, empathy: 0-100, compliance: 0-100, overall: 0-100}";

        $result = $this->completeJson($prompt);

        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        return $result;
    }

    public function chatAssistant(array $messages, string $context = ''): array
    {
        $systemPrompt = $this->systemPrompt;
        if ($context) {
            $systemPrompt .= "\n\nContexte base de connaissances disponible:\n{$context}";
        }

        $sanitizedMessages = $messages;
        $lastIdx = count($sanitizedMessages) - 1;
        if ($lastIdx >= 0) {
            ['text' => $sanitizedMessages[$lastIdx]['content']] = $this->filter->anonymize($sanitizedMessages[$lastIdx]['content']);
        }

        $reply = $this->complete($sanitizedMessages, $systemPrompt);

        return ['reply' => $reply, 'sources' => []];
    }

    public function translateEmail(string $text, string $sourceLang): array
    {
        return $this->completeJson(
            "Traduis fidèlement ce texte depuis la langue '{$sourceLang}' vers le français professionnel.\n" .
            "Retourne ce JSON :\n" .
            "{\"translated_text\": \"traduction complète\", \"source_language\": \"{$sourceLang}\", \"key_phrases\": [\"expression clé traduite\"]}\n\n" .
            "Texte :\n{$text}",
            "Tu es un traducteur expert multilingue. JSON uniquement."
        );
    }

    public function predictSatisfaction(string $responseBody, string $originalEmail): array
    {
        ['text' => $anonResponse] = $this->filter->anonymize($responseBody);
        ['text' => $anonOriginal] = $this->filter->anonymize($originalEmail);
        return $this->completeJson(
            "Évalue la satisfaction probable du client.\nMail original :\n{$anonOriginal}\nRéponse :\n{$anonResponse}\n\n" .
            "Retourne JSON : {satisfaction_score:1-5, stars:1-5, label:\"Très insatisfait|Insatisfait|Neutre|Satisfait|Très satisfait\", strengths:[\"...\"], improvements:[\"...\"], risk_level:\"low|medium|high\", risk_reason:\"...\"}."
        );
    }

    public function generateCoachReport(array $recentEmails, string $agentName): array
    {
        $total   = count($recentEmails);
        $scores  = array_filter(array_column($recentEmails, 'ai_quality_score'), fn($s) => $s > 0);
        $avgScore = count($scores) > 0 ? round(array_sum($scores) / count($scores)) : 0;
        return $this->completeJson(
            "Génère un rapport coach pour {$agentName} — {$total} mails traités, score moyen {$avgScore}/100.\n" .
            "Retourne JSON : {overall_grade:\"A|B|C|D\", overall_label:\"...\", overall_message:\"...\", strengths:[{title:\"...\",detail:\"...\"}], improvements:[{title:\"...\",tip:\"...\",priority:\"high|medium|low\"}], weekly_tip:\"...\", top_service_type:null, avg_score_trend:\"stable|improving|declining\", total_analyzed:{$total}}."
        );
    }

    public function generateDailySummary(array $stats, string $agentName): array
    {
        $s = json_encode($stats);
        return $this->completeJson(
            "Génère un résumé journalier motivant pour {$agentName}.\nStats : {$s}\n\n" .
            "Retourne JSON : {headline:\"...\", mood:\"excellent|good|average|tough\", mood_emoji:\"...\", highlights:[\"...\"], watch_out:null, tomorrow_tip:\"...\", motivation_quote:\"...\"}."
        );
    }
}
