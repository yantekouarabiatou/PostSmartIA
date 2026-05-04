<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreKnowledgeBaseRequest;
use App\Http\Requests\UpdateKnowledgeBaseRequest;
use App\Http\Resources\ApiResponse;
use App\Models\KnowledgeBase;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class KnowledgeBaseController extends Controller
{
    /**
     * Display a listing of knowledge base items
     */
    public function index(Request $request): JsonResponse
    {
        $query = KnowledgeBase::active();

        // Search by title or description
        if ($request->filled('search')) {
            $query->search($request->search);
        }

        // Filter by type
        if ($request->filled('type')) {
            $query->byType($request->type);
        }

        // Filter by tag
        if ($request->filled('tag')) {
            $query->byTag($request->tag);
        }

        $knowledgeBase = $query
            ->with('creator')
            ->orderBy('created_at', 'desc')
            ->paginate($request->per_page ?? 15);

        return ApiResponse::success($knowledgeBase, 'Knowledge base items retrieved successfully', 200);
    }

    /**
     * Store a newly created knowledge base item
     */
    public function store(StoreKnowledgeBaseRequest $request): JsonResponse
    {
        $knowledgeBase = KnowledgeBase::create(
            array_merge($request->validated(), ['created_by' => $request->user()->id])
        );

        return ApiResponse::success($knowledgeBase, 'Knowledge base item created successfully', 201);
    }

    /**
     * Display the specified knowledge base item
     */
    public function show(KnowledgeBase $knowledgeBase): JsonResponse
    {
        if (!$knowledgeBase->is_active) {
            return ApiResponse::notFound('Knowledge base item not found');
        }

        return ApiResponse::success(
            $knowledgeBase->load('creator'),
            'Knowledge base item retrieved successfully',
            200
        );
    }

    /**
     * Update the specified knowledge base item
     */
    public function update(UpdateKnowledgeBaseRequest $request, KnowledgeBase $knowledgeBase): JsonResponse
    {
        $knowledgeBase->update($request->validated());

        return ApiResponse::success($knowledgeBase, 'Knowledge base item updated successfully', 200);
    }

    /**
     * Delete the specified knowledge base item
     */
    public function destroy(KnowledgeBase $knowledgeBase): JsonResponse
    {
        $knowledgeBase->delete();

        return ApiResponse::success(null, 'Knowledge base item deleted successfully', 200);
    }
}
