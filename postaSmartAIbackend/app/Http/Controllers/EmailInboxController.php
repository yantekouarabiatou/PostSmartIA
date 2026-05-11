<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Mail\ClientResponseMail;
use App\Models\EmailInbox;
use App\Services\ActivityLogService;
use App\Services\GeminiService;
use App\Services\GroqService;
use App\Services\HistoryService;
use App\Services\MailboxService;
use App\Services\NotificationService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;

class EmailInboxController extends Controller
{
    private function aiCall(callable $fn): mixed
    {
        try {
            return $fn(app(GeminiService::class));
        } catch (\Exception $e) {
            Log::warning('Gemini unavailable, falling back to Groq: ' . $e->getMessage());
            return $fn(app(GroqService::class));
        }
    }

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

    public function analyzeAndRespond(Request $request, int $id): JsonResponse
    {
        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        try {
            $content  = $email->body_text ?: strip_tags($email->body_html ?? '');
            $analysis = $this->aiCall(fn($ai) => $ai->analyzeEmail($content));
            $response = $this->aiCall(fn($ai) => $ai->generateEmailResponse($content, $analysis['service_type'] ?? 'autre'));

            $qualityScore = $response['quality_score'] ?? null;

            Log::info('Quality score received', [
                'email_id'      => $email->id,
                'score'         => $qualityScore,
                'response_keys' => array_keys($response),
            ]);

            // Détection automatique des signaux d'escalade
            $daysSinceFirst = $email->created_at ? (int) now()->diffInDays($email->created_at) : null;
            $escalation     = [];
            try {
                $escalation = $this->aiCall(fn($ai) => $ai->detectEscalationSignals(
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

            // Notification manager si menace légale ou urgence immédiate
            if ($escalation['legal_threat'] ?? false) {
                NotificationService::sendToRole(
                    'manager',
                    'legal_threat',
                    '⚖️ Menace légale détectée',
                    "Mail de {$email->from_name} — " . ($escalation['explanation'] ?? 'Vérification requise')
                );
            } elseif (($escalation['urgency_level'] ?? '') === 'immediate') {
                NotificationService::sendToRole(
                    'manager',
                    'escalation_needed',
                    '🚨 Escalade requise immédiatement',
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
                'is_processed'         => true,
                'processed_at'         => now(),
                'status'               => 'processing',
                'ai_service_type'      => $analysis['service_type'] ?? null,
                'ai_response'          => $response['body'] ?? null,
                'ai_quality_score_json'=> $qualityScore,          // JSON column (cast array)
                'ai_quality_score'     => $overallScore,           // INTEGER column (overall seulement)
                'priority'             => $priority,
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

    // Keep legacy route alias
    public function process(Request $request, int $id): JsonResponse
    {
        return $this->analyzeAndRespond($request, $id);
    }

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

            return ApiResponse::success(
                $email->fresh(),
                "Mail envoyé à {$email->from_email} avec succès !"
            );
        } catch (\Exception $e) {
            Log::error('Mail send error: ' . $e->getMessage());
            return ApiResponse::error(null, 'Erreur envoi : ' . $e->getMessage(), 500);
        }
    }

    public function sync(): JsonResponse
    {
        try {
            $mailbox = app(MailboxService::class);
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

    public function escalate(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'escalated_to'  => 'required|string',
            'internal_note' => 'nullable|string',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update([
            'status'        => 'escalated',
            'escalated_to'  => $request->escalated_to,
            'internal_note' => $request->internal_note,
        ]);

        NotificationService::sendToRole(
            $request->escalated_to,
            'email_escalated',
            'Mail escaladé',
            "Un mail de {$email->from_name} vous a été escaladé : {$email->subject}"
        );

        return ApiResponse::success($email->fresh(), 'Mail escaladé.');
    }

    public function updatePriority(Request $request, int $id): JsonResponse
    {
        $request->validate([
            'priority' => 'required|in:low,normal,high,urgent',
        ]);

        $email = EmailInbox::find($id);
        if (!$email) return ApiResponse::notFound('Mail introuvable');

        $email->update(['priority' => $request->priority]);

        return ApiResponse::success($email->fresh(), 'Priorité mise à jour.');
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

        // ai_quality_score_json est casté en array par le modèle — on lit directement le JSON complet
        $allWithScore = EmailInbox::whereNotNull('ai_quality_score_json')->get();

        $scores = $allWithScore->map(function ($email) {
            try {
                $score = $email->ai_quality_score_json; // déjà array (cast model)
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

        $avgScoreWeek = $weekScores->count() > 0
            ? (int) round($weekScores->average())
            : $avgScore;

        $scoreCount = $scores->count();

        Log::info('Stats calculated', [
            'avg_score'   => $avgScore,
            'score_count' => $scoreCount,
            'user_id'     => $userId,
        ]);

        $timeSaved = $totalProcessed * 15;

        $pending = EmailInbox::whereNotIn('status', ['resolved', 'archived'])->count();
        $unread  = EmailInbox::where('is_read', false)->count();

        return ApiResponse::success([
            'emails_today'    => $emailsToday,
            'total_processed' => $totalProcessed,
            'avg_score'       => $avgScore,
            'avg_score_week'  => $avgScoreWeek,
            'score_count'     => $scoreCount,
            'time_saved'      => $timeSaved,
            'pending'         => $pending,
            'unread'          => $unread,
        ], 'Statistiques mails');
    }
}
