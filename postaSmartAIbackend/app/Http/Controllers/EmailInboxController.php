<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\EmailInbox;
use App\Services\ActivityLogService;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailInboxController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = EmailInbox::orderBy('received_at', 'desc');

        if ($request->filled('status')) {
            $query->where('is_processed', $request->status === 'processed');
        }

        if ($request->filled('is_read')) {
            $query->where('is_read', filter_var($request->is_read, FILTER_VALIDATE_BOOLEAN));
        }

        $emails = $query->paginate($request->get('per_page', 20));

        return ApiResponse::success($emails, 'Mails récupérés avec succès');
    }

    public function show(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);

        if (!$email) {
            return ApiResponse::notFound('Mail introuvable');
        }

        return ApiResponse::success($email, 'Mail récupéré avec succès');
    }

    public function markAsRead(int $id): JsonResponse
    {
        $email = EmailInbox::find($id);

        if (!$email) {
            return ApiResponse::notFound('Mail introuvable');
        }

        $email->update(['is_read' => true]);

        return ApiResponse::success($email, 'Mail marqué comme lu');
    }

    public function process(Request $request, int $id): JsonResponse
    {
        $email = EmailInbox::find($id);

        if (!$email) {
            return ApiResponse::notFound('Mail introuvable');
        }

        try {
            $groq     = app(GroqService::class);
            $content  = $email->body_text ?: strip_tags($email->body_html ?? '');
            $analysis = $groq->analyzeEmail($content);
            $response = $groq->generateEmailResponse($content, $analysis['service_type'] ?? '');

            $email->update([
                'is_processed'    => true,
                'processed_at'    => now(),
                'ai_response'     => $response['body'] ?? '',
                'ai_service_type' => $analysis['service_type'] ?? '',
                'ai_quality_score'=> $response['quality_score']['clarity'] ?? null,
            ]);

            ActivityLogService::log('mail_processed', "Mail traité: {$email->subject} (de {$email->from_email})", EmailInbox::class, $id);

            return ApiResponse::success([
                'email'    => $email->fresh(),
                'analysis' => $analysis,
                'response' => $response,
            ], 'Mail analysé et réponse générée avec succès');
        } catch (\Exception $e) {
            return ApiResponse::error(null, 'Erreur lors du traitement IA: ' . $e->getMessage(), 503);
        }
    }
}
