<?php

namespace App\Http\Controllers;

use App\Models\CallReport;
use App\Services\ActivityLogService;
use App\Services\GeminiService;
use App\Services\GroqService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class CallReportController extends Controller
{
    private function withFallback(callable $fn): mixed
    {
        try {
            return $fn(app(GeminiService::class));
        } catch (\Exception $e) {
            Log::warning('Gemini unavailable, falling back to Groq: ' . $e->getMessage());
            return $fn(app(GroqService::class));
        }
    }

    public function generate(Request $request): JsonResponse
    {
        $request->validate([
            'client_name'  => 'required|string',
            'demand_type'  => 'required|string',
            'call_summary' => 'required|string|min:10',
        ]);

        $callData = "Client : {$request->client_name}\n"
            . ($request->client_email  ? "Email : {$request->client_email}\n"          : '')
            . ($request->client_phone  ? "Téléphone : {$request->client_phone}\n"       : '')
            . "Type de demande : {$request->demand_type}\n"
            . "Urgence : " . ($request->urgency ?? 'normale') . "\n"
            . ($request->call_duration ? "Durée de l'appel : {$request->call_duration} min\n" : '')
            . "Résumé de l'échange :\n{$request->call_summary}\n"
            . ($request->commitments   ? "Engagements pris :\n{$request->commitments}\n"  : '')
            . ($request->next_steps    ? "Prochaines étapes :\n{$request->next_steps}"    : '');

        try {
            $result = $this->withFallback(fn($ai) => $ai->generateCallReport($callData));

            return response()->json(['success' => true, 'data' => $result]);
        } catch (\Exception $e) {
            Log::error('CallReport generate error: ' . $e->getMessage());
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'client_name'  => 'required|string',
            'demand_type'  => 'required|string',
            'call_summary' => 'required|string',
        ]);

        $report = CallReport::create([
            'user_id'            => auth()->id(),
            'client_name'        => $request->client_name,
            'client_email'       => $request->client_email,
            'client_phone'       => $request->client_phone,
            'demand_type'        => $request->demand_type,
            'call_summary'       => $request->call_summary,
            'commitments'        => $request->commitments,
            'next_steps'         => $request->next_steps,
            'urgency'            => $request->urgency ?? 'normale',
            'call_duration'      => $request->call_duration,
            'ai_response'        => $request->ai_response,
            'validated_response' => $request->validated_response,
            'ai_quality_score'   => $request->ai_quality_score,
            'validated_at'       => now(),
            'status'             => 'validated',
        ]);

        ActivityLogService::log(
            'call_report_created',
            "Compte-rendu d'appel créé pour {$request->client_name}",
            CallReport::class,
            $report->id
        );

        return response()->json([
            'success' => true,
            'data'    => $report,
            'message' => 'Compte-rendu enregistré avec succès.',
        ]);
    }

    public function index(): JsonResponse
    {
        $reports = CallReport::where('user_id', auth()->id())
            ->orderBy('created_at', 'desc')
            ->paginate(20);

        return response()->json(['success' => true, 'data' => $reports]);
    }
}
