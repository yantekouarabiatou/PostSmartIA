<?php

namespace App\Http\Controllers;

use App\Http\Resources\ApiResponse;
use App\Models\ResponseTemplate;
use App\Services\ActivityLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ResponseTemplateController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $query = ResponseTemplate::where('is_active', true);

        if ($request->filled('service_type')) {
            $query->where(function ($q) use ($request) {
                $q->where('service_type', $request->service_type)
                  ->orWhereNull('service_type');
            });
        }

        if ($request->filled('search')) {
            $query->where('title', 'like', '%' . $request->search . '%');
        }

        $templates = $query
            ->with('creator:id,first_name,last_name')
            ->orderByDesc('use_count')
            ->orderBy('title')
            ->get();

        return ApiResponse::success($templates, 'Modèles récupérés');
    }

    public function show(int $id): JsonResponse
    {
        $template = ResponseTemplate::find($id);
        if (!$template) return ApiResponse::notFound('Modèle introuvable');
        return ApiResponse::success($template, 'Modèle récupéré');
    }

    public function store(Request $request): JsonResponse
    {
        if (!in_array($request->user()->role, ['manager', 'admin'])) {
            return ApiResponse::forbidden('Réservé aux managers et administrateurs.');
        }
        $request->validate([
            'title'        => 'required|string|max:120',
            'content'      => 'required|string',
            'category'     => 'nullable|string|max:60',
            'service_type' => 'nullable|string|max:60',
        ]);

        $template = ResponseTemplate::create([
            'title'        => $request->input('title'),
            'content'      => $request->input('content'),
            'category'     => $request->input('category', 'general'),
            'service_type' => $request->input('service_type'),
            'is_active'    => true,
            'use_count'    => 0,
            'created_by'   => $request->user()->id,
        ]);

        ActivityLogService::log('template_created', "Modèle créé : {$template->title}");

        return ApiResponse::success($template, 'Modèle créé', 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        if (!in_array($request->user()->role, ['manager', 'admin'])) {
            return ApiResponse::forbidden('Réservé aux managers et administrateurs.');
        }
        $template = ResponseTemplate::find($id);
        if (!$template) return ApiResponse::notFound('Modèle introuvable');

        $request->validate([
            'title'        => 'sometimes|string|max:120',
            'content'      => 'sometimes|string',
            'category'     => 'nullable|string|max:60',
            'service_type' => 'nullable|string|max:60',
            'is_active'    => 'sometimes|boolean',
        ]);

        $template->update(array_filter([
            'title'        => $request->input('title'),
            'content'      => $request->input('content'),
            'category'     => $request->input('category'),
            'service_type' => $request->input('service_type'),
            'is_active'    => $request->has('is_active') ? $request->boolean('is_active') : null,
        ], fn ($v) => $v !== null));

        ActivityLogService::log(
            'template_updated',
            "Modèle modifié : {$template->title}",
            $request->user()->id,
        );

        return ApiResponse::success($template->fresh(), 'Modèle mis à jour');
    }

    public function destroy(Request $request, int $id): JsonResponse
    {
        if (!in_array($request->user()->role, ['manager', 'admin'])) {
            return ApiResponse::forbidden('Réservé aux managers et administrateurs.');
        }
        $template = ResponseTemplate::find($id);
        if (!$template) return ApiResponse::notFound('Modèle introuvable');

        $title = $template->title;
        $template->delete();

        ActivityLogService::log(
            'template_deleted',
            "Modèle supprimé : {$title}",
            $request->user()->id,
        );

        return ApiResponse::success(null, 'Modèle supprimé');
    }

    public function use(int $id): JsonResponse
    {
        $template = ResponseTemplate::find($id);
        if (!$template) return ApiResponse::notFound('Modèle introuvable');

        $template->increment('use_count');

        return ApiResponse::success([
            'content' => $template->content,
            'title'   => $template->title,
        ], 'Modèle utilisé');
    }
}
