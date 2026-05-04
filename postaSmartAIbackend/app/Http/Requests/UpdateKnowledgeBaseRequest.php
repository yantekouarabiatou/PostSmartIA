<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateKnowledgeBaseRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()->isAdmin() || $this->user()->isManager();
    }

    public function rules(): array
    {
        return [
            'title' => 'sometimes|string|max:255',
            'description' => 'sometimes|string|max:500',
            'type' => ['sometimes', Rule::in(['procedure', 'offre', 'cgv', 'reglementation'])],
            'content' => 'sometimes|string',
            'file_path' => 'nullable|string|max:255',
            'tags' => 'nullable|array',
            'tags.*' => 'string|max:50',
            'is_active' => 'sometimes|boolean',
        ];
    }
}
