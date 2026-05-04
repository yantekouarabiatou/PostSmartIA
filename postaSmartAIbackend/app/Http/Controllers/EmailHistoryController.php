<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreEmailHistoryRequest;
use App\Http\Requests\UpdateEmailHistoryRequest;
use App\Http\Resources\ApiResponse;
use App\Models\EmailHistory;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class EmailHistoryController extends Controller
{
    /**
     * Display a paginated listing of email histories
     */
    public function index(Request $request): JsonResponse
    {
        $query = EmailHistory::query();

        // Filter by user if not admin
        if (!$request->user()->isAdmin()) {
            $query->where('user_id', $request->user()->id);
        }

        // Filter by date range
        if ($request->filled('start_date') && $request->filled('end_date')) {
            $query->byDateRange($request->start_date, $request->end_date);
        }

        // Filter by status
        if ($request->filled('status')) {
            $query->byStatus($request->status);
        }

        // Filter by client email
        if ($request->filled('client_email')) {
            $query->byClientEmail($request->client_email);
        }

        $emailHistories = $query
            ->with('user')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return ApiResponse::success($emailHistories, 'Email histories retrieved successfully', 200);
    }

    /**
     * Store a newly created email history
     */
    public function store(StoreEmailHistoryRequest $request): JsonResponse
    {
        $emailHistory = $request->user()->emailHistories()->create(
            array_merge($request->validated(), ['status' => 'draft'])
        );

        return ApiResponse::success($emailHistory, 'Email history created successfully', 201);
    }

    /**
     * Display the specified email history
     */
    public function show(EmailHistory $emailHistory, Request $request): JsonResponse
    {
        $this->authorize('view', $emailHistory);

        return ApiResponse::success($emailHistory->load('user'), 'Email history retrieved successfully', 200);
    }

    /**
     * Update the specified email history
     */
    public function update(UpdateEmailHistoryRequest $request, EmailHistory $emailHistory): JsonResponse
    {
        $this->authorize('update', $emailHistory);

        $emailHistory->update($request->validated());

        return ApiResponse::success($emailHistory, 'Email history updated successfully', 200);
    }

    /**
     * Delete the specified email history
     */
    public function destroy(EmailHistory $emailHistory, Request $request): JsonResponse
    {
        $this->authorize('delete', $emailHistory);

        $emailHistory->delete();

        return ApiResponse::success(null, 'Email history deleted successfully', 200);
    }

    /**
     * Generate a new email using AI simulation
     */
    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'notes' => 'required|string',
            'client_email' => 'required|string|email',
            'client_name' => 'nullable|string',
        ]);

        // Simulate AI email generation
        $simulatedContent = $this->generateSimulatedEmail(
            $request->notes,
            $request->client_name
        );

        $emailHistory = $request->user()->emailHistories()->create([
            'client_email' => $request->client_email,
            'client_name' => $request->client_name,
            'subject' => $this->generateSimulatedSubject($request->notes),
            'content' => $simulatedContent,
            'status' => 'draft',
        ]);

        return ApiResponse::success($emailHistory, 'Email generated successfully', 201);
    }

    /**
     * Regenerate the email content
     */
    public function regenerate(Request $request, EmailHistory $emailHistory): JsonResponse
    {
        $this->authorize('update', $emailHistory);

        // Simulate AI regeneration
        $newContent = $this->generateSimulatedEmail(
            'Modification demandée: ' . $emailHistory->subject,
            $emailHistory->client_name
        );

        $emailHistory->update([
            'content' => $newContent,
            'status' => 'modified',
        ]);

        return ApiResponse::success($emailHistory, 'Email regenerated successfully', 200);
    }

    /**
     * Generate simulated email subject
     */
    private function generateSimulatedSubject(string $notes): string
    {
        $subjects = [
            'Réponse à votre demande',
            'Suivi de votre dossier',
            'Informations supplémentaires',
            'Confirmation de traitement',
            'Mise à jour importante',
            'Réponse à votre question',
        ];

        return $subjects[array_rand($subjects)];
    }

    /**
     * Generate simulated email content
     */
    private function generateSimulatedEmail(string $notes, ?string $clientName): string
    {
        $greetings = $clientName ? "Madame, Monsieur {$clientName}," : "Madame, Monsieur,";

        $templates = [
            "Nous avons bien reçu votre demande. Suite à votre remarque concernant {$notes}, nous vous confirmons que votre dossier est en cours de traitement.\n\nNous vous tiendrons informé de l'avancement dans les prochains jours.\n\nCordialement,\nL'équipe PostSmartAI",

            "Thank you for contacting us. Regarding your concern: {$notes}\n\nOur team is actively working on your request. We will provide you with an update shortly.\n\nBest regards,\nThe PostSmartAI Team",

            "Suite à votre appel concernant {$notes}, nous vous confirmons que nous avons bien noté tous les détails de votre demande.\n\nNotre équipe spécialisée va traiter votre dossier en priorité.\n\nCordialement,\nL'équipe PostSmartAI",
        ];

        $template = $templates[array_rand($templates)];

        return "{$greetings}\n\n{$template}";
    }
}
