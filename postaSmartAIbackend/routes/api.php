<?php

use App\Http\Controllers\AuthController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\EmailHistoryController;
use App\Http\Controllers\KnowledgeBaseController;
use App\Http\Controllers\UserController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Public routes
Route::post('/login', [AuthController::class, 'login']);
Route::post('/register', [AuthController::class, 'register']);

// Protected routes (require authentication)
Route::middleware('auth:sanctum')->group(function () {
    // Auth routes
    Route::get('/user', [AuthController::class, 'user']);
    Route::post('/logout', [AuthController::class, 'logout']);

    // Email History routes
    Route::post('/email-histories/generate', [EmailHistoryController::class, 'generate']);
    Route::post('/email-histories/{emailHistory}/regenerate', [EmailHistoryController::class, 'regenerate']);
    Route::apiResource('email-histories', EmailHistoryController::class);

    // Knowledge Base routes (read-only for all, write for admin/manager)
    Route::apiResource('knowledge-base', KnowledgeBaseController::class, [
        'parameters' => ['knowledge_base' => 'knowledgeBase'],
    ]);

    // Dashboard routes
    Route::get('/dashboard/stats', [DashboardController::class, 'stats']);

    // Admin-only routes
    Route::middleware('role:admin')->group(function () {
        Route::apiResource('users', UserController::class);
    });
});
