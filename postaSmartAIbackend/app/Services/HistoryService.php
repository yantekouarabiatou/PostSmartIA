<?php

namespace App\Services;

class HistoryService
{
    public static function record(string $action, object $model, object $user): void
    {
        // full_name est l'accessor du modèle User (first_name + last_name)
        $name = $user->full_name ?? ($user->first_name ?? 'Système');

        ActivityLogService::logWithoutAuth(
            $action,
            self::buildDescription($action, $model, $name),
            get_class($model),
            $model->id
        );
    }

    private static function buildDescription(string $action, object $model, string $name): string
    {
        return match ($action) {
            'email_analyzed'  => "{$name} a analysé un mail de " . ($model->from_name ?? $model->from_email ?? '?'),
            'email_sent'      => "{$name} a envoyé une réponse à " . ($model->from_email ?? '?'),
            'email_validated' => "{$name} a validé la réponse pour " . ($model->from_name ?? $model->from_email ?? '?'),
            'email_archived'  => "{$name} a archivé le mail de " . ($model->from_name ?? $model->from_email ?? '?'),
            'call_created'    => "{$name} a créé un compte-rendu pour " . ($model->client_name ?? '?'),
            'call_sent'       => "{$name} a envoyé le mail post-appel à " . ($model->client_name ?? '?'),
            default           => "{$name} — {$action}",
        };
    }
}
