<?php

namespace App\Services;

/**
 * Anonymise les données personnelles et sensibles avant tout envoi
 * à une API IA externe (RGPD / CNIL).
 *
 * Usage :
 *   ['text' => $anonymized, 'map' => $map] = $filter->anonymize($text);
 *   // → envoyer $anonymized à l'API IA
 *   $restored = $filter->restore($aiResponse, $map);
 */
class SensitiveDataFilter
{
    /**
     * Couples [type → pattern regex].
     * L'ordre compte : CB avant PHONE pour éviter les chevauchements.
     */
    private array $patterns = [
        // IBAN : FR76 3000 6000 0112 3456 7890 189 ou FR7630006000011234567890189
        'IBAN' => '/\b[A-Z]{2}\d{2}[\s]?[A-Z0-9]{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{4}[\s]?\d{1,3}\b/',

        // Numéro de sécurité sociale (NIR) français : 1 80 12 75 123 456 78
        'NIR' => '/\b[12]\s?\d{2}\s?\d{2}\s?\d{2,3}\s?\d{3}\s?\d{3}\s?\d{2}\b/',

        // Carte bancaire : 4532 1234 5678 9012 ou 4532-1234-5678-9012
        'CB' => '/\b(?:\d{4}[\s\-]?){3}\d{4}\b/',

        // Numéro client La Poste (préfixé par libellé)
        'CLIENT_NUM' => '/\b(?:n°?\s?client|numéro\s+client|client\s*n°?|compte\s*n°?)\s*:?\s*(\d{6,12})\b/i',

        // Téléphone français : 06 12 34 56 78, +33612345678, 0033 6 12 34 56 78
        'PHONE' => '/(?:\+33|0033|0)\s?[1-9](?:[\s.\-]?\d{2}){4}/',

        // Adresse email tierce (évite de logguer l'email client)
        'EMAIL' => '/[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/',

        // Coordonnées GPS : 48.8566, 2.3522
        'GPS' => '/\b\d{1,2}\.\d{4,},\s*\d{1,3}\.\d{4,}\b/',
    ];

    /**
     * Remplace chaque donnée sensible par un placeholder unique.
     *
     * @return array{text: string, map: array<string,string>}
     */
    public function anonymize(string $text): array
    {
        $map     = [];
        $counter = [];

        foreach ($this->patterns as $type => $pattern) {
            $text = preg_replace_callback($pattern, function (array $matches) use ($type, &$map, &$counter): string {
                $original = $matches[0];

                // Déjà anonymisé → ne pas doubler
                if (str_starts_with($original, '[') && str_ends_with($original, ']')) {
                    return $original;
                }

                $counter[$type] = ($counter[$type] ?? 0) + 1;
                $placeholder = "[{$type}_REDACTED_{$counter[$type]}]";
                $map[$placeholder] = $original;

                return $placeholder;
            }, $text) ?? $text;
        }

        return ['text' => $text, 'map' => $map];
    }

    /**
     * Réinsère les valeurs réelles dans la réponse IA après génération.
     */
    public function restore(string $text, array $map): string
    {
        if (empty($map)) {
            return $text;
        }

        return str_replace(array_keys($map), array_values($map), $text);
    }

    /**
     * Indique si le texte contient au moins une donnée sensible détectable.
     */
    public function hasSensitiveData(string $text): bool
    {
        foreach ($this->patterns as $pattern) {
            if (preg_match($pattern, $text)) {
                return true;
            }
        }

        return false;
    }
}
