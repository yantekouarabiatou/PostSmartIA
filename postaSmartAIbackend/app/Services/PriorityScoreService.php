<?php

namespace App\Services;

use Carbon\Carbon;

class PriorityScoreService
{
    private const URGENT_KEYWORDS = [
        'urgent', 'urgence', 'immédiat', 'immédiatement', 'critique',
        'danger', 'décès', 'hospitalisation', 'fraude', 'arnaque',
        'litige', 'scandaleux', 'inacceptable', 'vol', 'accident',
    ];

    private const HIGH_KEYWORDS = [
        'insatisfait', 'mécontent', 'remboursement', 'retard', 'perdu',
        'manquant', 'disparu', 'erreur', 'problème', 'incident',
        'réclamation', 'plainte', 'déçu', 'pas reçu', 'non livré',
        'jamais arrivé', 'introuvable',
    ];

    private const LOW_KEYWORDS = [
        'renseignement', 'information', 'bonjour', 'merci', 'félicitations',
        'bravo', 'suggestion', 'idée', 'documentation',
    ];

    public static function compute(
        ?string $subject,
        ?string $body,
        ?string $serviceType,
        ?string $status,
        Carbon  $receivedAt,
    ): string {
        $score = 30;

        // ── Service type ──────────────────────────────────────────────────────
        $score += match ($serviceType) {
            'escalade', 'escalade_mediateur' => 50,
            'reclamation'                    => 30,
            'handicap'                       => 20,
            'suivi_colis'                    => 8,
            'formulaire'                     => 5,
            'info_offre', 'info_generale'    => -5,
            'formation'                      => -15,
            default                          => 0,
        };

        // ── Keywords (subject + first 2000 chars of body) ─────────────────────
        $text = mb_strtolower(($subject ?? '') . ' ' . mb_substr($body ?? '', 0, 2000));

        foreach (self::URGENT_KEYWORDS as $kw) {
            if (str_contains($text, $kw)) { $score += 25; break; }
        }
        $highHits = 0;
        foreach (self::HIGH_KEYWORDS as $kw) {
            if (str_contains($text, $kw) && ++$highHits <= 2) $score += 12;
        }
        $lowHits = 0;
        foreach (self::LOW_KEYWORDS as $kw) {
            if (str_contains($text, $kw) && ++$lowHits <= 2) $score -= 8;
        }

        // ── Age ───────────────────────────────────────────────────────────────
        $hours = $receivedAt->diffInHours(now());
        $score += match (true) {
            $hours > 72 => 35,
            $hours > 48 => 25,
            $hours > 24 => 15,
            $hours > 12 => 5,
            default     => 0,
        };

        // ── Status override ───────────────────────────────────────────────────
        if ($status === 'escalated') {
            $score = max($score, 85);
        }

        $score = max(0, min(100, $score));

        return match (true) {
            $score >= 80 => 'urgent',
            $score >= 60 => 'high',
            $score >= 35 => 'normal',
            default      => 'low',
        };
    }
}
