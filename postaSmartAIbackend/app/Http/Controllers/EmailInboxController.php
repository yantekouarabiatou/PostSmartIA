<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Mail\ClientResponseMail;
use App\Models\EmailInbox;
use App\Models\EscalationHistory;
use App\Services\ActivityLogService;
use App\Services\HistoryService;
use App\Services\NotificationService;
use App\Traits\HasAiFallback;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailInboxController extends Controller
{
    use HasAiFallback;

    // ─── Listing & lecture ───────────────────────────────────────────────────

    public function index(Request $request): JsonResponse
    {
        $query = EmailInbox::query();

        if ($request->filled('status') && $request->status !== 'all') {
            if ($request->status === 'archived') {
                $query->where('status', 'archived');
            } else {
                $query->where('status', $request->status)->whereNull('archived_at');
            }
        } else {
            $query->whereNull('archived_at');
        }

        if ($request->filled('source')) {
            $query->where('source', $request->source);
        }

        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function ($q) use ($search) {
                $q->where('subject',    'like', "%{$search}%")
                  ->orWhere('from_name',  'like', "%{$search}%")
                  ->orWhere('from_email', 'like', "%{$search}%")
                  ->orWhere('body_text',  'like', "%{$search}%");
            });
        }

        $emails = $query->orderBy('received_at', 'desc')
                        ->paginate($request->get('per_page', 20));

        return ApiResponse::success($emails, 'Mails récupérés');
    }

    public function show(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        if ($email->status === 'unread') {
            $email->update(['is_read' => true, 'status' => 'read']);
        }

        return ApiResponse::success($email->fresh(), 'Mail récupéré');
    }

    public function markAsRead(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update(['is_read' => true, 'status' => $email->status === 'unread' ? 'read' : $email->status]);
        return ApiResponse::success($email, 'Mail marqué comme lu');
    }

    // ─── Analyse IA ──────────────────────────────────────────────────────────

    public function analyzeAndRespond(Request $request, int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        try {
            $content          = $email->body_text ?: strip_tags($email->body_html ?? '');
            $analysis         = $this->withAiFallback(fn($ai) => $ai->analyzeEmail($content));
            $detectedLanguage = $analysis['detected_language'] ?? 'fr';
            $response         = $this->withAiFallback(fn($ai) => $ai->generateEmailResponse($content, $analysis['service_type'] ?? 'autre', $detectedLanguage));

            $qualityScore = $response['quality_score'] ?? null;

            // Détection automatique des signaux d'escalade
            $daysSinceFirst = $email->created_at ? (int) now()->diffInDays($email->created_at) : null;
            $escalation     = [];
            try {
                $escalation = $this->withAiFallback(fn($ai) => $ai->detectEscalationSignals(
                    $content,
                    $analysis['service_type'] ?? 'autre',
                    $email->status,
                    $daysSinceFirst
                ));
            } catch (\Exception $escalErr) {
                Log::warning('Escalation detection failed (non-blocking): ' . $escalErr->getMessage());
                $escalation = ['should_escalate' => false, 'urgency_level' => 'none', 'signals_detected' => []];
            }

            // Mise à jour automatique de la priorité selon l'urgence détectée
            $priority = $email->priority ?? 'normal';
            if ($escalation['should_escalate'] ?? false) {
                $priority = match ($escalation['urgency_level'] ?? 'normal') {
                    'immediate' => 'urgent',
                    'high'      => 'high',
                    default     => $priority,
                };
            }

            // Escalade automatique si langue non latine (traitement spécialisé requis)
            $nonLatinLanguages = ['zh', 'ja', 'ko', 'ar', 'he', 'fa', 'ru', 'uk', 'th', 'hi', 'bn', 'ta'];
            if (($analysis['is_foreign_language'] ?? false) && in_array($detectedLanguage, $nonLatinLanguages)) {
                if (!($escalation['should_escalate'] ?? false)) {
                    $escalation['should_escalate']     = true;
                    $escalation['urgency_level']       = $escalation['urgency_level'] ?? 'normal';
                    $escalation['signals_detected'][]  = [
                        'type'        => 'langue_non_latine',
                        'description' => 'Mail reçu dans une langue non latine — traitement spécialisé recommandé',
                        'quote'       => 'Langue détectée : ' . ($analysis['language_name'] ?? $detectedLanguage),
                    ];
                    $escalation['recommended_target']       = $escalation['recommended_target'] ?? 'manager';
                    $escalation['recommended_target_label'] = $escalation['recommended_target_label'] ?? 'Manager';
                    $escalation['explanation']              = 'Mail en langue non latine (' . ($analysis['language_name'] ?? $detectedLanguage) . '). Vérification humaine recommandée avant envoi.';
                }
            }

            // Notification manager si menace légale ou urgence immédiate
            if ($escalation['legal_threat'] ?? false) {
                NotificationService::sendToRole(
                    'manager',
                    'legal_threat',
                    'Menace légale détectée',
                    "Mail de {$email->from_name} — " . ($escalation['explanation'] ?? 'Vérification requise')
                );
            } elseif (($escalation['urgency_level'] ?? '') === 'immediate') {
                NotificationService::sendToRole(
                    'manager',
                    'escalation_needed',
                    'Escalade requise immédiatement',
                    "Mail de {$email->from_name} — " . ($escalation['explanation'] ?? '')
                );
            }

            $overallScore = null;
            if ($qualityScore) {
                $overallScore = $qualityScore['overall']
                    ?? (int) round((
                        ($qualityScore['clarity']    ?? 0) +
                        ($qualityScore['empathy']    ?? 0) +
                        ($qualityScore['compliance'] ?? 0)
                    ) / 3);
            }

            $email->update([
                'is_processed'          => true,
                'processed_at'          => now(),
                'status'                => 'processing',
                'ai_service_type'       => $analysis['service_type'] ?? null,
                'ai_response'           => $response['body'] ?? null,
                'ai_quality_score_json' => $qualityScore,
                'ai_quality_score'      => $overallScore,
                'priority'              => $priority,
            ]);

            ActivityLogService::log('mail_processed', "Mail analysé : {$email->subject}", EmailInbox::class, $id);

            return ApiResponse::success([
                'email'      => $email->fresh(),
                'analysis'   => $analysis,
                'response'   => $response,
                'escalation' => $escalation,
            ], 'Mail analysé et réponse générée');
        } catch (\Exception $e) {
            Log::error('EmailInbox analyze error: ' . $e->getMessage());
            return ApiResponse::error(null, 'Erreur IA : ' . $e->getMessage(), 503);
        }
    }

    // Alias de compatibilité avec l'ancienne route /process
    public function process(Request $request, int $id): JsonResponse
    {
        return $this->analyzeAndRespond($request, $id);
    }

    // ─── Validation & envoi ──────────────────────────────────────────────────

    public function validateResponse(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'action'             => 'required|in:validate,reject',
            'validated_response' => 'required_if:action,validate|nullable|string',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        if ($request->action === 'validate') {
            $email->update([
                'validated_response' => $request->validated_response,
                'validated_at'       => now(),
                'validated_by'       => auth()->id(),
                'status'             => 'resolved',
            ]);
            return ApiResponse::success($email->fresh(), 'Réponse validée, mail résolu.');
        }

        $email->update(['ai_response' => null, 'ai_quality_score_json' => null, 'status' => 'read']);
        return ApiResponse::success($email->fresh(), 'Réponse rejetée.');
    }

    public function sendToClient(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'subject' => 'required|string|max:255',
            'body'    => 'required|string',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        try {
            Mail::to($email->from_email)->send(new ClientResponseMail(
                clientName:  $email->from_name ?? '',
                subject:     $request->subject,
                body:        $request->body,
                advisorName: auth()->user()->full_name,
            ));

            $email->update([
                'validated_response' => $request->body,
                'validated_at'       => now(),
                'validated_by'       => auth()->id(),
                'status'             => 'resolved',
            ]);

            HistoryService::record('email_sent', $email->fresh(), auth()->user());

            NotificationService::send(
                auth()->id(),
                'email_sent',
                'Mail envoyé',
                "Réponse envoyée à {$email->from_email} avec succès."
            );

            return ApiResponse::success($email->fresh(), "Mail envoyé à {$email->from_email} avec succès !");
        } catch (\Exception $e) {
            Log::error('Mail send error: ' . $e->getMessage());
            return ApiResponse::error(null, 'Erreur envoi : ' . $e->getMessage(), 500);
        }
    }

    // ─── Statuts ─────────────────────────────────────────────────────────────

    public function archive(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');
        $email->update(['status' => 'archived', 'archived_at' => now()]);
        return ApiResponse::success(null, 'Mail archivé.');
    }

    public function unarchive(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');
        $email->update(['status' => 'resolved', 'archived_at' => null]);
        return ApiResponse::success(null, 'Mail désarchivé.');
    }

    public function markPending(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'internal_note' => 'nullable|string',
            'follow_up_at'  => 'nullable|date',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update([
            'status'        => 'pending',
            'internal_note' => $request->internal_note,
            'follow_up_at'  => $request->follow_up_at ? \Carbon\Carbon::parse($request->follow_up_at) : null,
        ]);

        return ApiResponse::success($email->fresh(), 'Mail mis en attente.');
    }

    public function markPartial(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'resolved_points' => 'nullable|array',
            'open_points'     => 'nullable|array',
            'internal_note'   => 'nullable|string',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update([
            'status'          => 'partial',
            'resolved_points' => $request->resolved_points ?? [],
            'open_points'     => $request->open_points ?? [],
            'internal_note'   => $request->internal_note,
        ]);

        return ApiResponse::success($email->fresh(), 'Traitement partiel enregistré.');
    }

    // ─── Escalade ────────────────────────────────────────────────────────────

    public function escalate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'escalated_to'         => 'required|string',              // rôle : 'manager', 'specialiste'…
            'escalated_to_user_id' => 'nullable|integer|exists:users,id', // utilisateur spécifique (optionnel)
            'internal_note'        => 'nullable|string',
            'urgency_level'        => 'nullable|in:immediate,high,normal',
            'signals_detected'     => 'nullable|array',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update([
            'status'               => 'escalated',
            'escalated_to'         => $request->escalated_to,
            'escalated_to_user_id' => $request->escalated_to_user_id,
            'internal_note'        => $request->internal_note,
        ]);

        // Audit trail — enregistrement dans l'historique d'escalades
        $history = EscalationHistory::create([
            'email_id'             => $email->id,
            'escalated_by'         => auth()->id(),
            'escalated_to_user_id' => $request->escalated_to_user_id,
            'escalated_to_role'    => $request->escalated_to,
            'reason'               => $request->internal_note,
            'urgency_level'        => $request->urgency_level ?? 'normal',
            'signals_detected'     => $request->signals_detected,
        ]);

        // Notification du rôle destinataire
        NotificationService::sendToRole(
            $request->escalated_to,
            'email_escalated',
            'Mail escaladé',
            "Un mail de {$email->from_name} vous a été escaladé : {$email->subject}",
            ['escalation_id' => $history->id, 'email_id' => $email->id]
        );

        // Notification individuelle si utilisateur spécifique désigné
        if ($request->escalated_to_user_id) {
            NotificationService::send(
                $request->escalated_to_user_id,
                'email_escalated_direct',
                'Mail escaladé — assignation directe',
                "Le mail « {$email->subject} » de {$email->from_name} vous est assigné.",
                ['escalation_id' => $history->id, 'email_id' => $email->id]
            );
        }

        return ApiResponse::success([
            'email'      => $email->fresh(),
            'escalation' => $history,
        ], 'Mail escaladé.');
    }

    /**
     * Accusé de réception d'une escalade.
     * La personne désignée confirme qu'elle prend en charge le dossier.
     */
    public function acknowledgeEscalation(Request $request, int $id): JsonResponse
    {
        // $id = email_id ici (la route est /emails/{id}/escalate/acknowledge)
        $escalation = EscalationHistory::where('email_id', $id)
            ->whereNull('acknowledged_at')
            ->latest()
            ->first();

        if (!$escalation) {
            return ApiResponse::error(null, 'Aucune escalade en attente pour ce mail.', 404);
        }

        $escalation->update([
            'acknowledged_at' => now(),
            'acknowledged_by' => auth()->id(),
        ]);

        // Notifier le conseiller qui a escaladé
        NotificationService::send(
            $escalation->escalated_by,
            'escalation_acknowledged',
            'Escalade prise en charge',
            "L'escalade du mail « {$escalation->email?->subject} » a été acquittée par " . auth()->user()->name . '.'
        );

        return ApiResponse::success($escalation->fresh(), 'Escalade acquittée.');
    }

    // ─── Priorité ────────────────────────────────────────────────────────────

    public function updatePriority(Request $request, int $id): JsonResponse
    {
        $request->validate(['priority' => 'required|in:low,normal,high,urgent']);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update(['priority' => $request->priority]);
        return ApiResponse::success($email->fresh(), 'Priorité mise à jour.');
    }

    // ─── Sync IMAP ───────────────────────────────────────────────────────────

    public function sync(): JsonResponse
    {
        try {
            $mailbox = app(\App\Services\MailboxService::class);
            $emails  = $mailbox->fetchUnreadEmails();
            $count   = 0;
            foreach ($emails as $emailData) {
                $mailbox->syncEmailToDatabase($emailData);
                $count++;
            }
            return ApiResponse::success(['count' => $count], "{$count} mail(s) synchronisé(s)");
        } catch (\Exception $e) {
            Log::warning('Email sync error: ' . $e->getMessage());
            return ApiResponse::success(['count' => 0], 'Synchronisation ignorée');
        }
    }

    // ─── Stats & compteurs ───────────────────────────────────────────────────

    public function counts(): JsonResponse
    {
        $base = EmailInbox::whereNull('archived_at');

        return ApiResponse::success([
            'all'       => (clone $base)->count(),
            'unread'    => (clone $base)->where('status', 'unread')->count(),
            'pending'   => (clone $base)->where('status', 'pending')->count(),
            'partial'   => (clone $base)->where('status', 'partial')->count(),
            'escalated' => (clone $base)->where('status', 'escalated')->count(),
            'resolved'  => EmailInbox::where('status', 'resolved')->count(),
            'archived'  => EmailInbox::where('status', 'archived')->count(),
        ], 'Compteurs statuts');
    }

    public function stats(): JsonResponse
    {
        $userId = auth()->id();
        $today  = now()->toDateString();

        $emailsToday = EmailInbox::where('validated_by', $userId)
            ->whereDate('validated_at', $today)
            ->count();

        $totalProcessed = EmailInbox::where('validated_by', $userId)
            ->whereIn('status', ['resolved', 'archived'])
            ->count();

        $allWithScore = EmailInbox::whereNotNull('ai_quality_score_json')->get();

        $scores = $allWithScore->map(function ($email) {
            try {
                $score = $email->ai_quality_score_json;
                if (!is_array($score)) return null;

                $overall = $score['overall']
                    ?? $score['global']
                    ?? (int) round((
                        ($score['clarity']    ?? 0) +
                        ($score['empathy']    ?? 0) +
                        ($score['compliance'] ?? 0)
                    ) / 3);

                return $overall > 0 ? $overall : null;
            } catch (\Exception $e) {
                return null;
            }
        })->filter()->values();

        $avgScore = $scores->count() > 0 ? (int) round($scores->average()) : 0;

        $weekScores = EmailInbox::whereNotNull('ai_quality_score_json')
            ->whereBetween('created_at', [now()->subDays(7), now()])
            ->get()
            ->map(function ($email) {
                try {
                    $score = $email->ai_quality_score_json;
                    if (!is_array($score)) return null;
                    $v = $score['overall'] ?? null;
                    return ($v && $v > 0) ? $v : null;
                } catch (\Exception $e) {
                    return null;
                }
            })->filter()->values();

        $avgScoreWeek = $weekScores->count() > 0 ? (int) round($weekScores->average()) : $avgScore;

        return ApiResponse::success([
            'emails_today'    => $emailsToday,
            'total_processed' => $totalProcessed,
            'avg_score'       => $avgScore,
            'avg_score_week'  => $avgScoreWeek,
            'score_count'     => $scores->count(),
            'time_saved'      => $totalProcessed * 15,
            'pending'         => EmailInbox::whereNotIn('status', ['resolved', 'archived'])->count(),
            'unread'          => EmailInbox::where('is_read', false)->count(),
        ], 'Statistiques mails');
    }
}
