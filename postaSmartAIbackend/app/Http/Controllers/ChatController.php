<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\KnowledgeBase;
use App\Services\GeminiService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ChatController extends Controller
{
    public function assistant(Request $request): JsonResponse
    {
        $request->validate([
            'messages'              => 'required|array|min:1',
            'messages.*.role'       => 'required|in:user,assistant',
            'messages.*.content'    => 'required|string',
            'context'               => 'nullable|string',
        ]);

        $context = $request->context;

        if (!$context) {
            $kbItems = KnowledgeBase::active()
                ->select(['title', 'description', 'content', 'type'])
                ->limit(10)
                ->get();

            $context = $kbItems->map(fn($item) =>
                "[{$item->type}] {$item->title}\n{$item->description}\n{$item->content}"
            )->implode("\n\n---\n\n");

            $sources = $kbItems->pluck('title')->toArray();
        } else {
            $sources = [];
        }

        try {
            $result            = app(GeminiService::class)->chatAssistant($request->messages, $context);
            $result['sources'] = $sources ?? [];

            return ApiResponse::success($result, 'Réponse générée');
        } catch (\Exception $e) {
            Log::error('Chat assistant error: ' . $e->getMessage());
            return ApiResponse::error(
                null,
                'Le service IA est temporairement indisponible.',
                503
            );
        }
    }
}
