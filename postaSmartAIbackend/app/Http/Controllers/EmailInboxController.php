<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\EmailInbox;
use App\Services\ActivityLogService;
use App\Services\GeminiService;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

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

            $email->update([
                'is_processed'         => true,
                'processed_at'         => now(),
                'status'               => 'processing',
                'ai_service_type'      => $analysis['service_type'] ?? null,
                'ai_response'          => $response['body'] ?? null,
                'ai_quality_score_json'=> $response['quality_score'] ?? null,
            ]);

            ActivityLogService::log('mail_processed', "Mail analysé : {$email->subject}", EmailInbox::class, $id);

            return ApiResponse::success([
                'email'    => $email->fresh(),
                'analysis' => $analysis,
                'response' => $response,
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
}
