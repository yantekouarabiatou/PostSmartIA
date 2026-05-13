<?php

namespace App\Traits;

use App\Exceptions\AiUnavailableException;
use App\Services\ClaudeService;
use App\Services\GeminiService;
use App\Services\GroqService;
use App\Services\MistralService;
use Illuminate\Support\Facades\Log;

/**
 * Fournit un mécanisme de fallback multi-provider IA.
 *
 * Ordre : provider configuré (AI_PROVIDER) → Groq → Claude
 *
 * En production La Poste → AI_PROVIDER=mistral sur infrastructure OVHcloud France
 * pour garantir la souveraineté des données (hors CLOUD Act américain).
 */
trait HasAiFallback
{
    protected function withAiFallback(callable $fn): mixed
    {
        $provider = config('services.ai.provider', 'gemini');

        $primary = match ($provider) {
            'mistral' => app(MistralService::class),
            'groq'    => app(GroqService::class),
            'claude'  => app(ClaudeService::class),
            default   => app(GeminiService::class),
        };

        // La chaîne de fallback exclut le provider primaire
        $fallbackChain = array_filter([
            app(GroqService::class),
            app(ClaudeService::class),
        ], fn($svc) => get_class($svc) !== get_class($primary));

        $lastException = null;

        // Tentative provider primaire
        try {
            return $fn($primary);
        } catch (\Exception $e) {
            Log::warning('[AI] Provider primaire ' . class_basename($primary) . ' indisponible : ' . $e->getMessage());
            $lastException = $e;
        }

        // Tentatives de fallback dans l'ordre
        foreach ($fallbackChain as $fallback) {
            try {
                Log::info('[AI] Basculement vers ' . class_basename($fallback));
                return $fn($fallback);
            } catch (\Exception $e) {
                Log::warning('[AI] Fallback ' . class_basename($fallback) . ' échoué : ' . $e->getMessage());
                $lastException = $e;
            }
        }

        throw new AiUnavailableException(
            'Tous les providers IA sont indisponibles. Dernière erreur : ' . $lastException?->getMessage()
        );
    }
}
