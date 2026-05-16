<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\CallReportController;
use App\Http\Controllers\ChatController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailHistoryController;
use App\Http\Controllers\EmailInboxController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PermissionController;
use App\Http\Controllers\ProfileStatsController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ─── Test Gemini (public) ────────────────────────────────────────────────────
Route::get('/test-gemini', function () {
    try {
        $gemini = app(\App\Services\GeminiService::class);
        $result = $gemini->chatAssistant([
            ['role' => 'user', 'content' => 'Bonjour, teste la connexion PostSmart IA.'],
        ]);
        return response()->json(['success' => true, 'response' => $result['reply'] ?? $result]);
    } catch (\Exception $e) {
        return response()->json(['success' => false, 'error' => $e->getMessage()], 500);
    }
});

// ─── Routes publiques ───────────────────────────────────────────────────────
Route::post('/auth/login',           [AuthController::class, 'login']);
Route::post('/auth/register',        [AuthController::class, 'register']);
Route::post('/auth/forgot-password', [AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password',  [AuthController::class, 'resetPassword']);

// ─── Routes protégées (Sanctum) ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me',      [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard',       [DashboardController::class, 'index']);
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Email History (module génération)
    Route::post('/email-histories/generate',                      [EmailHistoryController::class, 'generate']);
    Route::post('/email-histories/{emailHistory}/regenerate',     [EmailHistoryController::class, 'regenerate']);
    Route::apiResource('email-histories', EmailHistoryController::class);

    // Knowledge Base
    Route::apiResource('knowledge-base', KnowledgeBaseController::class, [
        'parameters' => ['knowledge_base' => 'knowledgeBase'],
    ]);

    // AI – modules 1, 2, 3 + nouvelles fonctionnalités
    Route::prefix('ai')->group(function () {
        Route::post('/analyze',           [AiController::class, 'analyzeIncoming']);
        Route::post('/generate-response', [AiController::class, 'generateResponse']);
        Route::post('/improve',           [AiController::class, 'improveEmail']);
        Route::post('/call-report',       [AiController::class, 'generateCallReport']);
        Route::post('/chat',              [AiController::class, 'chat']);
        Route::post('/translate',         [AiController::class, 'translate']);
        Route::post('/satisfaction',      [AiController::class, 'predictSatisfaction']);
        Route::get('/coach-report',       [AiController::class, 'coachReport']);
        Route::get('/daily-summary',      [AiController::class, 'dailySummary']);
    });

    // Chat assistant
    Route::post('/chat/assistant', [ChatController::class, 'assistant']);

    // Comptes-rendus d'appel
    Route::prefix('call-reports')->group(function () {
        Route::get('/',           [CallReportController::class, 'index']);
        Route::post('/generate',  [CallReportController::class, 'generate']);
        Route::post('/',          [CallReportController::class, 'store']);

        // Vue manager — accessible aux managers et admins uniquement
        Route::middleware('check.permission:view call reports')->group(function () {
            Route::get('/manager-view', [CallReportController::class, 'managerView']);
        });
    });

    // Recherche globale
    Route::get('/search', [SearchController::class, 'global']);

    // Statistiques profil
    Route::get('/profile/stats', [ProfileStatsController::class, 'stats']);

    // ─── Boîte mail IMAP ────────────────────────────────────────────────────
    Route::prefix('emails')->group(function () {
        Route::get('/',    [EmailInboxController::class, 'index']);

        // Routes statiques AVANT /{id} pour éviter la capture par le wildcard
        Route::get('/stats',   [EmailInboxController::class, 'stats']);
        Route::get('/counts',  [EmailInboxController::class, 'counts']);
        Route::post('/sync',   [EmailInboxController::class, 'sync']);
        Route::get('/thread',  [EmailInboxController::class, 'thread']);

        Route::get('/{id}',                        [EmailInboxController::class, 'show']);
        Route::put('/{id}/read',                   [EmailInboxController::class, 'markAsRead']);
        Route::post('/{id}/process',               [EmailInboxController::class, 'process']);
        Route::post('/{id}/analyze',               [EmailInboxController::class, 'analyzeAndRespond']);
        Route::post('/{id}/validate',              [EmailInboxController::class, 'validateResponse']);
        Route::post('/{id}/send-to-client',        [EmailInboxController::class, 'sendToClient']);
        Route::post('/{id}/archive',               [EmailInboxController::class, 'archive']);
        Route::post('/{id}/unarchive',             [EmailInboxController::class, 'unarchive']);
        Route::post('/{id}/pending',               [EmailInboxController::class, 'markPending']);
        Route::post('/{id}/partial',               [EmailInboxController::class, 'markPartial']);
        Route::post('/{id}/escalate',              [EmailInboxController::class, 'escalate']);
        Route::post('/{id}/escalate/acknowledge',  [EmailInboxController::class, 'acknowledgeEscalation']);
        Route::put('/{id}/priority',               [EmailInboxController::class, 'updatePriority']);
    });

    // Notifications
    Route::get('/notifications',               [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read',     [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all',      [NotificationController::class, 'markAllAsRead']);

    // ─── Gestion utilisateurs ───────────────────────────────────────────────
    Route::middleware('check.permission:view users')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
    });

    Route::middleware('check.permission:create users')->group(function () {
        Route::post('/users', [UserController::class, 'store']);
    });

    Route::middleware('check.permission:edit users')->group(function () {
        Route::get('/users/{id}',               [UserController::class, 'show']);
        Route::put('/users/{id}',               [UserController::class, 'update']);
        Route::put('/users/{id}/toggle-active', [UserController::class, 'toggleActive']);
    });

    Route::middleware('check.permission:delete users')->group(function () {
        Route::delete('/users/{id}', [UserController::class, 'destroy']);
    });

    // ─── Journaux d'activité ────────────────────────────────────────────────
    Route::middleware('check.permission:view logs')->group(function () {
        Route::get('/logs', [LogController::class, 'index']);
    });

    // ─── Gestion des permissions ────────────────────────────────────────────
    Route::middleware('check.permission:manage permissions')->group(function () {
        Route::get('/permissions',              [PermissionController::class, 'index']);
        Route::post('/permissions/assign-role', [PermissionController::class, 'assignRole']);
        Route::post('/permissions/assign',      [PermissionController::class, 'assignPermission']);
        Route::post('/permissions/revoke',      [PermissionController::class, 'revokePermission']);
    });
});
