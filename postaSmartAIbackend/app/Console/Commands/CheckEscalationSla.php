<?php

namespace App\Console\Commands;

use App\Models\EscalationHistory;
use App\Services\NotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

/**
 * Vérifie les escalades non acquittées depuis plus de 2 heures
 * et notifie les managers pour garantir le respect du SLA La Poste.
 *
 * Planification recommandée (routes/console.php) :
 *   Schedule::command('escalation:check-sla')->everyThirtyMinutes();
 */
class CheckEscalationSla extends Command
{
    protected $signature   = 'escalation:check-sla {--hours=2 : Délai SLA en heures}';
    protected $description = 'Notifie les managers pour les escalades non acquittées hors SLA';

    public function handle(): int
    {
        $hours    = (int) $this->option('hours');
        $overdue  = EscalationHistory::overdueSla($hours)->with(['email', 'escalatedBy'])->get();

        if ($overdue->isEmpty()) {
            $this->info("Aucune escalade hors SLA ({$hours}h).");
            return self::SUCCESS;
        }

        $this->warn("⚠ {$overdue->count()} escalade(s) non acquittée(s) depuis >{$hours}h");

        foreach ($overdue as $esc) {
            $emailSubject = $esc->email?->subject ?? 'Mail inconnu';
            $by           = $esc->escalatedBy?->name ?? 'conseiller';
            $ago          = $esc->created_at->diffForHumans();

            $title   = "🚨 SLA dépassé — escalade non acquittée";
            $message = "Escalade créée {$ago} par {$by} pour le mail « {$emailSubject} » " .
                       "n'a pas été acquittée (SLA : {$hours}h). Action requise immédiatement.";

            // Notifie tous les managers actifs
            NotificationService::sendToRole('manager', 'sla_breach', $title, $message, [
                'escalation_id' => $esc->id,
                'email_id'      => $esc->email_id,
            ]);

            // Marque comme notifié pour éviter le spam
            $esc->update(['sla_notified_at' => now()]);

            Log::warning("[SLA] Escalation #{$esc->id} overdue — managers notified.", [
                'email_id'   => $esc->email_id,
                'created_at' => $esc->created_at->toIso8601String(),
            ]);
        }

        $this->info("✓ {$overdue->count()} notification(s) manager envoyée(s).");

        return self::SUCCESS;
    }
}
