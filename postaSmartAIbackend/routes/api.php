<?php

use App\Http\Controllers\AiController;
use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailHistoryController;
use App\Http\Controllers\EmailInboxController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\LogController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\UserController;
use Illuminate\Support\Facades\Route;

// ─── Routes publiques ───────────────────────────────────────────────────────
Route::post('/auth/login',          [AuthController::class, 'login']);
Route::post('/auth/register',       [AuthController::class, 'register']);
Route::post('/auth/forgot-password',[AuthController::class, 'forgotPassword']);
Route::post('/auth/reset-password', [AuthController::class, 'resetPassword']);

// ─── Routes protégées (Sanctum) ─────────────────────────────────────────────
Route::middleware('auth:sanctum')->group(function () {

    // Auth
    Route::get('/auth/me',      [AuthController::class, 'user']);
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::put('/auth/profile', [AuthController::class, 'updateProfile']);

    // Dashboard
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Email History (module génération)
    Route::post('/email-histories/generate',              [EmailHistoryController::class, 'generate']);
    Route::post('/email-histories/{emailHistory}/regenerate', [EmailHistoryController::class, 'regenerate']);
    Route::apiResource('email-histories', EmailHistoryController::class);

    // Knowledge Base
    Route::apiResource('knowledge-base', KnowledgeBaseController::class, [
        'parameters' => ['knowledge_base' => 'knowledgeBase'],
    ]);

    // AI – modules 1, 2, 3
    Route::prefix('ai')->group(function () {
        Route::post('/analyze',           [AiController::class, 'analyzeIncoming']);
        Route::post('/generate-response', [AiController::class, 'generateResponse']);
        Route::post('/improve',           [AiController::class, 'improveEmail']);
        Route::post('/call-report',       [AiController::class, 'generateCallReport']);
        Route::post('/chat',              [AiController::class, 'chat']);
    });

    // Boîte mail IMAP
    Route::get('/emails',              [EmailInboxController::class, 'index']);
    Route::get('/emails/{id}',         [EmailInboxController::class, 'show']);
    Route::put('/emails/{id}/read',    [EmailInboxController::class, 'markAsRead']);
    Route::post('/emails/{id}/process',[EmailInboxController::class, 'process']);

    // Notifications
    Route::get('/notifications',                      [NotificationController::class, 'index']);
    Route::put('/notifications/{id}/read',            [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/read-all',             [NotificationController::class, 'markAllAsRead']);

    // ─── Manager + Admin ────────────────────────────────────────────────────
    Route::middleware('role:manager,admin')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
    });

    // ─── Admin uniquement ───────────────────────────────────────────────────
    Route::middleware('role:admin')->group(function () {
        Route::post('/users',                    [UserController::class, 'store']);
        Route::get('/users/{id}',                [UserController::class, 'show']);
        Route::put('/users/{id}',                [UserController::class, 'update']);
        Route::delete('/users/{id}',             [UserController::class, 'destroy']);
        Route::put('/users/{id}/toggle-active',  [UserController::class, 'toggleActive']);

        Route::get('/logs', [LogController::class, 'index']);
    });
});
