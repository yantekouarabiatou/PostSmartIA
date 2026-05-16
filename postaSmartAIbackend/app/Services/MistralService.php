<?php

namespace App\Services;

use App\Contracts\AiServiceInterface;
use App\Helpers\LogSanitizer;
use Illuminate\Support\Facades\Http;

/**
 * Provider Mistral AI — compatible API OpenAI.
 *
 * P3 / Souveraineté LLM :
 *   En production La Poste → AI_PROVIDER=mistral
 *   Déployé sur infrastructure OVHcloud France (région eu-west / Paris)
 *   → données traitées sur territoire français, hors CLOUD Act américain.
 *
 *   Documentation : https://docs.mistral.ai/api/
 *   Modèle recommandé : mistral-large-latest (ou mistral-small pour les coûts)
 */
class MistralService implements AiServiceInterface
{
    private string $apiKey;
    private string $model;
    private string $baseUrl;
    private SensitiveDataFilter $filter;

    private string $systemPrompt = "Tu es PostSmart IA, l'assistant expert des conseillers clientèle de La Poste France. " .
        "Tu aides à rédiger des mails professionnels, empathiques et conformes à la charte relationnelle. " .
        "Tes réponses sont toujours en français, claires, structurées et adaptées au contexte client. " .
        "Tu ne dois jamais inventer d'informations.";

    public function __construct()
    {
        $this->apiKey  = config('services.mistral.api_key', '');
        $this->model   = config('services.mistral.model', 'mistral-large-latest');
        $this->baseUrl = config('services.mistral.base_url', 'https://api.mistral.ai/v1');
        $this->filter  = new SensitiveDataFilter();
    }

    // ─── Couche transport (compatible OpenAI) ────────────────────────────────

    private function complete(array $messages, ?string $systemPrompt = null): string
    {
        $allMessages = $systemPrompt
            ? array_merge([['role' => 'system', 'content' => $systemPrompt]], $messages)
            : $messages;

        // P0 — SSL vérifié en production, désactivé en dev
        $response = Http::withOptions(['verify' => config('app.env') === 'production'])
            ->withHeaders([
                'Authorization' => 'Bearer ' . $this->apiKey,
                'Content-Type'  => 'application/json',
            ])
            ->timeout(60)
            ->post("{$this->baseUrl}/chat/completions", [
                'model'       => $this->model,
                'messages'    => $allMessages,
                'temperature' => 0.4,
                'max_tokens'  => 4096,
            ]);

        if ($response->failed()) {
            LogSanitizer::error('Mistral API error', [
                'status' => $response->status(),
                'body'   => substr($response->body(), 0, 200),
            ]);
            throw new \Exception('Mistral error ' . $response->status());
        }

        return $response->json('choices.0.message.content', '');
    }

    private function completeJson(string $prompt, ?string $systemOverride = null): array
    {
        $strictSystem = ($systemOverride ?? $this->systemPrompt) . "\n\n" .
            "RÈGLE ABSOLUE : retourner UNIQUEMENT du JSON valide. " .
            "Pas de markdown. Pas de texte. Commence par { et termine par }.";

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

        throw new \Exception('Réponse Mistral invalide — impossible d\'extraire le JSON.');
    }

    // ─── Interface publique (AiServiceInterface) ─────────────────────────────

    public function analyzeEmail(string $emailContent): array
    {
        ['text' => $anonymized] = $this->filter->anonymize($emailContent);

        return $this->completeJson(
            "Analyse ce mail client La Poste. Détecte la langue et retourne JSON:\n" .
            "{detected_language (code ISO 639-1), language_name (nom en français), is_foreign_language (bool), french_translation (traduction complète en français si langue étrangère, null sinon), service_type (reclamation|suivi_colis|info_offre|escalade_mediateur|handicap|formulaire|autre), urgency (haute|normale|faible), tone (agressif|neutre|positif), client_name, dossier_number, main_request (toujours en français), key_points:[], suggested_actions:[]}.\n" .
            "Mail: {$anonymized}"
        );
    }

    public function generateEmailResponse(string $emailContent, string $serviceType = '', string $detectedLanguage = 'fr'): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($emailContent);

        $languageInstruction = ($detectedLanguage && $detectedLanguage !== 'fr')
            ? "\nIMPORTANT: Réponds dans la langue du client (code: {$detectedLanguage}). Le champ body doit être entièrement dans cette langue."
            : '';

        $result = $this->completeJson(
            "Génère une réponse professionnelle à ce mail La Poste (service: {$serviceType}).{$languageInstruction}\n" .
            "Retourne JSON: {subject, body, quality_score:{clarity,empathy,compliance,overall}, tone, warnings:[]}.\n\nMail: {$anonymized}"
        );

        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        return $result;
    }

    public function improveEmail(string $content): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($content);

        $result = $this->completeJson(
            "Améliore ce brouillon La Poste.\n" .
            "Retourne JSON: {improved_body, changes:[], quality_score:{clarity,empathy,compliance,overall}}.\n\nBrouillon: {$anonymized}"
        );

        if (isset($result['improved_body'])) {
            $result['improved_body'] = $this->filter->restore($result['improved_body'], $map);
        }

        return $result;
    }

    public function generateCallReport(string $callData): array
    {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($callData);

        $result = $this->completeJson(
            "Génère un mail post-appel La Poste.\n" .
            "Retourne JSON: {subject, body, structured_data:{context,client_request,actions_taken:[],commitments:[],follow_up_date:null,status:\"open\"}, quality_score:{clarity,empathy,compliance,overall}}.\n\nDonnées: {$anonymized}"
        );

        if (isset($result['body'])) {
            $result['body'] = $this->filter->restore($result['body'], $map);
        }

        return $result;
    }

    public function chatAssistant(array $messages, string $context = ''): array
    {
        $system = $this->systemPrompt;
        if ($context) {
            $system .= "\n\nContexte documentaire:\n{$context}";
        }

        $lastIdx = count($messages) - 1;
        if ($lastIdx >= 0) {
            ['text' => $messages[$lastIdx]['content']] = $this->filter->anonymize($messages[$lastIdx]['content']);
        }

        $reply = $this->complete($messages, $system);

        return ['reply' => $reply, 'sources' => []];
    }

    public function detectEscalationSignals(
        string $emailContent,
        string $serviceType,
        ?string $previousStatus = null,
        ?int $daysSinceFirstContact = null
    ): array {
        ['text' => $anonymized, 'map' => $map] = $this->filter->anonymize($emailContent);
        $truncated = substr(strip_tags($anonymized), 0, 1000);
        $context   = '';
        if ($previousStatus)        $context .= "Statut: $previousStatus. ";
        if ($daysSinceFirstContact) $context .= "Jours: $daysSinceFirstContact. ";

        $result = $this->completeJson(
            "Détecte les signaux d'escalade dans ce mail La Poste. {$context}Service: {$serviceType}\n" .
            "Retourne JSON: {should_escalate, urgency_level, signals_detected:[{type,description,quote}], recommended_target, recommended_target_label, suggested_message, delay_days_exceeded:null, estimated_amount:null, legal_threat:false, explanation}.\nMail: {$truncated}"
        );

        if (isset($result['signals_detected']) && is_array($result['signals_detected'])) {
            foreach ($result['signals_detected'] as &$signal) {
                if (isset($signal['quote'])) {
                    $signal['quote'] = $this->filter->restore($signal['quote'], $map);
                }
            }
        }

        return $result;
    }
}
